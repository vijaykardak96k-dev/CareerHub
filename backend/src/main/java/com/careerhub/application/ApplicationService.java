package com.careerhub.application;

import com.careerhub.company.Company;
import com.careerhub.company.CompanyService;
import com.careerhub.config.PageResponse;
import com.careerhub.exception.BadRequestException;
import com.careerhub.exception.ConflictException;
import com.careerhub.exception.ForbiddenException;
import com.careerhub.exception.NotFoundException;
import com.careerhub.internship.Internship;
import com.careerhub.internship.InternshipService;
import com.careerhub.job.Job;
import com.careerhub.job.JobService;
import com.careerhub.notification.NotificationService;
import com.careerhub.notification.NotificationType;
import com.careerhub.student.Student;
import com.careerhub.student.StudentService;
import com.careerhub.user.User;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final ApplicationStatusHistoryRepository historyRepository;
    private final StudentService studentService;
    private final CompanyService companyService;
    private final JobService jobService;
    private final InternshipService internshipService;
    private final NotificationService notificationService;

    public ApplicationService(ApplicationRepository applicationRepository,
                              ApplicationStatusHistoryRepository historyRepository,
                              StudentService studentService,
                              CompanyService companyService,
                              JobService jobService,
                              InternshipService internshipService,
                              NotificationService notificationService) {
        this.applicationRepository = applicationRepository;
        this.historyRepository = historyRepository;
        this.studentService = studentService;
        this.companyService = companyService;
        this.jobService = jobService;
        this.internshipService = internshipService;
        this.notificationService = notificationService;
    }

    /**
     * Business rules enforced here:
     * - a student may not apply twice to the same opening
     * - a student may not apply after the deadline
     * - a student may not apply to a draft or closed opening
     */
    public ApplicationDtos.ApplicationView apply(User user, ApplicationDtos.ApplyRequest request) {
        Student student = studentService.requireByUser(user);
        Application application = new Application();
        application.setStudent(student);
        application.setOpeningType(request.openingType());
        application.setCoverLetter(request.coverLetter());
        application.setStatus(ApplicationStatus.APPLIED);

        String openingTitle;
        if (request.openingType() == OpeningType.JOB) {
            Job job = jobService.requireDetailed(request.openingId());
            if (applicationRepository.existsByStudentIdAndJobId(student.getId(), job.getId())) {
                throw new ConflictException("You have already applied to this job");
            }
            assertOpen(job.isOpenForApplications());
            application.setJob(job);
            openingTitle = job.getTitle();
        } else {
            Internship internship = internshipService.requireDetailed(request.openingId());
            if (applicationRepository.existsByStudentIdAndInternshipId(student.getId(), internship.getId())) {
                throw new ConflictException("You have already applied to this internship");
            }
            assertOpen(internship.isOpenForApplications());
            application.setInternship(internship);
            openingTitle = internship.getTitle();
        }

        Application saved = applicationRepository.save(application);
        recordHistory(saved, null, ApplicationStatus.APPLIED, "Application submitted", user.getEmail());

        notificationService.create(user, NotificationType.APPLICATION_SUBMITTED, "Application submitted",
                "Your application for " + openingTitle + " has been submitted.", "/student/applications");

        return ApplicationDtos.ApplicationView.of(saved);
    }

    private void assertOpen(boolean open) {
        if (!open) {
            throw new BadRequestException("This opening is closed or the application deadline has passed");
        }
    }

    @Transactional(readOnly = true)
    public PageResponse<ApplicationDtos.ApplicationView> listForStudent(User user, ApplicationStatus status,
                                                                        Pageable pageable) {
        Student student = studentService.requireByUser(user);
        return PageResponse.of(applicationRepository.findByStudent(student.getId(), status, pageable),
                ApplicationDtos.ApplicationView::of);
    }

    @Transactional(readOnly = true)
    public PageResponse<ApplicationDtos.ApplicationView> listForCompany(User user, ApplicationStatus status,
                                                                        UUID jobId, UUID internshipId,
                                                                        Pageable pageable) {
        Company company = companyService.requireByUser(user);
        return PageResponse.of(applicationRepository.findForCompany(company.getId(), status, jobId,
                internshipId, pageable), ApplicationDtos.ApplicationView::of);
    }

    @Transactional(readOnly = true)
    public PageResponse<ApplicationDtos.ApplicationView> listForAdmin(ApplicationStatus status, Pageable pageable) {
        return PageResponse.of(applicationRepository.findAllForAdmin(status, pageable),
                ApplicationDtos.ApplicationView::of);
    }

    @Transactional(readOnly = true)
    public ApplicationDtos.ApplicationView get(User user, UUID id) {
        Application application = requireVisible(user, id);
        return ApplicationDtos.ApplicationView.of(application);
    }

    @Transactional(readOnly = true)
    public List<ApplicationDtos.StatusHistoryView> history(User user, UUID id) {
        requireVisible(user, id);
        return historyRepository.findByApplicationIdOrderByChangedAtAsc(id).stream()
                .map(ApplicationDtos.StatusHistoryView::of).toList();
    }

    /** Company side status transition. Every change is stored and notifies the student. */
    public ApplicationDtos.ApplicationView changeStatus(User user, UUID applicationId,
                                                        ApplicationDtos.StatusChangeRequest request) {
        Company company = companyService.requireByUser(user);
        Application application = requireDetailed(applicationId);
        assertCompanyOwns(application, company.getId());

        if (request.status() == ApplicationStatus.WITHDRAWN) {
            throw new BadRequestException("Only the student can withdraw an application");
        }
        if (application.getStatus() == request.status()) {
            throw new BadRequestException("The application already has this status");
        }
        if (application.getStatus() == ApplicationStatus.WITHDRAWN) {
            throw new BadRequestException("A withdrawn application cannot be updated");
        }

        ApplicationStatus previous = application.getStatus();
        application.setStatus(request.status());
        Application saved = applicationRepository.save(application);
        recordHistory(saved, previous, request.status(), request.note(), user.getEmail());

        String title = application.getOpeningType() == OpeningType.JOB
                ? application.getJob().getTitle() : application.getInternship().getTitle();
        notificationService.create(application.getStudent().getUser(),
                NotificationType.APPLICATION_STATUS_CHANGED,
                "Application update: " + request.status().name().replace('_', ' ').toLowerCase(),
                "Your application for " + title + " at " + company.getName() + " is now "
                        + request.status().name().replace('_', ' ').toLowerCase() + ".",
                "/student/applications");

        return ApplicationDtos.ApplicationView.of(saved);
    }

    /** Students may withdraw while the application has not reached a final state. */
    public ApplicationDtos.ApplicationView withdraw(User user, UUID applicationId) {
        Student student = studentService.requireByUser(user);
        Application application = requireDetailed(applicationId);
        if (!application.getStudent().getId().equals(student.getId())) {
            throw new ForbiddenException("You can only withdraw your own applications");
        }
        if (application.getStatus().isFinal()) {
            throw new BadRequestException("This application can no longer be withdrawn");
        }
        ApplicationStatus previous = application.getStatus();
        application.setStatus(ApplicationStatus.WITHDRAWN);
        Application saved = applicationRepository.save(application);
        recordHistory(saved, previous, ApplicationStatus.WITHDRAWN, "Withdrawn by student", user.getEmail());
        return ApplicationDtos.ApplicationView.of(saved);
    }

    private Application requireDetailed(UUID id) {
        return applicationRepository.findDetailed(id)
                .orElseThrow(() -> new NotFoundException("Application not found"));
    }

    private Application requireVisible(User user, UUID id) {
        Application application = requireDetailed(id);
        switch (user.getRole()) {
            case STUDENT -> {
                Student student = studentService.requireByUser(user);
                if (!application.getStudent().getId().equals(student.getId())) {
                    throw new ForbiddenException("You can only view your own applications");
                }
            }
            case COMPANY -> assertCompanyOwns(application, companyService.requireByUser(user).getId());
            case COLLEGE_ADMIN -> { }
        }
        return application;
    }

    private void assertCompanyOwns(Application application, UUID companyId) {
        UUID owner = application.getOpeningType() == OpeningType.JOB
                ? application.getJob().getCompany().getId()
                : application.getInternship().getCompany().getId();
        if (!owner.equals(companyId)) {
            throw new ForbiddenException("You can only manage applicants for your own openings");
        }
    }

    private void recordHistory(Application application, ApplicationStatus from, ApplicationStatus to,
                               String note, String changedBy) {
        ApplicationStatusHistory history = new ApplicationStatusHistory();
        history.setApplication(application);
        history.setFromStatus(from);
        history.setToStatus(to);
        history.setNote(note);
        history.setChangedBy(changedBy);
        historyRepository.save(history);
    }
}
