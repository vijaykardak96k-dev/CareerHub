package com.careerhub.assessment;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "assessment_options")
public class AssessmentOption {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false)
    private AssessmentQuestion question;

    @Column(name = "option_text", nullable = false, length = 500)
    private String optionText;

    @Column(nullable = false)
    private boolean correct = false;

    @Column(nullable = false)
    private int position = 0;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public AssessmentQuestion getQuestion() { return question; }
    public void setQuestion(AssessmentQuestion question) { this.question = question; }
    public String getOptionText() { return optionText; }
    public void setOptionText(String optionText) { this.optionText = optionText; }
    public boolean isCorrect() { return correct; }
    public void setCorrect(boolean correct) { this.correct = correct; }
    public int getPosition() { return position; }
    public void setPosition(int position) { this.position = position; }
}
