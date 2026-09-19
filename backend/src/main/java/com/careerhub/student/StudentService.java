package com.careerhub.student;

import com.careerhub.application.ApplicationRepository;
import com.careerhub.application.ApplicationStatus;
import com.careerhub.assessment.AssessmentAttemptRepository;
import com.careerhub.certificate.CertificateRepository;
import com.careerhub.certificate.CertificateStatus;
import com.careerhub.exception.ForbiddenException;
import com.careerhub.exception.NotFoundException;
import com.careerhub.notification.NotificationRepository;
import com.careerhub.skill.StudentSkillRepository;
import com.careerhub.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class StudentService {

    private final StudentRepository studentRepository;
    private final StudentEducationRepository educationRepository;
    private final StudentProjectRepository projectRepository;
    private final StudentExperienceRepository experienceRepository;
    private final StudentSkillRepository studentSkillRepository;
    private final CertificateRepository certificateRepository;
    private final ApplicationRepository applicationRepository;
    private final AssessmentAttemptRepository attemptRepository;
    private final NotificationRepository notificationRepository;

    public StudentService(StudentRepository studentRepository,
                          StudentEducationRepository educationRepository,
                          StudentProjectRepository projectRepository,
                          StudentExperienceRepository experienceRepository,
                          StudentSkillRepository studentSkillRepository,
                          CertificateRepository certificateRepository,
                          ApplicationRepository applicationRepository,
                          AssessmentAttemptRepository attemptRepository,
                          NotificationRepository notificationRepository) {
        this.studentRepository = studentRepository;
        this.educationRepository = educationRepository;
        this.projectRepository = projectRepository;
        this.experienceRepository = experienceRepository;
        this.studentSkillRepository = studentSkillRepository;
        this.certificateRepository = certificateRepository;
        this.applicationRepository = applicationRepository;
        this.attemptRepository = attemptRepository;
        this.notificationRepository = notificationRepository;
    }

    @Transactional(readOnly = true)
    public Student requireByUser(User user) {
        return studentRepository.findByUserId(user.getId())
                .orElseThrow(() -> new NotFoundException("Student profile not found"));
    }

    @Transactional(readOnly = true)
    public Student requireById(UUID id) {
        return studentRepository.findDetailed(id)
                .orElseThrow(() -> new NotFoundException("Student not found"));
    }

    public Student updateProfile(User user, StudentDtos.ProfileRequest request) {
        Student student = requireByUser(user);
        student.setFullName(request.fullName());
        student.setPhone(request.phone());
        student.setCollege(request.college());
        student.setDepartment(request.department());
        student.setCourse(request.course());
        student.setGraduationYear(request.graduationYear());
        student.setCgpa(request.cgpa());
        student.setLocation(request.location());
        student.setPhotoUrl(request.photoUrl());
        student.setBio(request.bio());
        student.setGithubUrl(request.githubUrl());
        student.setLinkedinUrl(request.linkedinUrl());
        student.setPortfolioUrl(request.portfolioUrl());
        recalculateCompletion(student);
        return studentRepository.save(student);
    }

    /**
     * Profile completion is a weighted score over the profile fields and the related
     * sections (education, projects, experience, skills, certificates).
     */
    public int recalculateCompletion(Student student) {
        int filled = 0;
        int total = 18;
        if (notBlank(student.getFullName())) filled++;
        if (notBlank(student.getPhone())) filled++;
        if (notBlank(student.getCollege())) filled++;
        if (notBlank(student.getDepartment())) filled++;
        if (notBlank(student.getCourse())) filled++;
        if (student.getGraduationYear() != null) filled++;
        if (student.getCgpa() != null) filled++;
        if (notBlank(student.getLocation())) filled++;
        if (notBlank(student.getPhotoUrl())) filled++;
        if (notBlank(student.getBio())) filled++;
        if (notBlank(student.getGithubUrl())) filled++;
        if (notBlank(student.getLinkedinUrl())) filled++;
        if (notBlank(student.getPortfolioUrl())) filled++;
        if (educationRepository.countByStudentId(student.getId()) > 0) filled++;
        if (projectRepository.countByStudentId(student.getId()) > 0) filled++;
        if (experienceRepository.countByStudentId(student.getId()) > 0) filled++;
        if (studentSkillRepository.countByStudentId(student.getId()) > 0) filled++;
        if (certificateRepository.countByStudentId(student.getId()) > 0) filled++;

        int completion = (int) Math.round(filled * 100.0 / total);
        student.setProfileCompletion(completion);
        studentRepository.save(student);
        return completion;
    }

    private boolean notBlank(String value) {
        return value != null && !value.isBlank();
    }

    // ---------- education ----------
    @Transactional(readOnly = true)
    public List<StudentEducation> education(Student student) {
        return educationRepository.findByStudentIdOrderByEndYearDesc(student.getId());
    }

    public StudentEducation addEducation(Student student, StudentDtos.EducationRequest request) {
        StudentEducation education = new StudentEducation();
        education.setStudent(student);
        apply(education, request);
        StudentEducation saved = educationRepository.save(education);
        recalculateCompletion(student);
        return saved;
    }

    public StudentEducation updateEducation(Student student, UUID id, StudentDtos.EducationRequest request) {
        StudentEducation education = educationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Education entry not found"));
        assertOwner(student, education.getStudent().getId());
        apply(education, request);
        return educationRepository.save(education);
    }

    private void apply(StudentEducation education, StudentDtos.EducationRequest request) {
        education.setDegree(request.degree());
        education.setInstitution(request.institution());
        education.setSpecialization(request.specialization());
        education.setStartYear(request.startYear());
        education.setEndYear(request.endYear());
        education.setGrade(request.grade());
    }

    public void deleteEducation(Student student, UUID id) {
        StudentEducation education = educationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Education entry not found"));
        assertOwner(student, education.getStudent().getId());
        educationRepository.delete(education);
        recalculateCompletion(student);
    }

    // ---------- projects ----------
    @Transactional(readOnly = true)
    public List<StudentProject> projects(Student student) {
        return projectRepository.findByStudentIdOrderByCreatedAtDesc(student.getId());
    }

    public StudentProject addProject(Student student, StudentDtos.ProjectRequest request) {
        StudentProject project = new StudentProject();
        project.setStudent(student);
        apply(project, request);
        StudentProject saved = projectRepository.save(project);
        recalculateCompletion(student);
        return saved;
    }

    public StudentProject updateProject(Student student, UUID id, StudentDtos.ProjectRequest request) {
        StudentProject project = projectRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Project not found"));
        assertOwner(student, project.getStudent().getId());
        apply(project, request);
        return projectRepository.save(project);
    }

    private void apply(StudentProject project, StudentDtos.ProjectRequest request) {
        project.setTitle(request.title());
        project.setDescription(request.description());
        project.setTechStack(request.techStack());
        project.setProjectUrl(request.projectUrl());
        project.setRepoUrl(request.repoUrl());
        project.setStartDate(request.startDate());
        project.setEndDate(request.endDate());
    }

    public void deleteProject(Student student, UUID id) {
        StudentProject project = projectRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Project not found"));
        assertOwner(student, project.getStudent().getId());
        projectRepository.delete(project);
        recalculateCompletion(student);
    }

    // ---------- experience ----------
    @Transactional(readOnly = true)
    public List<StudentExperience> experience(Student student) {
        return experienceRepository.findByStudentIdOrderByStartDateDesc(student.getId());
    }

    public StudentExperience addExperience(Student student, StudentDtos.ExperienceRequest request) {
        StudentExperience experience = new StudentExperience();
        experience.setStudent(student);
        apply(experience, request);
        StudentExperience saved = experienceRepository.save(experience);
        recalculateCompletion(student);
        return saved;
    }

    public StudentExperience updateExperience(Student student, UUID id, StudentDtos.ExperienceRequest request) {
        StudentExperience experience = experienceRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Experience entry not found"));
        assertOwner(student, experience.getStudent().getId());
        apply(experience, request);
        return experienceRepository.save(experience);
    }

    private void apply(StudentExperience experience, StudentDtos.ExperienceRequest request) {
        experience.setCompanyName(request.companyName());
        experience.setRoleTitle(request.roleTitle());
        experience.setDescription(request.description());
        experience.setLocation(request.location());
        experience.setStartDate(request.startDate());
        experience.setEndDate(request.currentlyWorking() ? null : request.endDate());
        experience.setCurrentlyWorking(request.currentlyWorking());
    }

    public void deleteExperience(Student student, UUID id) {
        StudentExperience experience = experienceRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Experience entry not found"));
        assertOwner(student, experience.getStudent().getId());
        experienceRepository.delete(experience);
        recalculateCompletion(student);
    }

    // ---------- dashboard ----------
    @Transactional(readOnly = true)
    public StudentDtos.StudentDashboard dashboard(Student student) {
        UUID id = student.getId();
        Double average = attemptRepository.averagePercentage(id);
        return new StudentDtos.StudentDashboard(
                student.getProfileCompletion(),
                studentSkillRepository.countByStudentId(id),
                certificateRepository.countByStudentId(id),
                certificateRepository.countByStudentIdAndStatus(id, CertificateStatus.VERIFIED),
                attemptRepository.countByStudentId(id),
                average == null ? 0.0 : Math.round(average * 100.0) / 100.0,
                applicationRepository.countByStudentIdAndStatusIn(id,
                        List.of(ApplicationStatus.APPLIED, ApplicationStatus.UNDER_REVIEW,
                                ApplicationStatus.SHORTLISTED, ApplicationStatus.INTERVIEW)),
                applicationRepository.countByStudentIdAndStatusIn(id, List.of(ApplicationStatus.SHORTLISTED)),
                applicationRepository.countByStudentIdAndStatusIn(id, List.of(ApplicationStatus.SELECTED)),
                notificationRepository.countByUserIdAndReadFlagFalse(student.getUser().getId()));
    }

    private void assertOwner(Student student, UUID ownerId) {
        if (!student.getId().equals(ownerId)) {
            throw new ForbiddenException("You can only modify your own profile");
        }
    }
}
