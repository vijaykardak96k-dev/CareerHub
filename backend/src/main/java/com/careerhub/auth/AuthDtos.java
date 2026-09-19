package com.careerhub.auth;

import com.careerhub.user.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public final class AuthDtos {

    private AuthDtos() { }

    public record RegisterRequest(@NotBlank @Email @Size(max = 160) String email,
                                  @NotBlank @Size(min = 8, max = 72) String password,
                                  @NotNull Role role,
                                  /* student */
                                  @Size(max = 120) String fullName,
                                  /* company */
                                  @Size(max = 150) String companyName) { }

    public record LoginRequest(@NotBlank @Email String email,
                               @NotBlank String password) { }

    public record AuthResponse(String token, long expiresIn, AccountView user) { }

    public record AccountView(UUID id, String email, Role role, String displayName, boolean active,
                              String companyStatus, Integer profileCompletion) { }

    public record ChangePasswordRequest(@NotBlank String currentPassword,
                                        @NotBlank @Size(min = 8, max = 72) String newPassword) { }
}
