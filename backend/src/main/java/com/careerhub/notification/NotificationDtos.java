package com.careerhub.notification;

import java.time.Instant;
import java.util.UUID;

public final class NotificationDtos {

    private NotificationDtos() { }

    public record NotificationView(UUID id, String title, String message, String type,
                                   String link, boolean read, Instant createdAt) {
        public static NotificationView of(Notification n) {
            return new NotificationView(n.getId(), n.getTitle(), n.getMessage(), n.getType().name(),
                    n.getLink(), n.isReadFlag(), n.getCreatedAt());
        }
    }
}
