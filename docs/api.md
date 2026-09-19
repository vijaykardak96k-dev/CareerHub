# API reference

Base path: **`/api/v1`**

All requests and responses are JSON. Authenticated endpoints expect:

```
Authorization: Bearer <token>
```

## Conventions

**Paged responses**

```json
{ "content": [], "page": 0, "size": 10, "totalElements": 0, "totalPages": 0 }
```

Paged endpoints accept `page` (0-based) and `size`.

**Error responses**

```json
{
  "timestamp": "2026-05-20T09:15:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/v1/auth/register",
  "fieldErrors": { "email": "must be a well-formed email address" }
}
```

| Code | Meaning |
| --- | --- |
| 400 | Validation failure or an illegal state change |
| 401 | Missing, malformed or expired token |
| 403 | Authenticated but the role or ownership check failed |
| 404 | No such record, or not visible to this caller |
| 409 | Conflict, such as a duplicate email or a repeat application |

---

## Authentication — `/auth`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/auth/register` | Public | Register a `STUDENT` or `COMPANY`. `COLLEGE_ADMIN` is refused. Returns a token. |
| POST | `/auth/login` | Public | Exchange credentials for a JWT. |
| POST | `/auth/logout` | Any | Client-side; the API is stateless. |
| GET | `/auth/me` | Any | The current account. Used to restore a session on page load. |
| POST | `/auth/change-password` | Any | Requires the current password. |

**`POST /auth/register`**

```json
{ "email": "riya@college.edu", "password": "Password@123", "role": "STUDENT", "fullName": "Riya Sharma" }
```

A `COMPANY` registration sends `companyName` instead of `fullName`.

**Response**

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "expiresIn": 86400000,
  "user": {
    "id": "…", "email": "riya@college.edu", "role": "STUDENT",
    "displayName": "Riya Sharma", "active": true,
    "companyStatus": null, "profileCompletion": 20
  }
}
```

---

## Students — `/students`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/students/me` | STUDENT | Own profile |
| PUT | `/students/me` | STUDENT | Update own profile |
| GET | `/students/me/dashboard` | STUDENT | Dashboard counters |
| GET | `/students/{id}` | COMPANY, ADMIN | A candidate's profile |
| GET/POST | `/students/me/education` | STUDENT | List / create |
| PUT/DELETE | `/students/me/education/{id}` | STUDENT | Update / delete |
| GET/POST | `/students/me/projects` | STUDENT | List / create |
| PUT/DELETE | `/students/me/projects/{id}` | STUDENT | Update / delete |
| GET/POST | `/students/me/experience` | STUDENT | List / create |
| PUT/DELETE | `/students/me/experience/{id}` | STUDENT | Update / delete |
| GET | `/students/me/saved-jobs` | STUDENT | Bookmarked jobs |
| POST/DELETE | `/students/me/saved-jobs/{jobId}` | STUDENT | Save / unsave |
| GET | `/students/me/recommended-jobs?limit=` | STUDENT | Ranked by skill overlap |

---

## Companies — `/companies`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/companies/me` | COMPANY | Own profile with verification status |
| PUT | `/companies/me` | COMPANY | Update own profile |
| GET | `/companies/me/dashboard` | COMPANY | Hiring counters |
| GET | `/companies/{id}` | Any | Public company profile |

---

## Jobs — `/jobs`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/jobs/public` | Public | Published jobs. Filters: `search`, `location`, `workMode`, `employmentType` |
| GET | `/jobs/public/{id}` | Public | One published job |
| GET | `/jobs` | Authenticated | Same board, authenticated |
| GET | `/jobs/{id}` | Authenticated | One job |
| GET | `/jobs/mine` | COMPANY | Own jobs, including drafts and closed |
| POST | `/jobs` | COMPANY (approved) | Create as `DRAFT` or `PUBLISHED` |
| PUT | `/jobs/{id}` | COMPANY (owner) | Update |
| PATCH | `/jobs/{id}/close` | COMPANY (owner) | Close to new applications |
| DELETE | `/jobs/{id}` | COMPANY (owner) | Only when no applications exist |

**`POST /jobs`**

```json
{
  "title": "Junior Java Developer",
  "description": "Work on the core services team.",
  "location": "Pune",
  "workMode": "HYBRID",
  "employmentType": "FULL_TIME",
  "salaryMin": 450000, "salaryMax": 650000,
  "minCgpa": 6.5, "graduationYear": 2026,
  "deadline": "2026-07-31", "vacancies": 3,
  "status": "PUBLISHED",
  "skillIds": ["…", "…"]
}
```

A company whose status is not `APPROVED` receives **403** here.

---

## Internships — `/internships`

The same shape as `/jobs` (`/public`, `/public/{id}`, `/`, `/{id}`, `/mine`, `POST`,
`PUT`, `PATCH /{id}/close`, `DELETE`). The body replaces `employmentType` and the
salary band with `durationMonths`, `stipend` and `eligibility`.

---

## Applications — `/applications`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/applications` | STUDENT | Apply. 409 on a duplicate, 400 once closed or past the deadline |
| GET | `/applications/mine` | STUDENT | Own applications. Filter: `status` |
| GET | `/applications/company` | COMPANY | Applicants. Filters: `status`, `jobId`, `internshipId` |
| GET | `/applications/{id}` | Owner student, owning company, ADMIN | One application |
| GET | `/applications/{id}/history` | Same | Full audit trail |
| PATCH | `/applications/{id}/status` | COMPANY (owner) | `{ "status": "SHORTLISTED", "note": "…" }` |
| PATCH | `/applications/{id}/withdraw` | STUDENT (owner) | Withdraw |

Every status change writes a history row and notifies the student.

---

## Skills — `/skills`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/skills/catalog` | Authenticated | Categories with nested skills |
| GET | `/skills` | Authenticated | Flat skill list |
| GET | `/skills/mine` | STUDENT | Own skills |
| POST | `/skills/mine` | STUDENT | `{ "skillId": "…", "proficiency": "ADVANCED", "yearsExperience": 2 }` |
| PUT/DELETE | `/skills/mine/{id}` | STUDENT | Update / remove |
| GET | `/skills/gap/job/{jobId}` | STUDENT | Gap analysis against a job |
| GET | `/skills/gap/internship/{internshipId}` | STUDENT | Gap analysis against an internship |

**Gap response**

```json
{
  "target": "Junior Java Developer",
  "matchedSkills": ["Java", "SQL"],
  "missingSkills": ["Spring Boot", "Docker"],
  "matchPercentage": 50
}
```

---

## Assessments — `/assessments`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/assessments` | STUDENT | Active assessments |
| GET | `/assessments/{id}/start` | STUDENT | Questions and options **without** the correct flag |
| POST | `/assessments/{id}/submit` | STUDENT | `{ "answers": [{ "questionId": "…", "optionId": "…" }] }` |
| GET | `/assessments/results` | STUDENT | Past attempts |

Scoring happens entirely on the server; the browser never learns which option was
correct, so the score cannot be forged by editing the request.

---

## Certificates — `/certificates`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/certificates/mine` | STUDENT | Own certificates with review status |
| POST | `/certificates` | STUDENT | Submit; enters the queue as `PENDING` |
| PUT/DELETE | `/certificates/{id}` | STUDENT (owner) | Update / delete |

---

## Resume — `/resume`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/resume` | STUDENT | Assembled resume: profile, education, skills, projects, experience, verified certificates |
| PUT | `/resume` | STUDENT | `{ "summary": "…", "careerObjective": "…", "template": "classic" }` |
| GET | `/resume/pdf` | STUDENT | `application/pdf` download |

---

## Notifications — `/notifications`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/notifications` | Any | Paged, newest first |
| GET | `/notifications/recent` | Any | Short list for the header |
| GET | `/notifications/unread-count` | Any | `{ "count": 3 }` |
| PATCH | `/notifications/{id}/read` | Owner | Mark one as read |
| PATCH | `/notifications/read-all` | Any | `{ "updated": 5 }` |

---

## Analytics — `/analytics`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/analytics/overview` | ADMIN | Headline counters |
| GET | `/analytics/summary` | COLLEGE_ADMIN | Applications by stage, jobs per month, top skills, selection totals |

---

## Administration — `/admin`

All endpoints require `COLLEGE_ADMIN`.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/admin/overview` | Dashboard counters |
| GET | `/admin/students` | Paged students. Filter: `search` |
| GET | `/admin/companies` | Paged companies. Filters: `status`, `search` |
| PATCH | `/admin/companies/{id}/status` | `{ "status": "APPROVED", "note": "…" }` |
| PATCH | `/admin/users/{id}/active` | `{ "active": false }` |
| GET | `/admin/jobs` | All jobs. Filter: `status` |
| GET | `/admin/internships` | All internships. Filter: `status` |
| GET | `/admin/applications` | All applications. Filter: `status` |
| GET | `/admin/certificates` | Review queue. Filter: `status` |
| PATCH | `/admin/certificates/{id}/review` | `{ "status": "VERIFIED", "note": "…" }` |
| GET | `/admin/skills` | Catalogue with categories |
| POST | `/admin/skills` | Create a skill |
| PUT/DELETE | `/admin/skills/{id}` | Update / delete a skill |
| POST | `/admin/skill-categories` | Create a category |
| GET | `/admin/assessments` | All assessments |
| GET | `/admin/assessments/{id}/questions` | Questions **with** the correct option marked |
| POST | `/admin/assessments` | Create with nested questions and options |
| PUT/DELETE | `/admin/assessments/{id}` | Update / delete |
| POST | `/admin/announcements` | `{ "title": "…", "message": "…", "audience": "ALL" }` → `{ "recipients": 42 }` |

---

## Interactive documentation

With the backend running:

- Swagger UI — <http://localhost:8080/swagger-ui.html>
- OpenAPI JSON — <http://localhost:8080/v3/api-docs>

Use *Authorize* in Swagger UI to paste a token from `POST /auth/login` and call
protected endpoints from the browser.
