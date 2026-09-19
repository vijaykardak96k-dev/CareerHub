package com.careerhub.company;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

/** Data transfer objects for the company module. */
public final class CompanyDtos {

    private CompanyDtos() {
    }

    public record CompanyView(UUID id, String email, String name, String logoUrl, String description,
                                  String industry, String website, String location, String contactEmail,
                                  CompanyStatus status, String reviewNote, boolean active, Instant createdAt) {
        public static CompanyView of(Company c) {
            return new CompanyView(c.getId(), c.getUser().getEmail(), c.getName(), c.getLogoUrl(),
                    c.getDescription(), c.getIndustry(), c.getWebsite(), c.getLocation(), c.getContactEmail(),
                    c.getStatus(), c.getReviewNote(), c.getUser().isActive(), c.getCreatedAt());
        }
    }

    /** Minimal company information exposed on public job and internship listings. */
    public record CompanyBrief(UUID id, String name, String logoUrl, String industry, String location) {
        public static CompanyBrief of(Company c) {
            return new CompanyBrief(c.getId(), c.getName(), c.getLogoUrl(), c.getIndustry(), c.getLocation());
        }
    }

    public record CompanyProfileRequest(@NotBlank @Size(max = 150) String name,
                                        @Size(max = 300) String logoUrl,
                                        @Size(max = 2000) String description,
                                        @Size(max = 100) String industry,
                                        @Size(max = 300) String website,
                                        @Size(max = 120) String location,
                                        @Email @Size(max = 160) String contactEmail) {
    }

    public record CompanyStatusRequest(@NotNull CompanyStatus status,
                                       @Size(max = 500) String note) {
    }

    public record CompanyDashboard(long totalJobs, long publishedJobs, long totalInternships,
                                           long publishedInternships, long totalApplications,
                                           long shortlisted, long selected, long unreadNotifications,
                                           CompanyStatus status) {
    }
}
