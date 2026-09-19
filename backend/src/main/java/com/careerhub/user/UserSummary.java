package com.careerhub.user;

import java.time.Instant;
import java.util.UUID;

/** Public view of a user account. The password hash is never exposed. */
public record UserSummary(UUID id, String email, Role role, boolean active, Instant createdAt) {
    public static UserSummary of(User user) {
        return new UserSummary(user.getId(), user.getEmail(), user.getRole(), user.isActive(), user.getCreatedAt());
    }
}
