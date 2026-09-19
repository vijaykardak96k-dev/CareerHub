# Requirements

## 1. Purpose

CareerHub is a web platform that manages the campus placement process end to end.
It replaces the spreadsheets, email threads and notice boards that colleges usually
rely on with a single system where students maintain a verified profile, recruiters
publish openings once they have been vetted, and the placement office keeps
oversight of everything.

## 2. Scope

### In scope
- Three roles: **Student**, **Company** (recruiter) and **College administrator**.
- Authentication with JWT and BCrypt, role-based access control, account
  activation and deactivation, password change.
- Student profile, education, projects, experience, skills, certificates and resume.
- Company registration with an approval gate before publishing.
- Job and internship lifecycle with skills, eligibility, deadline and vacancies.
- Applications with a full status history and in-app notifications.
- MCQ skill assessments scored on the server.
- Rule-based skill gap analysis.
- Certificate verification workflow.
- Placement analytics for the college.

### Out of scope
- Microservices; the system is a deliberate modular monolith.
- A "super admin" tier above the college administrator.
- Email, SMS or push notifications; notifications are in-app only.
- WebSockets or real-time streaming.
- Machine-learning recommendations — matching is rule based.
- Payments, Prometheus, Grafana and ArgoCD.

## 3. Actors

| Actor | Description |
| --- | --- |
| Student | A college student seeking a job or an internship. |
| Company | A recruiter publishing openings and reviewing applicants. |
| College administrator | Placement office staff who verify companies and certificates, curate skills and monitor outcomes. |
| Visitor | An unauthenticated browser; can see published openings only. |

## 4. Functional requirements

### 4.1 Authentication and accounts
| ID | Requirement |
| --- | --- |
| FR-1.1 | A visitor can register as a Student or a Company. Administrator accounts are never self-registered. |
| FR-1.2 | Passwords are stored as BCrypt hashes and never returned in any response. |
| FR-1.3 | Login returns a signed JWT containing the user id and role. |
| FR-1.4 | The JWT signing secret is read from the environment, never from source. |
| FR-1.5 | Every protected endpoint checks the caller's role server side. |
| FR-1.6 | An administrator can deactivate or reactivate any account; a deactivated user cannot log in. |
| FR-1.7 | A signed-in user can change their own password by supplying the current one. |
| FR-1.8 | Logout is client side; the API is stateless. |

### 4.2 Student module
| ID | Requirement |
| --- | --- |
| FR-2.1 | A student maintains a profile with contact, college, course, graduation year, CGPA, bio and links. |
| FR-2.2 | Profile completion is computed by the backend, not the browser. |
| FR-2.3 | Education, project and experience entries support full CRUD. |
| FR-2.4 | A student selects skills from the college catalogue with a proficiency level. |
| FR-2.5 | A student can add certificates, which enter the verification queue as `PENDING`. |
| FR-2.6 | A student can edit a resume summary and download a generated PDF. |
| FR-2.7 | A student can browse, save and apply to published jobs and internships. |
| FR-2.8 | A student can view every application with its complete status history and can withdraw a non-final application. |
| FR-2.9 | The student dashboard is computed from live database records. |

### 4.3 Company module
| ID | Requirement |
| --- | --- |
| FR-3.1 | A newly registered company is `PENDING` and cannot publish anything. |
| FR-3.2 | An administrator can move a company to `APPROVED`, `REJECTED` or `SUSPENDED`, optionally with a note. |
| FR-3.3 | Only an `APPROVED` company may publish a job or an internship. |
| FR-3.4 | A company manages its own openings only; cross-company access is rejected with 403. |
| FR-3.5 | A company sees its applicants and the candidate profile behind each application. |
| FR-3.6 | A company can move an application to `UNDER_REVIEW`, `SHORTLISTED`, `INTERVIEW`, `SELECTED` or `REJECTED`. |

### 4.4 Jobs and internships
| ID | Requirement |
| --- | --- |
| FR-4.1 | An opening is `DRAFT`, `PUBLISHED` or `CLOSED`. Only `PUBLISHED` openings are visible publicly. |
| FR-4.2 | An opening carries required skills, minimum CGPA, graduation year, deadline and vacancy count. |
| FR-4.3 | Applications are refused after the deadline or once the opening is closed. |
| FR-4.4 | An opening that already has applications cannot be deleted. |

### 4.5 Applications
| ID | Requirement |
| --- | --- |
| FR-5.1 | Statuses are `APPLIED`, `UNDER_REVIEW`, `SHORTLISTED`, `INTERVIEW`, `SELECTED`, `REJECTED`, `WITHDRAWN`. |
| FR-5.2 | A student can apply to a given opening at most once (enforced by a unique constraint). |
| FR-5.3 | Every status change writes a status-history row recording who changed it, when and why. |
| FR-5.4 | Every status change creates a notification for the student. |
| FR-5.5 | Only the owning student may withdraw an application. |

### 4.6 Skills and assessments
| ID | Requirement |
| --- | --- |
| FR-6.1 | Skills belong to categories; both are managed by the administrator. |
| FR-6.2 | Proficiency levels are `BEGINNER`, `INTERMEDIATE`, `ADVANCED`, `EXPERT`. |
| FR-6.3 | An assessment belongs to one skill and holds MCQ questions with marks. |
| FR-6.4 | Correct answers are never sent to a student; scoring happens on the server. |
| FR-6.5 | An attempt records score, percentage, correct count and pass/fail. |
| FR-6.6 | Skill gap analysis compares a student's skills with an opening's required skills and returns matched, missing and a match percentage. |

### 4.7 Certificates
| ID | Requirement |
| --- | --- |
| FR-7.1 | A certificate is `PENDING`, `VERIFIED` or `REJECTED`. |
| FR-7.2 | Only an administrator can change that status, optionally with a note. |
| FR-7.3 | The student is notified of the outcome. |

### 4.8 Notifications and analytics
| ID | Requirement |
| --- | --- |
| FR-8.1 | Notifications are in-app, per user, with read and unread state. |
| FR-8.2 | An administrator can broadcast an announcement to students, companies or everyone. |
| FR-8.3 | Analytics report applications by stage, jobs posted per month, the most common student skills and the selection rate. |

## 5. Non-functional requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | **Security** — BCrypt hashing, stateless JWT, server-side RBAC, Bean Validation on every request body, parameterised JPA queries, no secrets in source control. |
| NFR-2 | **Portability** — the frontend reads its backend URL at runtime from `window.__APP_CONFIG__`, so one image runs on localhost, EC2 and Kubernetes unchanged. |
| NFR-3 | **Maintainability** — modular monolith with feature packages, a typed frontend API layer and Flyway-versioned schema changes. |
| NFR-4 | **Usability** — responsive layout, explicit loading, empty and error states, and toast feedback on every mutation. |
| NFR-5 | **Reliability** — container health checks, Kubernetes startup, readiness and liveness probes, and rolling updates with `maxUnavailable: 0`. |
| NFR-6 | **Performance** — server-side pagination on every list endpoint and database indexes on the foreign keys and status columns used for filtering. |
| NFR-7 | **Testability** — integration tests run against in-memory H2 with no external dependencies, so CI needs no database service. |
| NFR-8 | **Data integrity** — UUID primary keys, foreign keys, unique constraints on duplicate applications and a check constraint ensuring an application references exactly one of a job or an internship. |

## 6. Assumptions and constraints

- One college per deployment; there is no tenant dimension in the schema.
- The first administrator arrives through the demo seeder or a manual insert.
- Resume PDFs are generated on demand rather than stored.
- Uploaded files go to a mounted volume, not to object storage.
- The system is designed for a cohort of a few thousand students, which a single
  PostgreSQL instance handles comfortably.
