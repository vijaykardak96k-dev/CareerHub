package com.careerhub.certificate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public final class CertificateDtos {

    private CertificateDtos() { }

    public record CertificateView(UUID id, String name, String issuingOrganization, LocalDate issueDate,
                                  String credentialId, String credentialUrl, CertificateStatus status,
                                  String reviewNote, UUID studentId, String studentName,
                                  Instant createdAt, Instant reviewedAt) {
        public static CertificateView of(Certificate c) {
            return new CertificateView(c.getId(), c.getName(), c.getIssuingOrganization(), c.getIssueDate(),
                    c.getCredentialId(), c.getCredentialUrl(), c.getStatus(), c.getReviewNote(),
                    c.getStudent().getId(), c.getStudent().getFullName(), c.getCreatedAt(), c.getReviewedAt());
        }
    }

    public record CertificateRequest(@NotBlank @Size(max = 180) String name,
                                     @NotBlank @Size(max = 180) String issuingOrganization,
                                     LocalDate issueDate,
                                     @Size(max = 120) String credentialId,
                                     @Size(max = 300) String credentialUrl) { }

    public record ReviewRequest(@NotNull CertificateStatus status, @Size(max = 500) String note) { }
}
