package com.careerhub.support;

import com.careerhub.user.Role;
import com.careerhub.user.User;
import com.careerhub.user.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/**
 * Shared harness for the API tests: boots the whole application against an in-memory
 * database and exposes small helpers for registering and authenticating users.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public abstract class IntegrationTestBase {

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    @Autowired
    protected UserRepository userRepository;

    @Autowired
    protected PasswordEncoder passwordEncoder;

    protected static final String PASSWORD = "Password@123";

    @BeforeEach
    void cleanContext() {
        // Each test runs inside its own rolled-back transaction.
    }

    protected String json(Object value) throws Exception {
        return objectMapper.writeValueAsString(value);
    }

    /** Registers a student and returns the bearer token. */
    protected String registerStudent(String email, String fullName) throws Exception {
        return register(Map.of("email", email, "password", PASSWORD,
                "role", "STUDENT", "fullName", fullName));
    }

    /** Registers a company (which starts as PENDING) and returns the bearer token. */
    protected String registerCompany(String email, String companyName) throws Exception {
        return register(Map.of("email", email, "password", PASSWORD,
                "role", "COMPANY", "companyName", companyName));
    }

    private String register(Map<String, Object> body) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(body)))
                .andReturn();
        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        return "Bearer " + node.get("token").asText();
    }

    /** Creates a college administrator directly, mirroring how the college provisions one. */
    protected String createAdminAndLogin(String email) throws Exception {
        User admin = new User();
        admin.setEmail(email);
        admin.setPasswordHash(passwordEncoder.encode(PASSWORD));
        admin.setRole(Role.COLLEGE_ADMIN);
        admin.setActive(true);
        userRepository.save(admin);
        return login(email, PASSWORD);
    }

    protected String login(String email, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", email, "password", password))))
                .andReturn();
        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        return "Bearer " + node.get("token").asText();
    }

    protected JsonNode body(MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }
}
