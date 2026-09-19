package com.careerhub.student;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Data transfer objects for the student module. Entities are never exposed directly. */
public final class StudentDtos {

    private StudentDtos() {
    }

    public record StudentProfile(UUID id, String email, String fullName, String phone, String college,
                                 String department, String course, Integer graduationYear, BigDecimal cgpa,
                                 String location, String photoUrl, String bio, String githubUrl,
                                 String linkedinUrl, String portfolioUrl, int profileCompletion,
                                 boolean active) {
        public static StudentProfile of(Student s) {
            return new StudentProfile(s.getId(), s.getUser().getEmail(), s.getFullName(), s.getPhone(),
                    s.getCollege(), s.getDepartment(), s.getCourse(), s.getGraduationYear(), s.getCgpa(),
                    s.getLocation(), s.getPhotoUrl(), s.getBio(), s.getGithubUrl(), s.getLinkedinUrl(),
                    s.getPortfolioUrl(), s.getProfileCompletion(), s.getUser().isActive());
        }
    }

    public record ProfileRequest(@NotBlank @Size(max = 120) String fullName,
                                 @Size(max = 20) @Pattern(regexp = "^$|^[0-9+\\-\\s]{6,20}$",
                                         message = "Phone number is not valid") String phone,
                                 @Size(max = 150) String college,
                                 @Size(max = 100) String department,
                                 @Size(max = 100) String course,
                                 @Min(1990) @Max(2100) Integer graduationYear,
                                 @DecimalMin("0.0") @DecimalMax("10.0") BigDecimal cgpa,
                                 @Size(max = 120) String location,
                                 @Size(max = 300) String photoUrl,
                                 @Size(max = 1000) String bio,
                                 @Size(max = 300) String githubUrl,
                                 @Size(max = 300) String linkedinUrl,
                                 @Size(max = 300) String portfolioUrl) {
    }

    public record EducationView(UUID id, String degree, String institution, String specialization,
                                    Integer startYear, Integer endYear, String grade) {
        public static EducationView of(StudentEducation e) {
            return new EducationView(e.getId(), e.getDegree(), e.getInstitution(), e.getSpecialization(),
                    e.getStartYear(), e.getEndYear(), e.getGrade());
        }
    }

    public record EducationRequest(@NotBlank @Size(max = 120) String degree,
                                   @NotBlank @Size(max = 150) String institution,
                                   @Size(max = 120) String specialization,
                                   @Min(1950) @Max(2100) Integer startYear,
                                   @Min(1950) @Max(2100) Integer endYear,
                                   @Size(max = 30) String grade) {
    }

    public record ProjectView(UUID id, String title, String description, String techStack,
                                  String projectUrl, String repoUrl, LocalDate startDate, LocalDate endDate) {
        public static ProjectView of(StudentProject p) {
            return new ProjectView(p.getId(), p.getTitle(), p.getDescription(), p.getTechStack(),
                    p.getProjectUrl(), p.getRepoUrl(), p.getStartDate(), p.getEndDate());
        }
    }

    public record ProjectRequest(@NotBlank @Size(max = 150) String title,
                                 @Size(max = 2000) String description,
                                 @Size(max = 300) String techStack,
                                 @Size(max = 300) String projectUrl,
                                 @Size(max = 300) String repoUrl,
                                 LocalDate startDate,
                                 LocalDate endDate) {
    }

    public record ExperienceView(UUID id, String companyName, String roleTitle, String description,
                                     String location, LocalDate startDate, LocalDate endDate,
                                     boolean currentlyWorking) {
        public static ExperienceView of(StudentExperience x) {
            return new ExperienceView(x.getId(), x.getCompanyName(), x.getRoleTitle(), x.getDescription(),
                    x.getLocation(), x.getStartDate(), x.getEndDate(), x.isCurrentlyWorking());
        }
    }

    public record ExperienceRequest(@NotBlank @Size(max = 150) String companyName,
                                    @NotBlank @Size(max = 120) String roleTitle,
                                    @Size(max = 2000) String description,
                                    @Size(max = 120) String location,
                                    LocalDate startDate,
                                    LocalDate endDate,
                                    boolean currentlyWorking) {
    }

    public record StudentDashboard(int profileCompletion,
                                   long skillCount,
                                   long certificateCount,
                                   long verifiedCertificateCount,
                                   long assessmentCount,
                                   double averageAssessmentScore,
                                   long activeApplications,
                                   long shortlistedApplications,
                                   long selectedApplications,
                                   long unreadNotifications) {
    }
}
