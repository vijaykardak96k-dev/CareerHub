package com.careerhub.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class AdminDtos {

    private AdminDtos() { }

    public record ActiveFlagRequest(@NotNull Boolean active) { }

    public record AnnouncementRequest(@NotBlank @Size(max = 180) String title,
                                      @NotBlank @Size(max = 1000) String message,
                                      @NotNull Audience audience) {
        public enum Audience { STUDENTS, COMPANIES, ALL }
    }
}
