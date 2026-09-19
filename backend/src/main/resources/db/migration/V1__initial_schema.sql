-- ============================================================
-- CareerHub - initial schema
-- ============================================================

CREATE TABLE users (
    id              UUID PRIMARY KEY,
    email           VARCHAR(160) NOT NULL,
    password_hash   VARCHAR(120) NOT NULL,
    role            VARCHAR(20)  NOT NULL,
    active          BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_users_email UNIQUE (email)
);
CREATE INDEX idx_users_role ON users (role);

-- ---------------- skills ----------------
CREATE TABLE skill_categories (
    id          UUID PRIMARY KEY,
    name        VARCHAR(80) NOT NULL,
    description VARCHAR(255),
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_skill_categories_name UNIQUE (name)
);

CREATE TABLE skills (
    id          UUID PRIMARY KEY,
    category_id UUID NOT NULL REFERENCES skill_categories (id) ON DELETE CASCADE,
    name        VARCHAR(80) NOT NULL,
    description VARCHAR(255),
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_skills_name UNIQUE (name)
);
CREATE INDEX idx_skills_category ON skills (category_id);

-- ---------------- students ----------------
CREATE TABLE students (
    id                 UUID PRIMARY KEY,
    user_id            UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    full_name          VARCHAR(120) NOT NULL,
    phone              VARCHAR(20),
    college            VARCHAR(150),
    department         VARCHAR(100),
    course             VARCHAR(100),
    graduation_year    INTEGER,
    cgpa               NUMERIC(4,2),
    location           VARCHAR(120),
    photo_url          VARCHAR(300),
    bio                VARCHAR(1000),
    github_url         VARCHAR(300),
    linkedin_url       VARCHAR(300),
    portfolio_url      VARCHAR(300),
    profile_completion INTEGER NOT NULL DEFAULT 0,
    created_at         TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_students_user UNIQUE (user_id)
);
CREATE INDEX idx_students_graduation_year ON students (graduation_year);

CREATE TABLE student_education (
    id            UUID PRIMARY KEY,
    student_id    UUID NOT NULL REFERENCES students (id) ON DELETE CASCADE,
    degree        VARCHAR(120) NOT NULL,
    institution   VARCHAR(150) NOT NULL,
    specialization VARCHAR(120),
    start_year    INTEGER,
    end_year      INTEGER,
    grade         VARCHAR(30),
    created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_education_student ON student_education (student_id);

CREATE TABLE student_projects (
    id          UUID PRIMARY KEY,
    student_id  UUID NOT NULL REFERENCES students (id) ON DELETE CASCADE,
    title       VARCHAR(150) NOT NULL,
    description VARCHAR(2000),
    tech_stack  VARCHAR(300),
    project_url VARCHAR(300),
    repo_url    VARCHAR(300),
    start_date  DATE,
    end_date    DATE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_projects_student ON student_projects (student_id);

CREATE TABLE student_experience (
    id            UUID PRIMARY KEY,
    student_id    UUID NOT NULL REFERENCES students (id) ON DELETE CASCADE,
    company_name  VARCHAR(150) NOT NULL,
    role_title    VARCHAR(120) NOT NULL,
    description   VARCHAR(2000),
    location      VARCHAR(120),
    start_date    DATE,
    end_date      DATE,
    currently_working BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_experience_student ON student_experience (student_id);

CREATE TABLE student_skills (
    id               UUID PRIMARY KEY,
    student_id       UUID NOT NULL REFERENCES students (id) ON DELETE CASCADE,
    skill_id         UUID NOT NULL REFERENCES skills (id) ON DELETE CASCADE,
    proficiency      VARCHAR(20) NOT NULL,
    years_experience NUMERIC(3,1),
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_student_skill UNIQUE (student_id, skill_id)
);
CREATE INDEX idx_student_skills_skill ON student_skills (skill_id);

-- ---------------- companies ----------------
CREATE TABLE companies (
    id            UUID PRIMARY KEY,
    user_id       UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name          VARCHAR(150) NOT NULL,
    logo_url      VARCHAR(300),
    description   VARCHAR(2000),
    industry      VARCHAR(100),
    website       VARCHAR(300),
    location      VARCHAR(120),
    contact_email VARCHAR(160),
    status        VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    review_note   VARCHAR(500),
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_companies_user UNIQUE (user_id)
);
CREATE INDEX idx_companies_status ON companies (status);

-- ---------------- jobs ----------------
CREATE TABLE jobs (
    id              UUID PRIMARY KEY,
    company_id      UUID NOT NULL REFERENCES companies (id) ON DELETE CASCADE,
    title           VARCHAR(150) NOT NULL,
    description     VARCHAR(5000) NOT NULL,
    location        VARCHAR(120),
    work_mode       VARCHAR(20) NOT NULL,
    employment_type VARCHAR(20) NOT NULL,
    salary_min      NUMERIC(12,2),
    salary_max      NUMERIC(12,2),
    min_cgpa        NUMERIC(4,2),
    graduation_year INTEGER,
    deadline        DATE,
    vacancies       INTEGER NOT NULL DEFAULT 1,
    status          VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_jobs_company ON jobs (company_id);
CREATE INDEX idx_jobs_status ON jobs (status);

CREATE TABLE job_skills (
    job_id   UUID NOT NULL REFERENCES jobs (id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills (id) ON DELETE CASCADE,
    PRIMARY KEY (job_id, skill_id)
);

-- ---------------- internships ----------------
CREATE TABLE internships (
    id              UUID PRIMARY KEY,
    company_id      UUID NOT NULL REFERENCES companies (id) ON DELETE CASCADE,
    title           VARCHAR(150) NOT NULL,
    description     VARCHAR(5000) NOT NULL,
    location        VARCHAR(120),
    work_mode       VARCHAR(20) NOT NULL,
    duration_months INTEGER NOT NULL DEFAULT 3,
    stipend         NUMERIC(12,2),
    eligibility     VARCHAR(500),
    min_cgpa        NUMERIC(4,2),
    graduation_year INTEGER,
    deadline        DATE,
    vacancies       INTEGER NOT NULL DEFAULT 1,
    status          VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_internships_company ON internships (company_id);
CREATE INDEX idx_internships_status ON internships (status);

CREATE TABLE internship_skills (
    internship_id UUID NOT NULL REFERENCES internships (id) ON DELETE CASCADE,
    skill_id      UUID NOT NULL REFERENCES skills (id) ON DELETE CASCADE,
    PRIMARY KEY (internship_id, skill_id)
);

-- ---------------- applications ----------------
CREATE TABLE applications (
    id            UUID PRIMARY KEY,
    student_id    UUID NOT NULL REFERENCES students (id) ON DELETE CASCADE,
    job_id        UUID REFERENCES jobs (id) ON DELETE CASCADE,
    internship_id UUID REFERENCES internships (id) ON DELETE CASCADE,
    opening_type  VARCHAR(20) NOT NULL,
    status        VARCHAR(20) NOT NULL DEFAULT 'APPLIED',
    cover_letter  VARCHAR(3000),
    applied_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_application_job UNIQUE (student_id, job_id),
    CONSTRAINT uk_application_internship UNIQUE (student_id, internship_id),
    CONSTRAINT ck_application_target CHECK (
        (job_id IS NOT NULL AND internship_id IS NULL) OR
        (job_id IS NULL AND internship_id IS NOT NULL)
    )
);
CREATE INDEX idx_applications_student ON applications (student_id);
CREATE INDEX idx_applications_status ON applications (status);

CREATE TABLE application_status_history (
    id             UUID PRIMARY KEY,
    application_id UUID NOT NULL REFERENCES applications (id) ON DELETE CASCADE,
    from_status    VARCHAR(20),
    to_status      VARCHAR(20) NOT NULL,
    note           VARCHAR(500),
    changed_by     VARCHAR(160),
    changed_at     TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_status_history_application ON application_status_history (application_id);

-- ---------------- assessments ----------------
CREATE TABLE assessments (
    id                 UUID PRIMARY KEY,
    skill_id           UUID NOT NULL REFERENCES skills (id) ON DELETE CASCADE,
    title              VARCHAR(150) NOT NULL,
    description        VARCHAR(1000),
    duration_minutes   INTEGER NOT NULL DEFAULT 20,
    passing_percentage INTEGER NOT NULL DEFAULT 50,
    active             BOOLEAN NOT NULL DEFAULT TRUE,
    created_at         TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_assessments_skill ON assessments (skill_id);

CREATE TABLE assessment_questions (
    id            UUID PRIMARY KEY,
    assessment_id UUID NOT NULL REFERENCES assessments (id) ON DELETE CASCADE,
    question_text VARCHAR(1000) NOT NULL,
    marks         INTEGER NOT NULL DEFAULT 1,
    position      INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_questions_assessment ON assessment_questions (assessment_id);

CREATE TABLE assessment_options (
    id          UUID PRIMARY KEY,
    question_id UUID NOT NULL REFERENCES assessment_questions (id) ON DELETE CASCADE,
    option_text VARCHAR(500) NOT NULL,
    correct     BOOLEAN NOT NULL DEFAULT FALSE,
    position    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_options_question ON assessment_options (question_id);

CREATE TABLE assessment_attempts (
    id              UUID PRIMARY KEY,
    assessment_id   UUID NOT NULL REFERENCES assessments (id) ON DELETE CASCADE,
    student_id      UUID NOT NULL REFERENCES students (id) ON DELETE CASCADE,
    score           INTEGER NOT NULL,
    total_marks     INTEGER NOT NULL,
    percentage      NUMERIC(5,2) NOT NULL,
    correct_answers INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    passed          BOOLEAN NOT NULL,
    attempted_at    TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_attempts_student ON assessment_attempts (student_id);

-- ---------------- certificates ----------------
CREATE TABLE certificates (
    id                   UUID PRIMARY KEY,
    student_id           UUID NOT NULL REFERENCES students (id) ON DELETE CASCADE,
    name                 VARCHAR(180) NOT NULL,
    issuing_organization VARCHAR(180) NOT NULL,
    issue_date           DATE,
    credential_id        VARCHAR(120),
    credential_url       VARCHAR(300),
    status               VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    review_note          VARCHAR(500),
    created_at           TIMESTAMP NOT NULL DEFAULT NOW(),
    reviewed_at          TIMESTAMP
);
CREATE INDEX idx_certificates_student ON certificates (student_id);
CREATE INDEX idx_certificates_status ON certificates (status);

-- ---------------- resume ----------------
CREATE TABLE resumes (
    id          UUID PRIMARY KEY,
    student_id  UUID NOT NULL REFERENCES students (id) ON DELETE CASCADE,
    summary     VARCHAR(2000),
    career_objective VARCHAR(1000),
    template    VARCHAR(40) NOT NULL DEFAULT 'CLASSIC',
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_resumes_student UNIQUE (student_id)
);

-- ---------------- notifications ----------------
CREATE TABLE notifications (
    id         UUID PRIMARY KEY,
    user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    title      VARCHAR(180) NOT NULL,
    message    VARCHAR(1000) NOT NULL,
    type       VARCHAR(40) NOT NULL,
    link       VARCHAR(300),
    read_flag  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notifications_user ON notifications (user_id, read_flag);
