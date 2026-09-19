package com.careerhub;

import com.careerhub.support.IntegrationTestBase;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Business rule 11: the score is always calculated by the backend, never sent by the client. */
class AssessmentScoringTest extends IntegrationTestBase {

    private String adminToken;
    private String assessmentId;

    private void createAssessment() throws Exception {
        adminToken = createAdminAndLogin("assessment-admin@careerhub.edu");

        MvcResult category = mockMvc.perform(post("/api/v1/admin/skill-categories")
                        .header(HttpHeaders.AUTHORIZATION, adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("name", "Programming", "description", "Core languages"))))
                .andExpect(status().isCreated())
                .andReturn();
        String categoryId = body(category).get("id").asText();

        MvcResult skill = mockMvc.perform(post("/api/v1/admin/skills")
                        .header(HttpHeaders.AUTHORIZATION, adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("name", "Java", "description", "Java language",
                                "categoryId", categoryId, "active", true))))
                .andExpect(status().isCreated())
                .andReturn();
        String skillId = body(skill).get("id").asText();

        Map<String, Object> request = Map.of(
                "title", "Java Fundamentals",
                "description", "Basic Java questions",
                "skillId", skillId,
                "durationMinutes", 15,
                "passingPercentage", 50,
                "active", true,
                "questions", List.of(
                        Map.of("questionText", "Which keyword declares a constant in Java?",
                                "marks", 2,
                                "options", List.of(
                                        Map.of("optionText", "final", "correct", true),
                                        Map.of("optionText", "const", "correct", false),
                                        Map.of("optionText", "static", "correct", false))),
                        Map.of("questionText", "Which collection stores unique elements?",
                                "marks", 3,
                                "options", List.of(
                                        Map.of("optionText", "List", "correct", false),
                                        Map.of("optionText", "Set", "correct", true),
                                        Map.of("optionText", "Map", "correct", false)))));

        MvcResult assessment = mockMvc.perform(post("/api/v1/admin/assessments")
                        .header(HttpHeaders.AUTHORIZATION, adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(request)))
                .andExpect(status().isCreated())
                .andReturn();
        assessmentId = body(assessment).get("id").asText();
    }

    private JsonNode adminQuestions() throws Exception {
        return body(mockMvc.perform(get("/api/v1/admin/assessments/" + assessmentId + "/questions")
                .header(HttpHeaders.AUTHORIZATION, adminToken)).andReturn());
    }

    @Test
    @DisplayName("the questions shown to a student never reveal the correct option")
    void studentQuestionsHideAnswers() throws Exception {
        createAssessment();
        String student = registerStudent("quiz-student@example.com", "Quiz Student");

        MvcResult start = mockMvc.perform(get("/api/v1/assessments/" + assessmentId + "/start")
                        .header(HttpHeaders.AUTHORIZATION, student))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.questions.length()").value(2))
                .andReturn();

        assertThat(start.getResponse().getContentAsString()).doesNotContain("\"correct\"");
    }

    @Test
    @DisplayName("all correct answers produce a full score and a pass")
    void perfectAttemptScoresFullMarks() throws Exception {
        createAssessment();
        String student = registerStudent("perfect@example.com", "Perfect Student");

        List<Map<String, Object>> answers = new ArrayList<>();
        for (JsonNode question : adminQuestions()) {
            for (JsonNode option : question.get("options")) {
                if (option.get("correct").asBoolean()) {
                    answers.add(Map.of("questionId", question.get("id").asText(),
                            "optionId", option.get("id").asText()));
                }
            }
        }

        mockMvc.perform(post("/api/v1/assessments/" + assessmentId + "/submit")
                        .header(HttpHeaders.AUTHORIZATION, student)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("answers", answers))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.score").value(5))
                .andExpect(jsonPath("$.totalMarks").value(5))
                .andExpect(jsonPath("$.correctAnswers").value(2))
                .andExpect(jsonPath("$.totalQuestions").value(2))
                .andExpect(jsonPath("$.passed").value(true));
    }

    @Test
    @DisplayName("wrong answers score zero and do not pass")
    void wrongAnswersScoreZero() throws Exception {
        createAssessment();
        String student = registerStudent("wrong@example.com", "Wrong Student");

        List<Map<String, Object>> answers = new ArrayList<>();
        for (JsonNode question : adminQuestions()) {
            for (JsonNode option : question.get("options")) {
                if (!option.get("correct").asBoolean()) {
                    answers.add(Map.of("questionId", question.get("id").asText(),
                            "optionId", option.get("id").asText()));
                    break;
                }
            }
        }

        mockMvc.perform(post("/api/v1/assessments/" + assessmentId + "/submit")
                        .header(HttpHeaders.AUTHORIZATION, student)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("answers", answers))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.score").value(0))
                .andExpect(jsonPath("$.passed").value(false));

        mockMvc.perform(get("/api/v1/assessments/results").header(HttpHeaders.AUTHORIZATION, student))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    @DisplayName("a student cannot create an assessment")
    void studentCannotCreateAssessment() throws Exception {
        createAssessment();
        String student = registerStudent("not-admin@example.com", "Not Admin");
        mockMvc.perform(post("/api/v1/admin/assessments")
                        .header(HttpHeaders.AUTHORIZATION, student)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("title", "Hack"))))
                .andExpect(status().isForbidden());
    }
}
