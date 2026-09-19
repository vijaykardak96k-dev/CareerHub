package com.careerhub.config;

import com.careerhub.application.Application;
import com.careerhub.application.ApplicationRepository;
import com.careerhub.application.ApplicationStatus;
import com.careerhub.application.ApplicationStatusHistory;
import com.careerhub.application.ApplicationStatusHistoryRepository;
import com.careerhub.application.OpeningType;
import com.careerhub.assessment.Assessment;
import com.careerhub.assessment.AssessmentOption;
import com.careerhub.assessment.AssessmentQuestion;
import com.careerhub.assessment.AssessmentRepository;
import com.careerhub.certificate.Certificate;
import com.careerhub.certificate.CertificateRepository;
import com.careerhub.certificate.CertificateStatus;
import com.careerhub.company.Company;
import com.careerhub.company.CompanyRepository;
import com.careerhub.company.CompanyStatus;
import com.careerhub.internship.Internship;
import com.careerhub.internship.InternshipRepository;
import com.careerhub.job.EmploymentType;
import com.careerhub.job.Job;
import com.careerhub.job.JobRepository;
import com.careerhub.job.OpeningStatus;
import com.careerhub.job.WorkMode;
import com.careerhub.notification.NotificationService;
import com.careerhub.notification.NotificationType;
import com.careerhub.skill.Proficiency;
import com.careerhub.skill.Skill;
import com.careerhub.skill.SkillRepository;
import com.careerhub.skill.StudentSkill;
import com.careerhub.skill.StudentSkillRepository;
import com.careerhub.student.Student;
import com.careerhub.student.StudentEducation;
import com.careerhub.student.StudentEducationRepository;
import com.careerhub.student.StudentProject;
import com.careerhub.student.StudentProjectRepository;
import com.careerhub.student.StudentRepository;
import com.careerhub.student.StudentService;
import com.careerhub.user.Role;
import com.careerhub.user.User;
import com.careerhub.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Development seed data. Password hashes are produced with the configured
 * {@link PasswordEncoder}, so the demo accounts always work. The seeder runs once,
 * only when the users table is still empty, and can be disabled with SEED_DEMO_DATA=false.
 */
@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true", matchIfMissing = false)
public class DemoDataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final StudentEducationRepository educationRepository;
    private final StudentProjectRepository projectRepository;
    private final StudentSkillRepository studentSkillRepository;
    private final CompanyRepository companyRepository;
    private final JobRepository jobRepository;
    private final InternshipRepository internshipRepository;
    private final ApplicationRepository applicationRepository;
    private final ApplicationStatusHistoryRepository historyRepository;
    private final AssessmentRepository assessmentRepository;
    private final CertificateRepository certificateRepository;
    private final SkillRepository skillRepository;
    private final StudentService studentService;
    private final NotificationService notificationService;
    private final PasswordEncoder passwordEncoder;
    private final String seedPassword;

    public DemoDataSeeder(UserRepository userRepository,
                          StudentRepository studentRepository,
                          StudentEducationRepository educationRepository,
                          StudentProjectRepository projectRepository,
                          StudentSkillRepository studentSkillRepository,
                          CompanyRepository companyRepository,
                          JobRepository jobRepository,
                          InternshipRepository internshipRepository,
                          ApplicationRepository applicationRepository,
                          ApplicationStatusHistoryRepository historyRepository,
                          AssessmentRepository assessmentRepository,
                          CertificateRepository certificateRepository,
                          SkillRepository skillRepository,
                          StudentService studentService,
                          NotificationService notificationService,
                          PasswordEncoder passwordEncoder,
                          @Value("${app.seed.password}") String seedPassword) {
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
        this.educationRepository = educationRepository;
        this.projectRepository = projectRepository;
        this.studentSkillRepository = studentSkillRepository;
        this.companyRepository = companyRepository;
        this.jobRepository = jobRepository;
        this.internshipRepository = internshipRepository;
        this.applicationRepository = applicationRepository;
        this.historyRepository = historyRepository;
        this.assessmentRepository = assessmentRepository;
        this.certificateRepository = certificateRepository;
        this.skillRepository = skillRepository;
        this.studentService = studentService;
        this.notificationService = notificationService;
        this.passwordEncoder = passwordEncoder;
        this.seedPassword = seedPassword;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userRepository.count() > 0) {
            return;
        }
        log.info("Seeding CareerHub demo data");

        User admin = user("admin@careerhub.edu", Role.COLLEGE_ADMIN);

        Student riya = student("riya.sharma@student.careerhub.edu", "Riya Sharma", 2026,
                new BigDecimal("8.70"), "Pune", "Full stack learner focused on Java and React.");
        Student aditya = student("aditya.patil@student.careerhub.edu", "Aditya Patil", 2026,
                new BigDecimal("7.90"), "Ahilyanagar", "Backend developer interested in cloud native systems.");
        Student sneha = student("sneha.kulkarni@student.careerhub.edu", "Sneha Kulkarni", 2027,
                new BigDecimal("9.10"), "Mumbai", "Frontend developer and UI enthusiast.");
        Student rahul = student("rahul.deshmukh@student.careerhub.edu", "Rahul Deshmukh", 2026,
                new BigDecimal("7.10"), "Nashik", "Aspiring DevOps engineer.");
        Student pooja = student("pooja.jadhav@student.careerhub.edu", "Pooja Jadhav", 2027,
                new BigDecimal("8.20"), "Pune", "Data and testing enthusiast.");

        Company nova = company("hr@novasoft.example", "NovaSoft Technologies", CompanyStatus.APPROVED,
                "Product engineering company building SaaS platforms for education.", "Information Technology",
                "https://novasoft.example", "Pune");
        Company skyline = company("careers@skylineanalytics.example", "Skyline Analytics", CompanyStatus.APPROVED,
                "Data analytics and business intelligence consultancy.", "Analytics",
                "https://skylineanalytics.example", "Mumbai");
        Company brightwave = company("talent@brightwave.example", "Brightwave Systems", CompanyStatus.PENDING,
                "Cloud infrastructure and managed DevOps services.", "Cloud Services",
                "https://brightwave.example", "Bengaluru");

        // ---------- student detail ----------
        education(riya, "Bachelor of Computer Applications", "CareerHub College of Science", 2023, 2026, "8.7 CGPA");
        education(aditya, "Bachelor of Computer Applications", "CareerHub College of Science", 2023, 2026, "7.9 CGPA");
        education(sneha, "Bachelor of Computer Applications", "CareerHub College of Science", 2024, 2027, "9.1 CGPA");

        project(riya, "CareerHub portal clone", "Campus placement portal built with Spring Boot and React.",
                "Java, Spring Boot, React, PostgreSQL");
        project(aditya, "Inventory microservice", "REST service for stock tracking with JWT security.",
                "Java, Spring Boot, PostgreSQL, Docker");
        project(sneha, "Design system starter", "Reusable component library with Tailwind CSS.",
                "React, TypeScript, Tailwind CSS");

        addSkills(riya, List.of("Java", "Spring Boot", "React", "PostgreSQL", "Git"));
        addSkills(aditya, List.of("Java", "Spring Boot", "Docker", "SQL", "Linux"));
        addSkills(sneha, List.of("React", "TypeScript", "Tailwind CSS", "HTML5", "CSS3"));
        addSkills(rahul, List.of("Docker", "Kubernetes", "Linux", "Git"));
        addSkills(pooja, List.of("Python", "SQL", "JUnit", "Postman"));

        certificate(riya, "Oracle Certified Associate, Java SE 8 Programmer", "Oracle",
                LocalDate.of(2025, 4, 18), CertificateStatus.VERIFIED);
        certificate(aditya, "AWS Certified Cloud Practitioner", "Amazon Web Services",
                LocalDate.of(2025, 8, 2), CertificateStatus.PENDING);
        certificate(sneha, "Meta Front-End Developer", "Coursera",
                LocalDate.of(2025, 6, 30), CertificateStatus.PENDING);

        // ---------- openings ----------
        Job javaJob = job(nova, "Junior Java Developer",
                "Join the platform team and build REST services with Spring Boot. You will work on the "
                        + "core scheduling and reporting modules alongside senior engineers.",
                "Pune", WorkMode.HYBRID, EmploymentType.FULL_TIME, 450000, 650000,
                new BigDecimal("7.00"), 2026, 30, 3, OpeningStatus.PUBLISHED,
                List.of("Java", "Spring Boot", "PostgreSQL", "Git"));

        Job frontendJob = job(nova, "Frontend Engineer (React)",
                "Build accessible, responsive interfaces in React and TypeScript for our education products.",
                "Remote", WorkMode.REMOTE, EmploymentType.FULL_TIME, 500000, 700000,
                new BigDecimal("7.50"), 2026, 45, 2, OpeningStatus.PUBLISHED,
                List.of("React", "TypeScript", "Tailwind CSS", "HTML5"));

        Job devopsJob = job(skyline, "Cloud & DevOps Associate",
                "Support CI/CD pipelines, containerised workloads and cloud infrastructure for analytics products.",
                "Mumbai", WorkMode.ONSITE, EmploymentType.FULL_TIME, 550000, 800000,
                new BigDecimal("6.50"), 2026, 25, 2, OpeningStatus.PUBLISHED,
                List.of("Docker", "Kubernetes", "AWS", "Linux", "GitHub Actions"));

        job(skyline, "Data Engineer Trainee",
                "Draft posting for the upcoming analytics hiring cycle.",
                "Mumbai", WorkMode.HYBRID, EmploymentType.FULL_TIME, 400000, 600000,
                new BigDecimal("7.00"), 2027, 60, 4, OpeningStatus.DRAFT,
                List.of("Python", "SQL", "PostgreSQL"));

        Internship backendInternship = internship(nova, "Backend Development Intern",
                "Six month internship working on Spring Boot services with mentoring and code reviews.",
                "Pune", WorkMode.HYBRID, 6, 20000, "Final year BCA / BSc students with Java fundamentals",
                new BigDecimal("6.50"), 2026, 20, 5, OpeningStatus.PUBLISHED,
                List.of("Java", "Spring Boot", "SQL"));

        Internship uiInternship = internship(skyline, "UI Engineering Intern",
                "Work with the design system team to ship dashboard components.",
                "Remote", WorkMode.REMOTE, 3, 15000, "Students comfortable with React and CSS",
                new BigDecimal("6.00"), 2027, 35, 3, OpeningStatus.PUBLISHED,
                List.of("React", "CSS3", "TypeScript"));

        // ---------- applications ----------
        applyWithHistory(riya, javaJob, null, ApplicationStatus.SHORTLISTED,
                "I have built a full stack placement portal using the same stack.");
        applyWithHistory(aditya, javaJob, null, ApplicationStatus.UNDER_REVIEW,
                "Strong interest in backend engineering and cloud deployment.");
        applyWithHistory(sneha, frontendJob, null, ApplicationStatus.APPLIED,
                "I maintain a component library built with React and Tailwind CSS.");
        applyWithHistory(rahul, devopsJob, null, ApplicationStatus.INTERVIEW,
                "Comfortable with Docker, Kubernetes and CI/CD pipelines.");
        applyWithHistory(aditya, null, backendInternship, ApplicationStatus.SELECTED,
                "Looking for a six month internship to deepen my Spring Boot experience.");
        applyWithHistory(pooja, null, uiInternship, ApplicationStatus.APPLIED,
                "Keen to learn frontend engineering practices in a product team.");

        // ---------- assessments ----------
        assessment("Java Fundamentals", "Core Java language and OOP concepts", "Java", 20, 50, List.of(
                question("Which keyword is used to inherit a class in Java?", 1,
                        List.of(option("extends", true), option("implements", false),
                                option("inherits", false), option("super", false))),
                question("What is the default value of an uninitialised int field?", 1,
                        List.of(option("0", true), option("null", false),
                                option("undefined", false), option("-1", false))),
                question("Which collection does not allow duplicate elements?", 1,
                        List.of(option("Set", true), option("List", false),
                                option("Queue", false), option("ArrayList", false))),
                question("Which method must be implemented by a class implementing Runnable?", 1,
                        List.of(option("run()", true), option("start()", false),
                                option("execute()", false), option("call()", false))),
                question("What does JVM stand for?", 1,
                        List.of(option("Java Virtual Machine", true), option("Java Verified Module", false),
                                option("Just Virtual Memory", false), option("Java Variable Mapper", false)))));

        assessment("Spring Boot Basics", "Configuration, dependency injection and REST", "Spring Boot", 20, 50,
                List.of(
                question("Which annotation marks a class as a REST controller?", 1,
                        List.of(option("@RestController", true), option("@Service", false),
                                option("@Component", false), option("@Repository", false))),
                question("Which file holds Spring Boot configuration by default?", 1,
                        List.of(option("application.yml or application.properties", true),
                                option("pom.xml", false), option("web.xml", false), option("settings.json", false))),
                question("What does @Transactional primarily manage?", 1,
                        List.of(option("Database transaction boundaries", true),
                                option("HTTP sessions", false), option("Thread pools", false),
                                option("Log levels", false))),
                question("Which starter adds Spring Data JPA support?", 1,
                        List.of(option("spring-boot-starter-data-jpa", true),
                                option("spring-boot-starter-web", false),
                                option("spring-boot-starter-batch", false),
                                option("spring-boot-starter-aop", false)))));

        assessment("Docker Essentials", "Images, containers and Compose", "Docker", 15, 50, List.of(
                question("Which command builds an image from a Dockerfile?", 1,
                        List.of(option("docker build", true), option("docker run", false),
                                option("docker pull", false), option("docker commit", false))),
                question("Which instruction sets the default command of an image?", 1,
                        List.of(option("CMD", true), option("RUN", false),
                                option("COPY", false), option("ENV", false))),
                question("What keeps PostgreSQL data across container restarts?", 1,
                        List.of(option("A named volume", true), option("A bind port", false),
                                option("A network alias", false), option("An ENTRYPOINT", false)))));

        notificationService.create(admin, NotificationType.ANNOUNCEMENT, "Welcome to CareerHub",
                "Seed data has been loaded. Review pending companies and certificates to get started.", "/admin/dashboard");
        notificationService.create(brightwave.getUser(), NotificationType.ANNOUNCEMENT,
                "Company verification pending",
                "Your company profile is awaiting approval from the college placement office.", "/company/profile");

        log.info("Demo data seeded: {} users", userRepository.count());
    }

    // ---------------- helpers ----------------

    private User user(String email, Role role) {
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(seedPassword));
        user.setRole(role);
        user.setActive(true);
        return userRepository.save(user);
    }

    private Student student(String email, String fullName, int graduationYear, BigDecimal cgpa,
                            String location, String bio) {
        Student student = new Student();
        student.setUser(user(email, Role.STUDENT));
        student.setFullName(fullName);
        student.setCollege("CareerHub College of Science");
        student.setDepartment("Computer Applications");
        student.setCourse("BCA");
        student.setGraduationYear(graduationYear);
        student.setCgpa(cgpa);
        student.setLocation(location);
        student.setBio(bio);
        student.setPhone("+91 90000 0000" + (int) (Math.random() * 9));
        student.setGithubUrl("https://github.com/" + fullName.split(" ")[0].toLowerCase());
        student.setLinkedinUrl("https://www.linkedin.com/in/" + fullName.toLowerCase().replace(' ', '-'));
        Student saved = studentRepository.save(student);
        studentService.recalculateCompletion(saved);
        return saved;
    }

    private Company company(String email, String name, CompanyStatus status, String description,
                            String industry, String website, String location) {
        Company company = new Company();
        company.setUser(user(email, Role.COMPANY));
        company.setName(name);
        company.setStatus(status);
        company.setDescription(description);
        company.setIndustry(industry);
        company.setWebsite(website);
        company.setLocation(location);
        company.setContactEmail(email);
        return companyRepository.save(company);
    }

    private void education(Student student, String degree, String institution, int start, int end, String grade) {
        StudentEducation education = new StudentEducation();
        education.setStudent(student);
        education.setDegree(degree);
        education.setInstitution(institution);
        education.setSpecialization("Computer Applications");
        education.setStartYear(start);
        education.setEndYear(end);
        education.setGrade(grade);
        educationRepository.save(education);
    }

    private void project(Student student, String title, String description, String techStack) {
        StudentProject project = new StudentProject();
        project.setStudent(student);
        project.setTitle(title);
        project.setDescription(description);
        project.setTechStack(techStack);
        project.setStartDate(LocalDate.now().minusMonths(8));
        project.setEndDate(LocalDate.now().minusMonths(2));
        projectRepository.save(project);
    }

    private void addSkills(Student student, List<String> skillNames) {
        Proficiency[] levels = Proficiency.values();
        int index = 0;
        for (String name : skillNames) {
            Skill skill = skillRepository.findByNameIgnoreCase(name).orElse(null);
            if (skill == null) {
                continue;
            }
            StudentSkill studentSkill = new StudentSkill();
            studentSkill.setStudent(student);
            studentSkill.setSkill(skill);
            studentSkill.setProficiency(levels[Math.min(index % levels.length, levels.length - 1)]);
            studentSkill.setYearsExperience(BigDecimal.valueOf(1 + index % 3));
            studentSkillRepository.save(studentSkill);
            index++;
        }
        studentService.recalculateCompletion(student);
    }

    private void certificate(Student student, String name, String organization, LocalDate issued,
                             CertificateStatus status) {
        Certificate certificate = new Certificate();
        certificate.setStudent(student);
        certificate.setName(name);
        certificate.setIssuingOrganization(organization);
        certificate.setIssueDate(issued);
        certificate.setCredentialId("CH-" + Math.abs(name.hashCode() % 1000000));
        certificate.setCredentialUrl("https://credentials.example/verify");
        certificate.setStatus(status);
        certificateRepository.save(certificate);
        studentService.recalculateCompletion(student);
    }

    private Job job(Company company, String title, String description, String location, WorkMode workMode,
                    EmploymentType employmentType, int salaryMin, int salaryMax, BigDecimal minCgpa,
                    int graduationYear, int deadlineInDays, int vacancies, OpeningStatus status,
                    List<String> skillNames) {
        Job job = new Job();
        job.setCompany(company);
        job.setTitle(title);
        job.setDescription(description);
        job.setLocation(location);
        job.setWorkMode(workMode);
        job.setEmploymentType(employmentType);
        job.setSalaryMin(BigDecimal.valueOf(salaryMin));
        job.setSalaryMax(BigDecimal.valueOf(salaryMax));
        job.setMinCgpa(minCgpa);
        job.setGraduationYear(graduationYear);
        job.setDeadline(LocalDate.now().plusDays(deadlineInDays));
        job.setVacancies(vacancies);
        job.setStatus(status);
        job.setSkills(skills(skillNames));
        return jobRepository.save(job);
    }

    private Internship internship(Company company, String title, String description, String location,
                                  WorkMode workMode, int durationMonths, int stipend, String eligibility,
                                  BigDecimal minCgpa, int graduationYear, int deadlineInDays, int vacancies,
                                  OpeningStatus status, List<String> skillNames) {
        Internship internship = new Internship();
        internship.setCompany(company);
        internship.setTitle(title);
        internship.setDescription(description);
        internship.setLocation(location);
        internship.setWorkMode(workMode);
        internship.setDurationMonths(durationMonths);
        internship.setStipend(BigDecimal.valueOf(stipend));
        internship.setEligibility(eligibility);
        internship.setMinCgpa(minCgpa);
        internship.setGraduationYear(graduationYear);
        internship.setDeadline(LocalDate.now().plusDays(deadlineInDays));
        internship.setVacancies(vacancies);
        internship.setStatus(status);
        internship.setSkills(skills(skillNames));
        return internshipRepository.save(internship);
    }

    private Set<Skill> skills(List<String> names) {
        Set<Skill> skills = new LinkedHashSet<>();
        for (String name : names) {
            skillRepository.findByNameIgnoreCase(name).ifPresent(skills::add);
        }
        return skills;
    }

    private void applyWithHistory(Student student, Job job, Internship internship,
                                  ApplicationStatus finalStatus, String coverLetter) {
        Application application = new Application();
        application.setStudent(student);
        application.setJob(job);
        application.setInternship(internship);
        application.setOpeningType(job != null ? OpeningType.JOB : OpeningType.INTERNSHIP);
        application.setCoverLetter(coverLetter);
        application.setStatus(ApplicationStatus.APPLIED);
        Application saved = applicationRepository.save(application);
        history(saved, null, ApplicationStatus.APPLIED, "Application submitted");

        if (finalStatus != ApplicationStatus.APPLIED) {
            ApplicationStatus previous = ApplicationStatus.APPLIED;
            for (ApplicationStatus step : List.of(ApplicationStatus.UNDER_REVIEW, ApplicationStatus.SHORTLISTED,
                    ApplicationStatus.INTERVIEW, ApplicationStatus.SELECTED)) {
                history(saved, previous, step, "Status updated by recruiter");
                previous = step;
                if (step == finalStatus) {
                    break;
                }
            }
            saved.setStatus(finalStatus);
            applicationRepository.save(saved);
            notificationService.create(student.getUser(), NotificationType.APPLICATION_STATUS_CHANGED,
                    "Application update",
                    "Your application is now " + finalStatus.name().replace('_', ' ').toLowerCase() + ".",
                    "/student/applications");
        }
    }

    private void history(Application application, ApplicationStatus from, ApplicationStatus to, String note) {
        ApplicationStatusHistory entry = new ApplicationStatusHistory();
        entry.setApplication(application);
        entry.setFromStatus(from);
        entry.setToStatus(to);
        entry.setNote(note);
        entry.setChangedBy("system@careerhub.edu");
        historyRepository.save(entry);
    }

    private void assessment(String title, String description, String skillName, int duration,
                            int passingPercentage, List<AssessmentQuestion> questions) {
        Skill skill = skillRepository.findByNameIgnoreCase(skillName).orElse(null);
        if (skill == null) {
            return;
        }
        Assessment assessment = new Assessment();
        assessment.setSkill(skill);
        assessment.setTitle(title);
        assessment.setDescription(description);
        assessment.setDurationMinutes(duration);
        assessment.setPassingPercentage(passingPercentage);
        assessment.setActive(true);
        int position = 0;
        for (AssessmentQuestion question : questions) {
            question.setAssessment(assessment);
            question.setPosition(position++);
            assessment.getQuestions().add(question);
        }
        assessmentRepository.save(assessment);
    }

    private AssessmentQuestion question(String text, int marks, List<AssessmentOption> options) {
        AssessmentQuestion question = new AssessmentQuestion();
        question.setQuestionText(text);
        question.setMarks(marks);
        int position = 0;
        for (AssessmentOption option : options) {
            option.setQuestion(question);
            option.setPosition(position++);
            question.getOptions().add(option);
        }
        return question;
    }

    private AssessmentOption option(String text, boolean correct) {
        AssessmentOption option = new AssessmentOption();
        option.setOptionText(text);
        option.setCorrect(correct);
        return option;
    }
}
