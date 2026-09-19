package com.careerhub.security;

import com.careerhub.exception.ApiException;
import com.careerhub.user.User;
import com.careerhub.user.UserRepository;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Resolves the authenticated {@link User} for the current request.
 * Controllers inject this instead of reading the SecurityContext themselves.
 */
@Component
public class CurrentUser {

    private final UserRepository userRepository;

    public CurrentUser(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /** The authenticated user, or 401 if the request is anonymous. */
    public User require() {
        UUID id = SecurityUtils.currentUserId();
        return userRepository.findById(id)
                .orElseThrow(() -> ApiException.unauthorized("Authenticated account no longer exists"));
    }

    public UUID requireId() {
        return SecurityUtils.currentUserId();
    }
}
