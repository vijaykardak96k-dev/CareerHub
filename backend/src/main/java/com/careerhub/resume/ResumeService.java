package com.careerhub.resume;

import com.careerhub.certificate.CertificateDtos;
import com.careerhub.certificate.CertificateRepository;
import com.careerhub.skill.SkillDtos;
import com.careerhub.skill.StudentSkillRepository;
import com.careerhub.student.Student;
import com.careerhub.student.StudentDtos;
import com.careerhub.student.StudentService;
import com.careerhub.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ResumeService {

    private final ResumeRepository resumeRepository;
    private final StudentService studentService;
    private final StudentSkillRepository studentSkillRepository;
    private final CertificateRepository certificateRepository;
    private final ResumePdfGenerator pdfGenerator;

    public ResumeService(ResumeRepository resumeRepository,
                         StudentService studentService,
                         StudentSkillRepository studentSkillRepository,
                         CertificateRepository certificateRepository,
                         ResumePdfGenerator pdfGenerator) {
        this.resumeRepository = resumeRepository;
        this.studentService = studentService;
        this.studentSkillRepository = studentSkillRepository;
        this.certificateRepository = certificateRepository;
        this.pdfGenerator = pdfGenerator;
    }

    /** One resume per student; it is created on first access. */
    public Resume requireResume(Student student) {
        return resumeRepository.findByStudentId(student.getId()).orElseGet(() -> {
            Resume resume = new Resume();
            resume.setStudent(student);
            resume.setTemplate("CLASSIC");
            return resumeRepository.save(resume);
        });
    }

    public ResumeDtos.ResumeView build(User user) {
        Student student = studentService.requireByUser(user);
        Resume resume = requireResume(student);
        return new ResumeDtos.ResumeView(
                StudentDtos.StudentProfile.of(student),
                resume.getSummary() != null ? resume.getSummary() : student.getBio(),
                resume.getCareerObjective(),
                resume.getTemplate(),
                studentService.education(student).stream().map(StudentDtos.EducationView::of).toList(),
                studentSkillRepository.findByStudent(student.getId()).stream()
                        .map(SkillDtos.StudentSkillView::of).toList(),
                studentService.projects(student).stream().map(StudentDtos.ProjectView::of).toList(),
                studentService.experience(student).stream().map(StudentDtos.ExperienceView::of).toList(),
                certificateRepository.findByStudentIdOrderByCreatedAtDesc(student.getId()).stream()
                        .map(CertificateDtos.CertificateView::of).toList());
    }

    public ResumeDtos.ResumeView update(User user, ResumeDtos.ResumeRequest request) {
        Student student = studentService.requireByUser(user);
        Resume resume = requireResume(student);
        resume.setSummary(request.summary());
        resume.setCareerObjective(request.careerObjective());
        if (request.template() != null && !request.template().isBlank()) {
            resume.setTemplate(request.template());
        }
        resumeRepository.save(resume);
        return build(user);
    }

    @Transactional(readOnly = true)
    public byte[] generatePdf(User user) {
        return pdfGenerator.render(build(user));
    }
}
