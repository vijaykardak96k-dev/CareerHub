package com.careerhub.security;

import com.careerhub.exception.ApiException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

/** Helper for reading the authenticated principal inside services. */
public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static AppUserDetails currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AppUserDetails principal)) {
            throw ApiException.unauthorized("Authentication is required");
        }
        return principal;
    }

    public static UUID currentUserId() {
        return currentUser().getId();
    }
}
