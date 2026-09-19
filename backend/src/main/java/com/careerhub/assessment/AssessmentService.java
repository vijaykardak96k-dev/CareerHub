package com.careerhub.assessment;

import com.careerhub.exception.BadRequestException;
import com.careerhub.exception.NotFoundException;
import com.careerhub.notification.NotificationService;
import com.careerhub.notification.NotificationType;
import com.careerhub.skill.Skill;
import com.careerhub.skill.SkillRepository;
import com.careerhub.student.Student;
import com.careerhub.student.StudentService;
import com.careerhub.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional
public class AssessmentService {

    private final AssessmentRepository assessmentRepository;
    private final AssessmentQuestionRepository questionRepository;
    private final AssessmentAttemptRepository attemptRepository;
    private final SkillRepository skillRepository;
    private final StudentService studentService;
    private final NotificationService notificationService;

    public AssessmentService(AssessmentRepository assessmentRepository,
                             AssessmentQuestionRepository questionRepository,
                             AssessmentAttemptRepository attemptRepository,
                             SkillRepository skillRepository,
                             StudentService studentService,
                             NotificationService notificationService) {
        this.assessmentRepository = assessmentRepository;
        this.questionRepository = questionRepository;
        this.attemptRepository = attemptRepository;
        this.skillRepository = skillRepository;
        this.studentService = studentService;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public List<AssessmentDtos.AssessmentView> listActive() {
        return assessmentRepository.findActive().stream().map(this::toView).toList();
    }

    @Transactional(readOnly = true)
    public List<AssessmentDtos.AssessmentView> listAll() {
        return assessmentRepository.findAllWithSkill().stream().map(this::toView).toList();
    }

    private AssessmentDtos.AssessmentView toView(Assessment a) {
        return new AssessmentDtos.AssessmentView(a.getId(), a.getTitle(), a.getDescription(),
                a.getSkill().getId(), a.getSkill().getName(), a.getDurationMinutes(), a.getPassingPercentage(),
                a.isActive(), questionRepository.countByAssessmentId(a.getId()), a.getCreatedAt());
    }

    /** Returns the question paper without any indication of the correct options. */
    @Transactional(readOnly = true)
    public AssessmentDtos.AttemptStart start(UUID assessmentId) {
        Assessment assessment = require(assessmentId);
        if (!assessment.isActive()) {
            throw new BadRequestException("This assessment is not currently available");
        }
        List<AssessmentQuestion> questions = questionRepository.findWithOptions(assessmentId);
        if (questions.isEmpty()) {
            throw new BadRequestException("This assessment has no questions yet");
        }
        int totalMarks = questions.stream().mapToInt(AssessmentQuestion::getMarks).sum();
        List<AssessmentDtos.QuestionView> paper = questions.stream()
                .map(q -> new AssessmentDtos.QuestionView(q.getId(), q.getQuestionText(), q.getMarks(),
                        q.getOptions().stream()
                                .map(o -> new AssessmentDtos.OptionView(o.getId(), o.getOptionText())).toList()))
                .toList();
        return new AssessmentDtos.AttemptStart(assessment.getId(), assessment.getTitle(),
                assessment.getSkill().getName(), assessment.getDurationMinutes(), totalMarks, paper);
    }

    /** Scoring always happens on the backend - the client never sends a score. */
    public AssessmentDtos.AttemptResult submit(User user, UUID assessmentId,
                                               AssessmentDtos.SubmitRequest request) {
        Student student = studentService.requireByUser(user);
        Assessment assessment = require(assessmentId);
        List<AssessmentQuestion> questions = questionRepository.findWithOptions(assessmentId);
        if (questions.isEmpty()) {
            throw new BadRequestException("This assessment has no questions yet");
        }

        Map<UUID, UUID> answers = new HashMap<>();
        for (AssessmentDtos.AnswerRequest answer : request.answers()) {
            answers.put(answer.questionId(), answer.optionId());
        }

        int score = 0;
        int totalMarks = 0;
        int correct = 0;
        for (AssessmentQuestion question : questions) {
            totalMarks += question.getMarks();
            UUID chosen = answers.get(question.getId());
            if (chosen == null) {
                continue;
            }
            boolean isCorrect = question.getOptions().stream()
                    .anyMatch(o -> o.getId().equals(chosen) && o.isCorrect());
            if (isCorrect) {
                score += question.getMarks();
                correct++;
            }
        }

        BigDecimal percentage = totalMarks == 0 ? BigDecimal.ZERO
                : BigDecimal.valueOf(score * 100.0 / totalMarks).setScale(2, RoundingMode.HALF_UP);

        AssessmentAttempt attempt = new AssessmentAttempt();
        attempt.setAssessment(assessment);
        attempt.setStudent(student);
        attempt.setScore(score);
        attempt.setTotalMarks(totalMarks);
        attempt.setPercentage(percentage);
        attempt.setCorrectAnswers(correct);
        attempt.setTotalQuestions(questions.size());
        attempt.setPassed(percentage.doubleValue() >= assessment.getPassingPercentage());
        AssessmentAttempt saved = attemptRepository.save(attempt);

        notificationService.create(user, NotificationType.ASSESSMENT_RESULT,
                "Assessment result: " + assessment.getTitle(),
                "You scored " + percentage + "% (" + score + "/" + totalMarks + ").",
                "/student/assessments");

        return AssessmentDtos.AttemptResult.of(saved);
    }

    @Transactional(readOnly = true)
    public List<AssessmentDtos.AttemptResult> results(User user) {
        Student student = studentService.requireByUser(user);
        return attemptRepository.findByStudent(student.getId()).stream()
                .map(AssessmentDtos.AttemptResult::of).toList();
    }

    // ---------- college admin ----------
    public AssessmentDtos.AssessmentView create(AssessmentDtos.AssessmentRequest request) {
        Assessment assessment = new Assessment();
        applyAndSave(assessment, request);
        return toView(assessment);
    }

    public AssessmentDtos.AssessmentView update(UUID id, AssessmentDtos.AssessmentRequest request) {
        Assessment assessment = require(id);
        assessment.getQuestions().clear();
        applyAndSave(assessment, request);
        return toView(assessment);
    }

    private void applyAndSave(Assessment assessment, AssessmentDtos.AssessmentRequest request) {
        Skill skill = skillRepository.findById(request.skillId())
                .orElseThrow(() -> new BadRequestException("Unknown skill"));
        assessment.setSkill(skill);
        assessment.setTitle(request.title());
        assessment.setDescription(request.description());
        assessment.setDurationMinutes(request.durationMinutes());
        assessment.setPassingPercentage(request.passingPercentage());
        assessment.setActive(request.active() == null || request.active());

        int position = 0;
        for (AssessmentDtos.QuestionRequest questionRequest : request.questions()) {
            long correctCount = questionRequest.options().stream()
                    .filter(AssessmentDtos.OptionRequest::correct).count();
            if (correctCount != 1) {
                throw new BadRequestException("Each question must have exactly one correct option");
            }
            AssessmentQuestion question = new AssessmentQuestion();
            question.setAssessment(assessment);
            question.setQuestionText(questionRequest.questionText());
            question.setMarks(questionRequest.marks());
            question.setPosition(position++);

            int optionPosition = 0;
            for (AssessmentDtos.OptionRequest optionRequest : questionRequest.options()) {
                AssessmentOption option = new AssessmentOption();
                option.setQuestion(question);
                option.setOptionText(optionRequest.optionText());
                option.setCorrect(optionRequest.correct());
                option.setPosition(optionPosition++);
                question.getOptions().add(option);
            }
            assessment.getQuestions().add(question);
        }
        assessmentRepository.saveAndFlush(assessment);
    }

    public void delete(UUID id) {
        assessmentRepository.delete(require(id));
    }

    @Transactional(readOnly = true)
    public List<AssessmentDtos.AdminQuestionView> adminQuestions(UUID assessmentId) {
        return questionRepository.findWithOptions(assessmentId).stream()
                .map(q -> new AssessmentDtos.AdminQuestionView(q.getId(), q.getQuestionText(), q.getMarks(),
                        q.getOptions().stream()
                                .map(o -> new AssessmentDtos.AdminOptionView(o.getId(), o.getOptionText(), o.isCorrect()))
                                .toList()))
                .toList();
    }

    private Assessment require(UUID id) {
        return assessmentRepository.findDetailed(id)
                .orElseThrow(() -> new NotFoundException("Assessment not found"));
    }
}
