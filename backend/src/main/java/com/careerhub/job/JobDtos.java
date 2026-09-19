package com.careerhub.job;

import com.careerhub.company.CompanyDtos;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public final class JobDtos {

    private JobDtos() { }

    public record JobView(UUID id, String title, String description, String location, WorkMode workMode,
                          EmploymentType employmentType, BigDecimal salaryMin, BigDecimal salaryMax,
                          BigDecimal minCgpa, Integer graduationYear, LocalDate deadline, int vacancies,
                          OpeningStatus status, List<String> skills, CompanyDtos.CompanyBrief company,
                          boolean openForApplications, Instant createdAt) {

        public static JobView of(Job job) {
            return new JobView(job.getId(), job.getTitle(), job.getDescription(), job.getLocation(),
                    job.getWorkMode(), job.getEmploymentType(), job.getSalaryMin(), job.getSalaryMax(),
                    job.getMinCgpa(), job.getGraduationYear(), job.getDeadline(), job.getVacancies(),
                    job.getStatus(), job.getSkills().stream().map(s -> s.getName()).sorted().toList(),
                    CompanyDtos.CompanyBrief.of(job.getCompany()), job.isOpenForApplications(), job.getCreatedAt());
        }

        /** Summary projection that avoids loading the (lazy) skill collection. */
        public static JobView summary(Job job) {
            return new JobView(job.getId(), job.getTitle(),
                    job.getDescription() != null && job.getDescription().length() > 280
                            ? job.getDescription().substring(0, 280) + "..." : job.getDescription(),
                    job.getLocation(), job.getWorkMode(), job.getEmploymentType(), job.getSalaryMin(),
                    job.getSalaryMax(), job.getMinCgpa(), job.getGraduationYear(), job.getDeadline(),
                    job.getVacancies(), job.getStatus(), List.of(),
                    CompanyDtos.CompanyBrief.of(job.getCompany()), job.isOpenForApplications(), job.getCreatedAt());
        }
    }

    public record JobRequest(@NotBlank @Size(max = 150) String title,
                             @NotBlank @Size(max = 5000) String description,
                             @Size(max = 120) String location,
                             @NotNull WorkMode workMode,
                             @NotNull EmploymentType employmentType,
                             @DecimalMin("0.0") BigDecimal salaryMin,
                             @DecimalMin("0.0") BigDecimal salaryMax,
                             @DecimalMin("0.0") @DecimalMax("10.0") BigDecimal minCgpa,
                             @Min(1990) @Max(2100) Integer graduationYear,
                             LocalDate deadline,
                             @Min(1) @Max(1000) int vacancies,
                             @NotNull OpeningStatus status,
                             Set<UUID> skillIds) { }
}
