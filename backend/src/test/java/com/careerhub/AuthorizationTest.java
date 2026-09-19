package com.careerhub;

import com.careerhub.support.IntegrationTestBase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** The backend, not the browser, is what actually enforces access control. */
class AuthorizationTest extends IntegrationTestBase {

    @Test
    @DisplayName("anonymous requests to protected endpoints return 401")
    void anonymousRequestIsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/students/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("the public job board does not require a token")
    void publicJobBoardIsOpen() throws Exception {
        mockMvc.perform(get("/api/v1/jobs/public"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("a student cannot reach college administrator endpoints")
    void studentCannotReachAdminEndpoints() throws Exception {
        String student = registerStudent("rbac-student@example.com", "RBAC Student");
        mockMvc.perform(get("/api/v1/admin/overview").header(HttpHeaders.AUTHORIZATION, student))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/analytics/summary").header(HttpHeaders.AUTHORIZATION, student))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("a company cannot use student-only endpoints")
    void companyCannotUseStudentEndpoints() throws Exception {
        String company = registerCompany("rbac-company@example.com", "RBAC Technologies");
        mockMvc.perform(get("/api/v1/students/me").header(HttpHeaders.AUTHORIZATION, company))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/resume").header(HttpHeaders.AUTHORIZATION, company))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("a college administrator can reach the admin overview")
    void adminCanReachAdminEndpoints() throws Exception {
        String admin = createAdminAndLogin("rbac-admin@careerhub.edu");
        mockMvc.perform(get("/api/v1/admin/overview").header(HttpHeaders.AUTHORIZATION, admin))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("a malformed token is rejected")
    void malformedTokenIsRejected() throws Exception {
        mockMvc.perform(get("/api/v1/students/me").header(HttpHeaders.AUTHORIZATION, "Bearer not-a-real-token"))
                .andExpect(status().isUnauthorized());
    }
}
