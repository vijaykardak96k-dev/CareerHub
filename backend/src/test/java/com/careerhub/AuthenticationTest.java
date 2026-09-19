package com.careerhub;

import com.careerhub.support.IntegrationTestBase;
import com.careerhub.user.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthenticationTest extends IntegrationTestBase {

    @Test
    @DisplayName("a student can register and receives a token, never a password")
    void studentCanRegister() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "riya@example.com", "password", PASSWORD,
                                "role", "STUDENT", "fullName", "Riya Sharma"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.user.email").value("riya@example.com"))
                .andExpect(jsonPath("$.user.role").value("STUDENT"))
                .andExpect(jsonPath("$.user.passwordHash").doesNotExist())
                .andExpect(jsonPath("$.user.password").doesNotExist());
    }

    @Test
    @DisplayName("the same email cannot be registered twice")
    void duplicateEmailIsRejected() throws Exception {
        registerStudent("dup@example.com", "Duplicate Student");
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "dup@example.com", "password", PASSWORD,
                                "role", "STUDENT", "fullName", "Duplicate Student"))))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("college administrator accounts cannot be self registered")
    void adminSelfRegistrationIsForbidden() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "fake-admin@example.com", "password", PASSWORD,
                                "role", "COLLEGE_ADMIN", "fullName", "Fake Admin"))))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("a wrong password does not return a token")
    void wrongPasswordIsRejected() throws Exception {
        registerStudent("wrongpass@example.com", "Test Student");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "wrongpass@example.com", "password", "NotThePassword1!"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("business rule 14: a deactivated account cannot log in")
    void deactivatedUserCannotLogIn() throws Exception {
        registerStudent("disabled@example.com", "Disabled Student");
        User user = userRepository.findByEmailIgnoreCase("disabled@example.com").orElseThrow();
        user.setActive(false);
        userRepository.save(user);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "disabled@example.com", "password", PASSWORD))))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("the current account can be read with a valid token")
    void meReturnsTheAuthenticatedAccount() throws Exception {
        String token = registerStudent("me@example.com", "Me Student");
        mockMvc.perform(get("/api/v1/auth/me").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("me@example.com"));
    }

    @Test
    @DisplayName("a password can be changed and the old one stops working")
    void passwordCanBeChanged() throws Exception {
        String token = registerStudent("changer@example.com", "Change Me");
        mockMvc.perform(post("/api/v1/auth/change-password")
                        .header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("currentPassword", PASSWORD, "newPassword", "BrandNew@456"))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "changer@example.com", "password", PASSWORD))))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "changer@example.com", "password", "BrandNew@456"))))
                .andExpect(status().isOk());
    }
}
