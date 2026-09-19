package com.careerhub;

import com.careerhub.support.IntegrationTestBase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class StudentProfileTest extends IntegrationTestBase {

    private Map<String, Object> fullProfile() {
        Map<String, Object> profile = new HashMap<>();
        profile.put("fullName", "Aditya Patil");
        profile.put("phone", "9876543210");
        profile.put("college", "Modern College of Computer Science");
        profile.put("department", "Computer Applications");
        profile.put("course", "BCA");
        profile.put("graduationYear", 2026);
        profile.put("cgpa", 8.4);
        profile.put("location", "Pune");
        profile.put("photoUrl", "https://example.com/photo.png");
        profile.put("bio", "Final year BCA student focused on backend development.");
        profile.put("githubUrl", "https://github.com/aditya");
        profile.put("linkedinUrl", "https://linkedin.com/in/aditya");
        profile.put("portfolioUrl", "https://aditya.example.com");
        return profile;
    }

    @Test
    @DisplayName("a student can update their own profile and completion increases")
    void profileCanBeUpdated() throws Exception {
        String token = registerStudent("profile@example.com", "Aditya Patil");

        MvcResult before = mockMvc.perform(get("/api/v1/students/me").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andReturn();
        int completionBefore = body(before).get("profileCompletion").asInt();

        MvcResult after = mockMvc.perform(put("/api/v1/students/me")
                        .header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(fullProfile())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.college").value("Modern College of Computer Science"))
                .andReturn();

        assertThat(body(after).get("profileCompletion").asInt()).isGreaterThan(completionBefore);
    }

    @Test
    @DisplayName("invalid profile data is rejected with 400")
    void invalidProfileIsRejected() throws Exception {
        String token = registerStudent("badprofile@example.com", "Bad Profile");
        Map<String, Object> invalid = fullProfile();
        invalid.put("fullName", "");
        invalid.put("cgpa", 42);

        mockMvc.perform(put("/api/v1/students/me")
                        .header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(invalid)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("education, projects and experience can be added to a profile")
    void profileSectionsCanBeManaged() throws Exception {
        String token = registerStudent("sections@example.com", "Section Student");

        mockMvc.perform(post("/api/v1/students/me/education")
                        .header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("degree", "BCA", "institution", "Modern College",
                                "specialization", "Computer Applications",
                                "startYear", 2023, "endYear", 2026, "grade", "8.4 CGPA"))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/students/me/projects")
                        .header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("title", "CareerHub", "description", "Placement portal",
                                "techStack", "Spring Boot, React"))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/students/me/experience")
                        .header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("companyName", "NovaSoft", "roleTitle", "Intern",
                                "description", "Built REST endpoints", "location", "Pune",
                                "currentlyWorking", false))))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/students/me/education").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
        mockMvc.perform(get("/api/v1/students/me/projects").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
        mockMvc.perform(get("/api/v1/students/me/experience").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    @DisplayName("the student dashboard is calculated from stored data")
    void dashboardComesFromTheDatabase() throws Exception {
        String token = registerStudent("dash@example.com", "Dashboard Student");
        mockMvc.perform(get("/api/v1/students/me/dashboard").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.skillCount").value(0))
                .andExpect(jsonPath("$.activeApplications").value(0))
                .andExpect(jsonPath("$.profileCompletion").isNumber());
    }
}
