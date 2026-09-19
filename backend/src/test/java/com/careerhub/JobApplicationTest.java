package com.careerhub;

import com.careerhub.support.IntegrationTestBase;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class JobApplicationTest extends IntegrationTestBase {

    private String companyToken;
    private String studentToken;
    private String jobId;

    /** Approved company + published job + registered student. */
    private void scenario() throws Exception {
        companyToken = registerCompany("apply-company@example.com", "Skyline Analytics");
        String admin = createAdminAndLogin("apply-admin@careerhub.edu");

        MvcResult companies = mockMvc.perform(get("/api/v1/admin/companies")
                .header(HttpHeaders.AUTHORIZATION, admin)).andReturn();
        String companyId = body(companies).get("content").get(0).get("id").asText();
        mockMvc.perform(patch("/api/v1/admin/companies/" + companyId + "/status")
                        .header(HttpHeaders.AUTHORIZATION, admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("status", "APPROVED"))))
                .andExpect(status().isOk());

        MvcResult job = mockMvc.perform(post("/api/v1/jobs")
                        .header(HttpHeaders.AUTHORIZATION, companyToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(CompanyApprovalAndJobTest.jobRequest("Backend Engineer", "PUBLISHED"))))
                .andExpect(status().isCreated())
                .andReturn();
        jobId = body(job).get("id").asText();

        studentToken = registerStudent("applicant@example.com", "Sneha Kulkarni");
    }

    private MvcResult apply() throws Exception {
        return mockMvc.perform(post("/api/v1/applications")
                        .header(HttpHeaders.AUTHORIZATION, studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("openingType", "JOB", "openingId", jobId,
                                "coverLetter", "I would like to be considered for this role."))))
                .andReturn();
    }

    @Test
    @DisplayName("a student can apply to a published job")
    void studentCanApply() throws Exception {
        scenario();
        mockMvc.perform(post("/api/v1/applications")
                        .header(HttpHeaders.AUTHORIZATION, studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("openingType", "JOB", "openingId", jobId,
                                "coverLetter", "Please consider my application."))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("APPLIED"))
                .andExpect(jsonPath("$.openingTitle").value("Backend Engineer"));

        mockMvc.perform(get("/api/v1/applications/mine").header(HttpHeaders.AUTHORIZATION, studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    @DisplayName("business rule 1: a student cannot apply to the same job twice")
    void duplicateApplicationIsRejected() throws Exception {
        scenario();
        apply();
        mockMvc.perform(post("/api/v1/applications")
                        .header(HttpHeaders.AUTHORIZATION, studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("openingType", "JOB", "openingId", jobId,
                                "coverLetter", "Second attempt."))))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("business rule 3: a closed job cannot receive applications")
    void closedJobCannotBeAppliedTo() throws Exception {
        scenario();
        mockMvc.perform(patch("/api/v1/jobs/" + jobId + "/close")
                        .header(HttpHeaders.AUTHORIZATION, companyToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLOSED"));

        mockMvc.perform(post("/api/v1/applications")
                        .header(HttpHeaders.AUTHORIZATION, studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("openingType", "JOB", "openingId", jobId,
                                "coverLetter", "Too late."))))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("business rules 12 and 13: a status change is recorded and notifies the student")
    void statusChangeIsRecordedAndNotified() throws Exception {
        scenario();
        String applicationId = body(apply()).get("id").asText();

        mockMvc.perform(patch("/api/v1/applications/" + applicationId + "/status")
                        .header(HttpHeaders.AUTHORIZATION, companyToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("status", "SHORTLISTED", "note", "Strong profile"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SHORTLISTED"));

        MvcResult history = mockMvc.perform(get("/api/v1/applications/" + applicationId + "/history")
                        .header(HttpHeaders.AUTHORIZATION, studentToken))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode entries = body(history);
        org.assertj.core.api.Assertions.assertThat(entries.size()).isGreaterThanOrEqualTo(1);

        mockMvc.perform(get("/api/v1/notifications").header(HttpHeaders.AUTHORIZATION, studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].title").exists());
    }

    @Test
    @DisplayName("business rule 6: a company cannot change another company's applications")
    void foreignCompanyCannotChangeStatus() throws Exception {
        scenario();
        String applicationId = body(apply()).get("id").asText();
        String other = registerCompany("other-company@example.com", "Other Technologies");

        mockMvc.perform(patch("/api/v1/applications/" + applicationId + "/status")
                        .header(HttpHeaders.AUTHORIZATION, other)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("status", "REJECTED"))))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("a student can withdraw an application that is still active")
    void studentCanWithdraw() throws Exception {
        scenario();
        String applicationId = body(apply()).get("id").asText();

        mockMvc.perform(patch("/api/v1/applications/" + applicationId + "/withdraw")
                        .header(HttpHeaders.AUTHORIZATION, studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("WITHDRAWN"));
    }
}
