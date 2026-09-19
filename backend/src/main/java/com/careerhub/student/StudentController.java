package com.careerhub.student;

import com.careerhub.exception.ConflictException;
import com.careerhub.exception.NotFoundException;
import com.careerhub.job.Job;
import com.careerhub.job.JobDtos;
import com.careerhub.job.JobService;
import com.careerhub.security.CurrentUser;
import com.careerhub.skill.StudentSkillRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/students")
@Tag(name = "Students")
public class StudentController {

    private final StudentService studentService;
    private final SavedJobRepository savedJobRepository;
    private final StudentSkillRepository studentSkillRepository;
    private final JobService jobService;
    private final CurrentUser currentUser;

    public StudentController(StudentService studentService,
                             SavedJobRepository savedJobRepository,
                             StudentSkillRepository studentSkillRepository,
                             JobService jobService,
                             CurrentUser currentUser) {
        this.studentService = studentService;
        this.savedJobRepository = savedJobRepository;
        this.studentSkillRepository = studentSkillRepository;
        this.jobService = jobService;
        this.currentUser = currentUser;
    }

    private Student me() {
        return studentService.requireByUser(currentUser.require());
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('STUDENT')")
    public StudentDtos.StudentProfile profile() {
        return StudentDtos.StudentProfile.of(me());
    }

    @PutMapping("/me")
    @PreAuthorize("hasRole('STUDENT')")
    public StudentDtos.StudentProfile updateProfile(@Valid @RequestBody StudentDtos.ProfileRequest request) {
        return StudentDtos.StudentProfile.of(studentService.updateProfile(currentUser.require(), request));
    }

    @GetMapping("/me/dashboard")
    @PreAuthorize("hasRole('STUDENT')")
    public StudentDtos.StudentDashboard dashboard() {
        return studentService.dashboard(me());
    }

    /** Company and college admin can open a candidate profile. */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('COMPANY','COLLEGE_ADMIN')")
    public StudentDtos.StudentProfile candidate(@PathVariable UUID id) {
        return StudentDtos.StudentProfile.of(studentService.requireById(id));
    }

    // ---------- education ----------
    @GetMapping("/me/education")
    @PreAuthorize("hasRole('STUDENT')")
    public List<StudentDtos.EducationView> education() {
        return studentService.education(me()).stream().map(StudentDtos.EducationView::of).toList();
    }

    @PostMapping("/me/education")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<StudentDtos.EducationView> addEducation(
            @Valid @RequestBody StudentDtos.EducationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(StudentDtos.EducationView.of(studentService.addEducation(me(), request)));
    }

    @PutMapping("/me/education/{id}")
    @PreAuthorize("hasRole('STUDENT')")
    public StudentDtos.EducationView updateEducation(@PathVariable UUID id,
            @Valid @RequestBody StudentDtos.EducationRequest request) {
        return StudentDtos.EducationView.of(studentService.updateEducation(me(), id, request));
    }

    @DeleteMapping("/me/education/{id}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Void> deleteEducation(@PathVariable UUID id) {
        studentService.deleteEducation(me(), id);
        return ResponseEntity.noContent().build();
    }

    // ---------- projects ----------
    @GetMapping("/me/projects")
    @PreAuthorize("hasRole('STUDENT')")
    public List<StudentDtos.ProjectView> projects() {
        return studentService.projects(me()).stream().map(StudentDtos.ProjectView::of).toList();
    }

    @PostMapping("/me/projects")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<StudentDtos.ProjectView> addProject(
            @Valid @RequestBody StudentDtos.ProjectRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(StudentDtos.ProjectView.of(studentService.addProject(me(), request)));
    }

    @PutMapping("/me/projects/{id}")
    @PreAuthorize("hasRole('STUDENT')")
    public StudentDtos.ProjectView updateProject(@PathVariable UUID id,
            @Valid @RequestBody StudentDtos.ProjectRequest request) {
        return StudentDtos.ProjectView.of(studentService.updateProject(me(), id, request));
    }

    @DeleteMapping("/me/projects/{id}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Void> deleteProject(@PathVariable UUID id) {
        studentService.deleteProject(me(), id);
        return ResponseEntity.noContent().build();
    }

    // ---------- experience ----------
    @GetMapping("/me/experience")
    @PreAuthorize("hasRole('STUDENT')")
    public List<StudentDtos.ExperienceView> experience() {
        return studentService.experience(me()).stream().map(StudentDtos.ExperienceView::of).toList();
    }

    @PostMapping("/me/experience")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<StudentDtos.ExperienceView> addExperience(
            @Valid @RequestBody StudentDtos.ExperienceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(StudentDtos.ExperienceView.of(studentService.addExperience(me(), request)));
    }

    @PutMapping("/me/experience/{id}")
    @PreAuthorize("hasRole('STUDENT')")
    public StudentDtos.ExperienceView updateExperience(@PathVariable UUID id,
            @Valid @RequestBody StudentDtos.ExperienceRequest request) {
        return StudentDtos.ExperienceView.of(studentService.updateExperience(me(), id, request));
    }

    @DeleteMapping("/me/experience/{id}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Void> deleteExperience(@PathVariable UUID id) {
        studentService.deleteExperience(me(), id);
        return ResponseEntity.noContent().build();
    }

    // ---------- saved jobs ----------
    @GetMapping("/me/saved-jobs")
    @PreAuthorize("hasRole('STUDENT')")
    @Transactional(readOnly = true)
    public List<JobDtos.JobView> savedJobs() {
        return savedJobRepository.findByStudent(me().getId()).stream()
                .map(sj -> JobDtos.JobView.summary(sj.getJob())).toList();
    }

    @PostMapping("/me/saved-jobs/{jobId}")
    @PreAuthorize("hasRole('STUDENT')")
    @Transactional
    public ResponseEntity<Void> saveJob(@PathVariable UUID jobId) {
        Student student = me();
        if (savedJobRepository.existsByStudentIdAndJobId(student.getId(), jobId)) {
            throw new ConflictException("This job is already saved");
        }
        Job job = jobService.requireDetailed(jobId);
        SavedJob savedJob = new SavedJob();
        savedJob.setStudent(student);
        savedJob.setJob(job);
        savedJobRepository.save(savedJob);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/me/saved-jobs/{jobId}")
    @PreAuthorize("hasRole('STUDENT')")
    @Transactional
    public ResponseEntity<Void> unsaveJob(@PathVariable UUID jobId) {
        SavedJob savedJob = savedJobRepository.findByStudentIdAndJobId(me().getId(), jobId)
                .orElseThrow(() -> new NotFoundException("This job is not in your saved list"));
        savedJobRepository.delete(savedJob);
        return ResponseEntity.noContent().build();
    }

    /** Jobs that require at least one of the skills present on the student profile. */
    @GetMapping("/me/recommended-jobs")
    @PreAuthorize("hasRole('STUDENT')")
    @Transactional(readOnly = true)
    public List<JobDtos.JobView> recommendedJobs(@RequestParam(defaultValue = "5") int limit) {
        List<UUID> skillIds = studentSkillRepository.findByStudent(me().getId()).stream()
                .map(ss -> ss.getSkill().getId()).toList();
        return jobService.recommended(skillIds, PageRequest.of(0, Math.min(limit, 20))).stream()
                .map(JobDtos.JobView::summary).toList();
    }
}
