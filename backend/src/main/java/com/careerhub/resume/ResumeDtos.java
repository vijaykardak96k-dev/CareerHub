package com.careerhub.resume;

import com.careerhub.certificate.CertificateDtos;
import com.careerhub.skill.SkillDtos;
import com.careerhub.student.StudentDtos;
import jakarta.validation.constraints.Size;

import java.util.List;

public final class ResumeDtos {

    private ResumeDtos() { }

    public record ResumeView(StudentDtos.StudentProfile personal,
                             String summary,
                             String careerObjective,
                             String template,
                             List<StudentDtos.EducationView> education,
                             List<SkillDtos.StudentSkillView> skills,
                             List<StudentDtos.ProjectView> projects,
                             List<StudentDtos.ExperienceView> experience,
                             List<CertificateDtos.CertificateView> certificates) { }

    public record ResumeRequest(@Size(max = 2000) String summary,
                                @Size(max = 1000) String careerObjective,
                                @Size(max = 40) String template) { }
}
