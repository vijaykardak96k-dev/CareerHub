package com.careerhub.application;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

public final class ApplicationDtos {

    private ApplicationDtos() { }

    public record ApplicationView(UUID id, OpeningType openingType, UUID openingId, String openingTitle,
                                  String companyName, UUID studentId, String studentName, String studentEmail,
                                  ApplicationStatus status, String coverLetter, Instant appliedAt, Instant updatedAt) {

        public static ApplicationView of(Application a) {
            boolean isJob = a.getOpeningType() == OpeningType.JOB;
            UUID openingId = isJob ? a.getJob().getId() : a.getInternship().getId();
            String title = isJob ? a.getJob().getTitle() : a.getInternship().getTitle();
            String company = isJob ? a.getJob().getCompany().getName() : a.getInternship().getCompany().getName();
            return new ApplicationView(a.getId(), a.getOpeningType(), openingId, title, company,
                    a.getStudent().getId(), a.getStudent().getFullName(), a.getStudent().getUser().getEmail(),
                    a.getStatus(), a.getCoverLetter(), a.getAppliedAt(), a.getUpdatedAt());
        }
    }

    public record StatusHistoryView(UUID id, ApplicationStatus fromStatus, ApplicationStatus toStatus,
                                    String note, String changedBy, Instant changedAt) {
        public static StatusHistoryView of(ApplicationStatusHistory h) {
            return new StatusHistoryView(h.getId(), h.getFromStatus(), h.getToStatus(), h.getNote(),
                    h.getChangedBy(), h.getChangedAt());
        }
    }

    public record ApplyRequest(@NotNull OpeningType openingType,
                               @NotNull UUID openingId,
                               @Size(max = 3000) String coverLetter) { }

    public record StatusChangeRequest(@NotNull ApplicationStatus status,
                                      @Size(max = 500) String note) { }
}
