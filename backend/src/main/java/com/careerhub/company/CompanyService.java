package com.careerhub.company;

import com.careerhub.application.ApplicationRepository;
import com.careerhub.application.ApplicationStatus;
import com.careerhub.company.CompanyDtos.CompanyDashboard;
import com.careerhub.company.CompanyDtos.CompanyProfileRequest;
import com.careerhub.exception.ApiException;
import com.careerhub.internship.InternshipRepository;
import com.careerhub.job.JobRepository;
import com.careerhub.job.OpeningStatus;
import com.careerhub.notification.NotificationRepository;
import com.careerhub.notification.NotificationService;
import com.careerhub.notification.NotificationType;
import com.careerhub.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/** Company profile management and college-admin moderation. */
@Service
@Transactional(readOnly = true)
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final JobRepository jobRepository;
    private final InternshipRepository internshipRepository;
    private final ApplicationRepository applicationRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;

    public CompanyService(CompanyRepository companyRepository,
                          JobRepository jobRepository,
                          InternshipRepository internshipRepository,
                          ApplicationRepository applicationRepository,
                          NotificationRepository notificationRepository,
                          NotificationService notificationService) {
        this.companyRepository = companyRepository;
        this.jobRepository = jobRepository;
        this.internshipRepository = internshipRepository;
        this.applicationRepository = applicationRepository;
        this.notificationRepository = notificationRepository;
        this.notificationService = notificationService;
    }

    /** The company profile attached to the given company account. */
    public Company requireByUser(User user) {
        return companyRepository.findByUserId(user.getId())
                .orElseThrow(() -> ApiException.notFound("Company profile not found"));
    }

    public Company requireById(UUID id) {
        return companyRepository.findDetailed(id)
                .orElseThrow(() -> ApiException.notFound("Company not found"));
    }

    /** Business rule 4: only approved companies may publish or manage openings. */
    public Company requireApproved(User user) {
        Company company = requireByUser(user);
        if (company.getStatus() != CompanyStatus.APPROVED) {
            throw ApiException.forbidden(
                    "Your company account must be approved by the college before you can do this");
        }
        return company;
    }

    @Transactional
    public Company updateProfile(User user, CompanyProfileRequest request) {
        Company company = requireByUser(user);
        company.setName(request.name());
        company.setLogoUrl(request.logoUrl());
        company.setDescription(request.description());
        company.setIndustry(request.industry());
        company.setWebsite(request.website());
        company.setLocation(request.location());
        company.setContactEmail(request.contactEmail());
        return companyRepository.save(company);
    }

    public Page<Company> search(CompanyStatus status, String search, Pageable pageable) {
        String term = search == null || search.isBlank() ? null : search.trim();
        return companyRepository.search(status, term, pageable);
    }

    /** College admin moderation: approve, reject or suspend a company account. */
    @Transactional
    public Company changeStatus(UUID companyId, CompanyStatus status, String reason) {
        Company company = requireById(companyId);
        if (status == CompanyStatus.PENDING) {
            throw ApiException.badRequest("A company cannot be moved back to pending");
        }
        company.setStatus(status);
        company.setReviewNote(reason);
        Company saved = companyRepository.save(company);

        switch (status) {
            case APPROVED -> notificationService.create(saved.getUser(), NotificationType.COMPANY_APPROVED,
                    "Company approved",
                    "Your company account has been approved. You can now publish jobs and internships.",
                    "/company/dashboard");
            case REJECTED -> notificationService.create(saved.getUser(), NotificationType.COMPANY_REJECTED,
                    "Company rejected",
                    blankToDefault(reason, "Your company registration was rejected."),
                    "/company/profile");
            case SUSPENDED -> notificationService.create(saved.getUser(), NotificationType.COMPANY_SUSPENDED,
                    "Company suspended",
                    blankToDefault(reason, "Your company account has been suspended."),
                    "/company/profile");
            default -> { }
        }
        return saved;
    }

    public CompanyDashboard dashboard(Company company) {
        UUID id = company.getId();
        return new CompanyDashboard(
                jobRepository.countByCompanyId(id),
                jobRepository.countByCompanyIdAndStatus(id, OpeningStatus.PUBLISHED),
                internshipRepository.countByCompanyId(id),
                internshipRepository.countByCompanyIdAndStatus(id, OpeningStatus.PUBLISHED),
                applicationRepository.countByCompany(id),
                applicationRepository.countByCompanyAndStatus(id, ApplicationStatus.SHORTLISTED),
                applicationRepository.countByCompanyAndStatus(id, ApplicationStatus.SELECTED),
                notificationRepository.countByUserIdAndReadFlagFalse(company.getUser().getId()),
                company.getStatus());
    }

    private String blankToDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }
}
