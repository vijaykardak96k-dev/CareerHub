package com.careerhub.internship;

import com.careerhub.company.CompanyDtos;
import com.careerhub.job.OpeningStatus;
import com.careerhub.job.WorkMode;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public final class InternshipDtos {

    private InternshipDtos() { }

    public record InternshipView(UUID id, String title, String description, String location, WorkMode workMode,
                                 int durationMonths, BigDecimal stipend, String eligibility, BigDecimal minCgpa,
                                 Integer graduationYear, LocalDate deadline, int vacancies, OpeningStatus status,
                                 List<String> skills, CompanyDtos.CompanyBrief company,
                                 boolean openForApplications, Instant createdAt) {

        public static InternshipView of(Internship i) {
            return new InternshipView(i.getId(), i.getTitle(), i.getDescription(), i.getLocation(), i.getWorkMode(),
                    i.getDurationMonths(), i.getStipend(), i.getEligibility(), i.getMinCgpa(), i.getGraduationYear(),
                    i.getDeadline(), i.getVacancies(), i.getStatus(),
                    i.getSkills().stream().map(s -> s.getName()).sorted().toList(),
                    CompanyDtos.CompanyBrief.of(i.getCompany()), i.isOpenForApplications(), i.getCreatedAt());
        }

        public static InternshipView summary(Internship i) {
            return new InternshipView(i.getId(), i.getTitle(),
                    i.getDescription() != null && i.getDescription().length() > 280
                            ? i.getDescription().substring(0, 280) + "..." : i.getDescription(),
                    i.getLocation(), i.getWorkMode(), i.getDurationMonths(), i.getStipend(), i.getEligibility(),
                    i.getMinCgpa(), i.getGraduationYear(), i.getDeadline(), i.getVacancies(), i.getStatus(),
                    List.of(), CompanyDtos.CompanyBrief.of(i.getCompany()), i.isOpenForApplications(), i.getCreatedAt());
        }
    }

    public record InternshipRequest(@NotBlank @Size(max = 150) String title,
                                    @NotBlank @Size(max = 5000) String description,
                                    @Size(max = 120) String location,
                                    @NotNull WorkMode workMode,
                                    @Min(1) @Max(24) int durationMonths,
                                    @DecimalMin("0.0") BigDecimal stipend,
                                    @Size(max = 500) String eligibility,
                                    @DecimalMin("0.0") @DecimalMax("10.0") BigDecimal minCgpa,
                                    @Min(1990) @Max(2100) Integer graduationYear,
                                    LocalDate deadline,
                                    @Min(1) @Max(1000) int vacancies,
                                    @NotNull OpeningStatus status,
                                    Set<UUID> skillIds) { }
}
