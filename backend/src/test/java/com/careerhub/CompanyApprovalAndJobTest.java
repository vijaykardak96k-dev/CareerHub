package com.careerhub;

import com.careerhub.support.IntegrationTestBase;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CompanyApprovalAndJobTest extends IntegrationTestBase {

    static Map<String, Object> jobRequest(String title, String status) {
        Map<String, Object> job = new HashMap<>();
        job.put("title", title);
        job.put("description", "Work on the CareerHub platform backend and frontend.");
        job.put("location", "Pune");
        job.put("workMode", "HYBRID");
        job.put("employmentType", "FULL_TIME");
        job.put("salaryMin", 400000);
        job.put("salaryMax", 700000);
        job.put("minCgpa", 6.0);
        job.put("graduationYear", 2026);
        job.put("deadline", LocalDate.now().plusDays(30).toString());
        job.put("vacancies", 3);
        job.put("status", status);
        return job;
    }

    private String companyIdOf(String adminToken) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/admin/companies")
                        .header(HttpHeaders.AUTHORIZATION, adminToken))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode content = body(result).get("content");
        return content.get(0).get("id").asText();
    }

    @Test
    @DisplayName("a company registration starts as PENDING")
    void companyStartsPending() throws Exception {
        String company = registerCompany("pending@example.com", "Pending Systems");
        mockMvc.perform(get("/api/v1/companies/me").header(HttpHeaders.AUTHORIZATION, company))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    @DisplayName("business rule 4: a pending company cannot publish a job")
    void pendingCompanyCannotPublish() throws Exception {
        String company = registerCompany("nopublish@example.com", "Not Approved Ltd");
        mockMvc.perform(post("/api/v1/jobs")
                        .header(HttpHeaders.AUTHORIZATION, company)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(jobRequest("Java Developer", "PUBLISHED"))))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("business rule 8: an admin approves a company, which can then publish a job")
    void approvedCompanyCanPublish() throws Exception {
        String company = registerCompany("approve@example.com", "NovaSoft Technologies");
        String admin = createAdminAndLogin("approver@careerhub.edu");

        String companyId = companyIdOf(admin);
        mockMvc.perform(patch("/api/v1/admin/companies/" + companyId + "/status")
                        .header(HttpHeaders.AUTHORIZATION, admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("status", "APPROVED", "note", "Verified by the placement office"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));

        mockMvc.perform(post("/api/v1/jobs")
                        .header(HttpHeaders.AUTHORIZATION, company)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(jobRequest("Java Developer", "PUBLISHED"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Java Developer"))
                .andExpect(jsonPath("$.status").value("PUBLISHED"))
                .andExpect(jsonPath("$.company.name").value("NovaSoft Technologies"));

        mockMvc.perform(get("/api/v1/jobs/public"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    @DisplayName("a suspended company loses the ability to publish")
    void suspendedCompanyCannotPublish() throws Exception {
        String company = registerCompany("suspend@example.com", "Suspended Systems");
        String admin = createAdminAndLogin("suspender@careerhub.edu");
        String companyId = companyIdOf(admin);

        mockMvc.perform(patch("/api/v1/admin/companies/" + companyId + "/status")
                        .header(HttpHeaders.AUTHORIZATION, admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("status", "SUSPENDED", "note", "Policy violation"))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/jobs")
                        .header(HttpHeaders.AUTHORIZATION, company)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(jobRequest("Java Developer", "PUBLISHED"))))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("business rule 5: a company cannot modify another company's job")
    void companyCannotEditForeignJob() throws Exception {
        String admin = createAdminAndLogin("owner-admin@careerhub.edu");
        String owner = registerCompany("owner@example.com", "Owner Technologies");
        String intruder = registerCompany("intruder@example.com", "Intruder Technologies");

        MvcResult companies = mockMvc.perform(get("/api/v1/admin/companies?size=50")
                .header(HttpHeaders.AUTHORIZATION, admin)).andReturn();
        for (JsonNode node : body(companies).get("content")) {
            mockMvc.perform(patch("/api/v1/admin/companies/" + node.get("id").asText() + "/status")
                    .header(HttpHeaders.AUTHORIZATION, admin)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json(Map.of("status", "APPROVED"))));
        }

        MvcResult created = mockMvc.perform(post("/api/v1/jobs")
                        .header(HttpHeaders.AUTHORIZATION, owner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(jobRequest("Owned Job", "PUBLISHED"))))
                .andExpect(status().isCreated())
                .andReturn();
        String jobId = body(created).get("id").asText();

        mockMvc.perform(patch("/api/v1/jobs/" + jobId + "/close")
                        .header(HttpHeaders.AUTHORIZATION, intruder))
                .andExpect(status().isForbidden());
    }
}
