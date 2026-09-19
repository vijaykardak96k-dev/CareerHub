# Testing

## 1. Strategy

The suite favours **integration tests over unit tests**. The rules worth protecting
in CareerHub — a pending company cannot publish a job, a student cannot apply twice,
assessment answers never reach the browser — live in the interaction between the
security filter, the controller, the service and the database. A mocked unit test
would assert that the mock was called; an integration test asserts that the rule
actually holds.

Every test boots the full Spring context and drives the API through **MockMvc**
against an in-memory **H2** database in PostgreSQL compatibility mode. No external
service is needed, so CI runs the suite without a database container.

```bash
cd backend
mvn test          # run the suite
mvn clean verify  # what CI runs
```

Configuration lives in `src/test/resources/application-test.yml`: H2 in PostgreSQL
mode, `ddl-auto: create-drop`, Flyway disabled, demo seeding disabled and a fixed
test JWT secret.

## 2. Shared harness

`support/IntegrationTestBase` gives every suite:

| Helper | Purpose |
| --- | --- |
| `registerStudent(email)` | Register a student and return the token |
| `registerCompany(email, name)` | Register a company (starts `PENDING`) and return the token |
| `createAdminAndLogin()` | Insert a `COLLEGE_ADMIN` and return the token |
| `login(email, password)` | Log in and return the token |
| `json(object)` | Serialise a request body |
| `body(result)` | Parse a response body |
| `PASSWORD` | The shared test password, `Password@123` |

## 3. Suites

### `AuthenticationTest`
- A student and a company can register and receive a token.
- A duplicate email is rejected.
- Self-registering as `COLLEGE_ADMIN` is refused.
- The wrong password fails, with no hint about which field was wrong.
- A deactivated account cannot log in.
- `GET /auth/me` returns the account for a valid token.
- Changing a password requires the current one; the new one then works.
- **No response body anywhere contains a password or a hash.**

### `AuthorizationTest`
- An anonymous call to a protected endpoint returns 401.
- A student calling a company endpoint returns 403, and the reverse.
- A student calling an `/admin` endpoint returns 403.
- Public job and internship endpoints work without a token.
- A malformed or expired token returns 401 rather than 500.

### `StudentProfileTest`
- Update and read back the profile.
- Education, project and experience entries create, update and delete.
- Profile completion rises as the profile fills in.
- A student cannot modify another student's records.
- Validation failures return 400 with `fieldErrors`.
- The dashboard counters match the records that were created.

### `CompanyApprovalAndJobTest`
- A new company is `PENDING`.
- A `PENDING` company publishing a job is refused with 403.
- After the administrator approves it, the same request succeeds.
- A suspended company can no longer publish.
- One company cannot edit or delete another company's job.
- Closing a job stops new applications.
- A job with applications cannot be deleted.

### `JobApplicationTest`
- A student applies to a published job and gets 201.
- Applying twice returns 409.
- Applying to a closed job returns 400.
- The student sees the application under `/applications/mine`, the company under
  `/applications/company`.
- A recruiter status change writes a history row and creates a notification for the
  student.
- A student can withdraw; a company from a different account gets 403.

### `AssessmentScoringTest`
- `GET /assessments/{id}/start` returns options **without** the correct flag — the
  serialised JSON is asserted not to contain it.
- All-correct answers score full marks and pass.
- All-wrong answers score zero and fail.
- Partial answers score proportionally.
- Submitting an unknown option id does not crash or award marks.
- A student cannot create an assessment (403).

## 4. Coverage of the requirements

| Area | Covered by |
| --- | --- |
| Registration, login, JWT, BCrypt | `AuthenticationTest` |
| Role-based access control | `AuthorizationTest` |
| Account activation and deactivation | `AuthenticationTest` |
| Student profile CRUD and completion | `StudentProfileTest` |
| Company approval gate | `CompanyApprovalAndJobTest` |
| Opening lifecycle | `CompanyApprovalAndJobTest` |
| Application lifecycle, history, notifications | `JobApplicationTest` |
| Duplicate-application constraint | `JobApplicationTest` |
| Server-side assessment scoring | `AssessmentScoringTest` |
| Validation error shape | `StudentProfileTest` |

## 5. Manual test plan

Run against the demo data (`SEED_DEMO_DATA=true`, password `Password@123`).

| # | Scenario | Steps | Expected |
| --- | --- | --- | --- |
| M1 | Student applies | Sign in as `riya.sharma@student.careerhub.edu` → Jobs → Apply | Success toast; the application appears under *Applications* as `APPLIED` |
| M2 | Duplicate application | Apply to the same job again | Error toast; no second row |
| M3 | Skill gap | Jobs → *Skill match* on any job | Matched and missing skills with a percentage |
| M4 | Assessment scoring | Assessments → start → answer → submit | Score dialog; result stored; page source never contains the correct answers |
| M5 | Resume PDF | Resume → edit summary → save → *Download PDF* | A PDF downloads containing the profile, skills and verified certificates |
| M6 | Approval gate | Sign in as `talent@brightwave.example` → Jobs → Post a job | Refused; the dashboard shows the pending banner |
| M7 | Approve a company | Sign in as `admin@careerhub.edu` → Companies → Approve BrightWave | Status becomes `APPROVED`; the recruiter is notified |
| M8 | Publish after approval | Sign back in as BrightWave → post a job | Publishes and appears on the public board |
| M9 | Pipeline | As `hr@novasoft.example` → Applicants → change status to `SHORTLISTED` | Student sees the new status, a history entry and a notification |
| M10 | Withdraw | As the student, withdraw a non-final application | Status becomes `WITHDRAWN`; the withdraw button disappears |
| M11 | Certificate review | Admin → Certificates → Verify | Status becomes `VERIFIED`; it appears on the student's resume |
| M12 | Deactivate | Admin → Students → Deactivate, then try to sign in as that student | Login refused |
| M13 | Analytics | Admin → Analytics | Charts reflect the applications created above |
| M14 | Runtime config | Change `API_BASE_URL` and restart the frontend container | The app calls the new backend with no rebuild |
| M15 | SPA routing | Open `/student/applications` directly and refresh | The page loads rather than returning 404 |
| M16 | Responsive layout | Resize to a phone width | The sidebar collapses into the menu button; tables scroll horizontally |

## 6. What is not automated

- Frontend component and end-to-end tests. The API carries every business rule, so
  the backend suite was the higher-value investment for this project. Vitest plus
  React Testing Library, and Playwright for end-to-end, are the natural next step.
- Load and performance testing.
- Container and Kubernetes manifest smoke tests.
