package com.careerhub.skill;

import com.careerhub.exception.ConflictException;
import com.careerhub.exception.ForbiddenException;
import com.careerhub.exception.NotFoundException;
import com.careerhub.internship.Internship;
import com.careerhub.internship.InternshipService;
import com.careerhub.job.Job;
import com.careerhub.job.JobService;
import com.careerhub.student.Student;
import com.careerhub.student.StudentService;
import com.careerhub.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class SkillService {

    private final SkillRepository skillRepository;
    private final SkillCategoryRepository categoryRepository;
    private final StudentSkillRepository studentSkillRepository;
    private final StudentService studentService;
    private final JobService jobService;
    private final InternshipService internshipService;

    public SkillService(SkillRepository skillRepository,
                        SkillCategoryRepository categoryRepository,
                        StudentSkillRepository studentSkillRepository,
                        StudentService studentService,
                        JobService jobService,
                        InternshipService internshipService) {
        this.skillRepository = skillRepository;
        this.categoryRepository = categoryRepository;
        this.studentSkillRepository = studentSkillRepository;
        this.studentService = studentService;
        this.jobService = jobService;
        this.internshipService = internshipService;
    }

    @Transactional(readOnly = true)
    public List<SkillDtos.CategoryView> catalog() {
        Map<UUID, List<SkillDtos.SkillView>> grouped = new LinkedHashMap<>();
        for (Skill skill : skillRepository.findAllWithCategory()) {
            grouped.computeIfAbsent(skill.getCategory().getId(), key -> new ArrayList<>())
                    .add(SkillDtos.SkillView.of(skill));
        }
        return categoryRepository.findAllByOrderByNameAsc().stream()
                .map(category -> new SkillDtos.CategoryView(category.getId(), category.getName(),
                        category.getDescription(), grouped.getOrDefault(category.getId(), List.of())))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SkillDtos.SkillView> allSkills() {
        return skillRepository.findAllWithCategory().stream().map(SkillDtos.SkillView::of).toList();
    }

    // ---------- student skills ----------
    @Transactional(readOnly = true)
    public List<SkillDtos.StudentSkillView> studentSkills(Student student) {
        return studentSkillRepository.findByStudent(student.getId()).stream()
                .map(SkillDtos.StudentSkillView::of).toList();
    }

    public SkillDtos.StudentSkillView addStudentSkill(User user, SkillDtos.StudentSkillRequest request) {
        Student student = studentService.requireByUser(user);
        if (studentSkillRepository.existsByStudentIdAndSkillId(student.getId(), request.skillId())) {
            throw new ConflictException("This skill is already part of your profile");
        }
        Skill skill = skillRepository.findById(request.skillId())
                .orElseThrow(() -> new NotFoundException("Skill not found"));
        StudentSkill studentSkill = new StudentSkill();
        studentSkill.setStudent(student);
        studentSkill.setSkill(skill);
        studentSkill.setProficiency(request.proficiency());
        studentSkill.setYearsExperience(request.yearsExperience());
        StudentSkill saved = studentSkillRepository.save(studentSkill);
        studentService.recalculateCompletion(student);
        return SkillDtos.StudentSkillView.of(saved);
    }

    public SkillDtos.StudentSkillView updateStudentSkill(User user, UUID id,
                                                         SkillDtos.StudentSkillRequest request) {
        Student student = studentService.requireByUser(user);
        StudentSkill studentSkill = studentSkillRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Skill entry not found"));
        if (!studentSkill.getStudent().getId().equals(student.getId())) {
            throw new ForbiddenException("You can only modify your own skills");
        }
        studentSkill.setProficiency(request.proficiency());
        studentSkill.setYearsExperience(request.yearsExperience());
        return SkillDtos.StudentSkillView.of(studentSkillRepository.save(studentSkill));
    }

    public void removeStudentSkill(User user, UUID id) {
        Student student = studentService.requireByUser(user);
        StudentSkill studentSkill = studentSkillRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Skill entry not found"));
        if (!studentSkill.getStudent().getId().equals(student.getId())) {
            throw new ForbiddenException("You can only modify your own skills");
        }
        studentSkillRepository.delete(studentSkill);
        studentService.recalculateCompletion(student);
    }

    /**
     * Rule based skill gap analysis: compares the skills required by an opening with the
     * skills stored on the student profile. No external service is involved.
     */
    @Transactional(readOnly = true)
    public SkillDtos.SkillGapView gapForJob(User user, UUID jobId) {
        Job job = jobService.requireDetailed(jobId);
        return compare(user, job.getTitle() + " - " + job.getCompany().getName(),
                job.getSkills().stream().map(Skill::getName).collect(Collectors.toSet()));
    }

    @Transactional(readOnly = true)
    public SkillDtos.SkillGapView gapForInternship(User user, UUID internshipId) {
        Internship internship = internshipService.requireDetailed(internshipId);
        return compare(user, internship.getTitle() + " - " + internship.getCompany().getName(),
                internship.getSkills().stream().map(Skill::getName).collect(Collectors.toSet()));
    }

    private SkillDtos.SkillGapView compare(User user, String target, Set<String> required) {
        Student student = studentService.requireByUser(user);
        Set<String> owned = studentSkillRepository.findByStudent(student.getId()).stream()
                .map(ss -> ss.getSkill().getName().toLowerCase(Locale.ROOT))
                .collect(Collectors.toSet());

        List<String> matched = required.stream()
                .filter(name -> owned.contains(name.toLowerCase(Locale.ROOT))).sorted().toList();
        List<String> missing = required.stream()
                .filter(name -> !owned.contains(name.toLowerCase(Locale.ROOT))).sorted().toList();
        int percentage = required.isEmpty() ? 100 : (int) Math.round(matched.size() * 100.0 / required.size());
        return new SkillDtos.SkillGapView(target, matched, missing, percentage);
    }

    // ---------- college admin catalogue management ----------
    public SkillDtos.SkillView createSkill(SkillDtos.SkillRequest request) {
        if (skillRepository.existsByNameIgnoreCase(request.name())) {
            throw new ConflictException("A skill with this name already exists");
        }
        Skill skill = new Skill();
        apply(skill, request);
        return SkillDtos.SkillView.of(skillRepository.save(skill));
    }

    public SkillDtos.SkillView updateSkill(UUID id, SkillDtos.SkillRequest request) {
        Skill skill = skillRepository.findById(id).orElseThrow(() -> new NotFoundException("Skill not found"));
        apply(skill, request);
        return SkillDtos.SkillView.of(skillRepository.save(skill));
    }

    private void apply(Skill skill, SkillDtos.SkillRequest request) {
        SkillCategory category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new NotFoundException("Skill category not found"));
        skill.setName(request.name());
        skill.setDescription(request.description());
        skill.setCategory(category);
        skill.setActive(request.active() == null || request.active());
    }

    public void deleteSkill(UUID id) {
        Skill skill = skillRepository.findById(id).orElseThrow(() -> new NotFoundException("Skill not found"));
        skillRepository.delete(skill);
    }

    public SkillDtos.CategoryView createCategory(SkillDtos.CategoryRequest request) {
        categoryRepository.findByNameIgnoreCase(request.name()).ifPresent(existing -> {
            throw new ConflictException("A category with this name already exists");
        });
        SkillCategory category = new SkillCategory();
        category.setName(request.name());
        category.setDescription(request.description());
        SkillCategory saved = categoryRepository.save(category);
        return new SkillDtos.CategoryView(saved.getId(), saved.getName(), saved.getDescription(), List.of());
    }
}
