package com.careerhub.assessment;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class AssessmentDtos {

    private AssessmentDtos() { }

    public record AssessmentView(UUID id, String title, String description, UUID skillId, String skillName,
                                 int durationMinutes, int passingPercentage, boolean active,
                                 long questionCount, Instant createdAt) { }

    /** Question as shown to a student: correct answers are never included. */
    public record QuestionView(UUID id, String questionText, int marks, List<OptionView> options) { }

    public record OptionView(UUID id, String optionText) { }

    /** Question as shown to the college admin, including the correct option. */
    public record AdminQuestionView(UUID id, String questionText, int marks, List<AdminOptionView> options) { }

    public record AdminOptionView(UUID id, String optionText, boolean correct) { }

    public record AttemptStart(UUID assessmentId, String title, String skillName, int durationMinutes,
                               int totalMarks, List<QuestionView> questions) { }

    public record AnswerRequest(@NotNull UUID questionId, UUID optionId) { }

    public record SubmitRequest(@NotEmpty @Valid List<AnswerRequest> answers) { }

    public record AttemptResult(UUID id, UUID assessmentId, String assessmentTitle, String skillName,
                                int score, int totalMarks, BigDecimal percentage, int correctAnswers,
                                int totalQuestions, boolean passed, Instant attemptedAt) {
        public static AttemptResult of(AssessmentAttempt a) {
            return new AttemptResult(a.getId(), a.getAssessment().getId(), a.getAssessment().getTitle(),
                    a.getAssessment().getSkill().getName(), a.getScore(), a.getTotalMarks(), a.getPercentage(),
                    a.getCorrectAnswers(), a.getTotalQuestions(), a.isPassed(), a.getAttemptedAt());
        }
    }

    public record OptionRequest(@NotBlank @Size(max = 500) String optionText, boolean correct) { }

    public record QuestionRequest(@NotBlank @Size(max = 1000) String questionText,
                                  @Min(1) @Max(20) int marks,
                                  @Size(min = 2, max = 6) @Valid List<OptionRequest> options) { }

    public record AssessmentRequest(@NotBlank @Size(max = 150) String title,
                                    @Size(max = 1000) String description,
                                    @NotNull UUID skillId,
                                    @Min(1) @Max(180) int durationMinutes,
                                    @Min(1) @Max(100) int passingPercentage,
                                    Boolean active,
                                    @NotEmpty @Valid List<QuestionRequest> questions) { }
}
