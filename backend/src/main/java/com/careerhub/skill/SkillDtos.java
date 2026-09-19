package com.careerhub.skill;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/** Data transfer objects for the skill catalogue and skill gap analysis. */
public final class SkillDtos {

    private SkillDtos() {
    }

    public record SkillView(UUID id, String name, String description, boolean active,
                            UUID categoryId, String categoryName) {
        public static SkillView of(Skill skill) {
            return new SkillView(skill.getId(), skill.getName(), skill.getDescription(), skill.isActive(),
                    skill.getCategory().getId(), skill.getCategory().getName());
        }
    }

    /** A category together with the skills that belong to it. */
    public record CategoryView(UUID id, String name, String description, List<SkillView> skills) {
        public static CategoryView of(SkillCategory category, List<SkillView> skills) {
            return new CategoryView(category.getId(), category.getName(), category.getDescription(), skills);
        }
    }

    public record StudentSkillView(UUID id, UUID skillId, String skillName, String categoryName,
                                   Proficiency proficiency, BigDecimal yearsExperience) {
        public static StudentSkillView of(StudentSkill studentSkill) {
            return new StudentSkillView(studentSkill.getId(),
                    studentSkill.getSkill().getId(),
                    studentSkill.getSkill().getName(),
                    studentSkill.getSkill().getCategory().getName(),
                    studentSkill.getProficiency(),
                    studentSkill.getYearsExperience());
        }
    }

    public record SkillRequest(@NotBlank @Size(max = 80) String name,
                               @Size(max = 255) String description,
                               @NotNull UUID categoryId,
                               Boolean active) {
    }

    public record CategoryRequest(@NotBlank @Size(max = 80) String name,
                                  @Size(max = 255) String description) {
    }

    public record StudentSkillRequest(@NotNull UUID skillId,
                                      @NotNull Proficiency proficiency,
                                      @DecimalMin("0.0") @DecimalMax("50.0") BigDecimal yearsExperience) {
    }

    /** Result of comparing a student's skills against the skills an opening requires. */
    public record SkillGapView(String target, List<String> matchedSkills, List<String> missingSkills,
                               int matchPercentage) {
    }
}
