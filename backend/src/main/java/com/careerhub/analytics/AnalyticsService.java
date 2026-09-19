package com.careerhub.analytics;

import com.careerhub.application.ApplicationRepository;
import com.careerhub.application.ApplicationStatus;
import com.careerhub.certificate.CertificateRepository;
import com.careerhub.certificate.CertificateStatus;
import com.careerhub.company.CompanyRepository;
import com.careerhub.company.CompanyStatus;
import com.careerhub.internship.InternshipRepository;
import com.careerhub.job.JobRepository;
import com.careerhub.job.OpeningStatus;
import com.careerhub.skill.StudentSkillRepository;
import com.careerhub.user.Role;
import com.careerhub.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class AnalyticsService {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final JobRepository jobRepository;
    private final InternshipRepository internshipRepository;
    private final ApplicationRepository applicationRepository;
    private final CertificateRepository certificateRepository;
    private final StudentSkillRepository studentSkillRepository;

    public AnalyticsService(UserRepository userRepository,
                            CompanyRepository companyRepository,
                            JobRepository jobRepository,
                            InternshipRepository internshipRepository,
                            ApplicationRepository applicationRepository,
                            CertificateRepository certificateRepository,
                            StudentSkillRepository studentSkillRepository) {
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
        this.jobRepository = jobRepository;
        this.internshipRepository = internshipRepository;
        this.applicationRepository = applicationRepository;
        this.certificateRepository = certificateRepository;
        this.studentSkillRepository = studentSkillRepository;
    }

    public AnalyticsDtos.AdminOverview overview() {
        return new AnalyticsDtos.AdminOverview(
                userRepository.countByRole(Role.STUDENT),
                userRepository.countByRole(Role.COMPANY),
                companyRepository.countByStatus(CompanyStatus.PENDING),
                jobRepository.countByStatus(OpeningStatus.PUBLISHED),
                internshipRepository.countByStatus(OpeningStatus.PUBLISHED),
                applicationRepository.count(),
                applicationRepository.countByStatus(ApplicationStatus.SELECTED),
                certificateRepository.countByStatus(CertificateStatus.PENDING));
    }

    public AnalyticsDtos.AnalyticsSummary summary() {
        List<AnalyticsDtos.CountPoint> byStatus = new ArrayList<>();
        for (Object[] row : applicationRepository.countGroupedByStatus()) {
            byStatus.add(new AnalyticsDtos.CountPoint(String.valueOf(row[0]), ((Number) row[1]).longValue()));
        }

        List<AnalyticsDtos.CountPoint> byMonth = new ArrayList<>();
        for (Object[] row : jobRepository.countByMonth()) {
            byMonth.add(new AnalyticsDtos.CountPoint(String.valueOf(row[0]), ((Number) row[1]).longValue()));
        }

        List<AnalyticsDtos.CountPoint> topSkills = new ArrayList<>();
        for (Object[] row : studentSkillRepository.countStudentsPerSkill()) {
            if (topSkills.size() == 10) {
                break;
            }
            topSkills.add(new AnalyticsDtos.CountPoint(String.valueOf(row[0]), ((Number) row[1]).longValue()));
        }

        return new AnalyticsDtos.AnalyticsSummary(byStatus, byMonth, topSkills,
                applicationRepository.countByStatus(ApplicationStatus.SELECTED),
                applicationRepository.count());
    }
}
