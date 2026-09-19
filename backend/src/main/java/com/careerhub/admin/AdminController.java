package com.careerhub.admin;

import com.careerhub.analytics.AnalyticsDtos;
import com.careerhub.analytics.AnalyticsService;
import com.careerhub.application.ApplicationDtos;
import com.careerhub.application.ApplicationService;
import com.careerhub.application.ApplicationStatus;
import com.careerhub.assessment.AssessmentDtos;
import com.careerhub.assessment.AssessmentService;
import com.careerhub.certificate.CertificateDtos;
import com.careerhub.certificate.CertificateService;
import com.careerhub.certificate.CertificateStatus;
import com.careerhub.company.CompanyDtos;
import com.careerhub.company.CompanyService;
import com.careerhub.company.CompanyStatus;
import com.careerhub.config.PageResponse;
import com.careerhub.internship.InternshipDtos;
import com.careerhub.internship.InternshipService;
import com.careerhub.job.JobDtos;
import com.careerhub.job.JobService;
import com.careerhub.job.OpeningStatus;
import com.careerhub.security.CurrentUser;
import com.careerhub.skill.SkillDtos;
import com.careerhub.skill.SkillService;
import com.careerhub.student.StudentDtos;
import com.careerhub.student.StudentRepository;
import com.careerhub.user.UserSummary;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@Tag(name = "College administration")
public class AdminController {

    private final AdminService adminService;
    private final AnalyticsService analyticsService;
    private final CompanyService companyService;
    private final JobService jobService;
    private final InternshipService internshipService;
    private final ApplicationService applicationService;
    private final CertificateService certificateService;
    private final AssessmentService assessmentService;
    private final SkillService skillService;
    private final StudentRepository studentRepository;
    private final CurrentUser currentUser;

    public AdminController(AdminService adminService,
                           AnalyticsService analyticsService,
                           CompanyService companyService,
                           JobService jobService,
                           InternshipService internshipService,
                           ApplicationService applicationService,
                           CertificateService certificateService,
                           AssessmentService assessmentService,
                           SkillService skillService,
                           StudentRepository studentRepository,
                           CurrentUser currentUser) {
        this.adminService = adminService;
        this.analyticsService = analyticsService;
        this.companyService = companyService;
        this.jobService = jobService;
        this.internshipService = internshipService;
        this.applicationService = applicationService;
        this.certificateService = certificateService;
        this.assessmentService = assessmentService;
        this.skillService = skillService;
        this.studentRepository = studentRepository;
        this.currentUser = currentUser;
    }

    @GetMapping("/overview")
    public AnalyticsDtos.AdminOverview overview() {
        return analyticsService.overview();
    }

    // ---------- students ----------
    @GetMapping("/students")
    @Transactional(readOnly = true)
    public PageResponse<StudentDtos.StudentProfile> students(@RequestParam(required = false) String search,
                                                             @RequestParam(defaultValue = "0") int page,
                                                             @RequestParam(defaultValue = "10") int size) {
        return PageResponse.of(studentRepository.search(
                        (search == null || search.isBlank()) ? null : search,
                        PageRequest.of(page, size, Sort.by("fullName"))),
                StudentDtos.StudentProfile::of);
    }

    // ---------- companies ----------
    @GetMapping("/companies")
    public PageResponse<CompanyDtos.CompanyView> companies(@RequestParam(required = false) CompanyStatus status,
                                                           @RequestParam(required = false) String search,
                                                           @RequestParam(defaultValue = "0") int page,
                                                           @RequestParam(defaultValue = "10") int size) {
        return PageResponse.of(companyService.search(status, search,
                PageRequest.of(page, size, Sort.by("name"))), CompanyDtos.CompanyView::of);
    }

    @PatchMapping("/companies/{id}/status")
    public CompanyDtos.CompanyView changeCompanyStatus(@PathVariable UUID id,
            @Valid @RequestBody CompanyDtos.CompanyStatusRequest request) {
        return CompanyDtos.CompanyView.of(companyService.changeStatus(id, request.status(), request.note()));
    }

    // ---------- user activation ----------
    @PatchMapping("/users/{id}/active")
    public UserSummary setActive(@PathVariable UUID id, @Valid @RequestBody AdminDtos.ActiveFlagRequest request) {
        return UserSummary.of(adminService.setActive(currentUser.require(), id, request.active()));
    }

    // ---------- openings ----------
    @GetMapping("/jobs")
    public PageResponse<JobDtos.JobView> jobs(@RequestParam(required = false) OpeningStatus status,
                                              @RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "10") int size) {
        return PageResponse.of(jobService.listForAdmin(status,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))), JobDtos.JobView::summary);
    }

    @GetMapping("/internships")
    public PageResponse<InternshipDtos.InternshipView> internships(@RequestParam(required = false) OpeningStatus status,
                                                                   @RequestParam(defaultValue = "0") int page,
                                                                   @RequestParam(defaultValue = "10") int size) {
        return PageResponse.of(internshipService.listForAdmin(status,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))),
                InternshipDtos.InternshipView::summary);
    }

    // ---------- applications ----------
    @GetMapping("/applications")
    public PageResponse<ApplicationDtos.ApplicationView> applications(
            @RequestParam(required = false) ApplicationStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return applicationService.listForAdmin(status,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "appliedAt")));
    }

    // ---------- certificates ----------
    @GetMapping("/certificates")
    public PageResponse<CertificateDtos.CertificateView> certificates(
            @RequestParam(required = false) CertificateStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return PageResponse.of(certificateService.listForAdmin(status,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))),
                CertificateDtos.CertificateView::of);
    }

    @PatchMapping("/certificates/{id}/review")
    public CertificateDtos.CertificateView reviewCertificate(@PathVariable UUID id,
            @Valid @RequestBody CertificateDtos.ReviewRequest request) {
        return CertificateDtos.CertificateView.of(certificateService.review(id, request));
    }

    // ---------- skills ----------
    @GetMapping("/skills")
    public List<SkillDtos.CategoryView> skills() {
        return skillService.catalog();
    }

    @PostMapping("/skills")
    public ResponseEntity<SkillDtos.SkillView> createSkill(@Valid @RequestBody SkillDtos.SkillRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(skillService.createSkill(request));
    }

    @PutMapping("/skills/{id}")
    public SkillDtos.SkillView updateSkill(@PathVariable UUID id, @Valid @RequestBody SkillDtos.SkillRequest request) {
        return skillService.updateSkill(id, request);
    }

    @DeleteMapping("/skills/{id}")
    public ResponseEntity<Void> deleteSkill(@PathVariable UUID id) {
        skillService.deleteSkill(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/skill-categories")
    public ResponseEntity<SkillDtos.CategoryView> createCategory(
            @Valid @RequestBody SkillDtos.CategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(skillService.createCategory(request));
    }

    // ---------- assessments ----------
    @GetMapping("/assessments")
    public List<AssessmentDtos.AssessmentView> assessments() {
        return assessmentService.listAll();
    }

    @GetMapping("/assessments/{id}/questions")
    public List<AssessmentDtos.AdminQuestionView> assessmentQuestions(@PathVariable UUID id) {
        return assessmentService.adminQuestions(id);
    }

    @PostMapping("/assessments")
    public ResponseEntity<AssessmentDtos.AssessmentView> createAssessment(
            @Valid @RequestBody AssessmentDtos.AssessmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(assessmentService.create(request));
    }

    @PutMapping("/assessments/{id}")
    public AssessmentDtos.AssessmentView updateAssessment(@PathVariable UUID id,
            @Valid @RequestBody AssessmentDtos.AssessmentRequest request) {
        return assessmentService.update(id, request);
    }

    @DeleteMapping("/assessments/{id}")
    public ResponseEntity<Void> deleteAssessment(@PathVariable UUID id) {
        assessmentService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ---------- announcements ----------
    @PostMapping("/announcements")
    public Map<String, Integer> announce(@Valid @RequestBody AdminDtos.AnnouncementRequest request) {
        return Map.of("recipients", adminService.announce(request));
    }
}
