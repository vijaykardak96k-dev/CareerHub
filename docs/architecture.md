# Architecture

## 1. Style

CareerHub is a **modular monolith**. One Spring Boot process contains every feature,
but the code is split into packages that own their entities, repositories, services,
DTOs and controllers. Packages talk to each other through services, never by reaching
into another package's repository. Splitting a package into a separate service later
would mean replacing a service call with an HTTP call, not untangling the model.

Microservices were rejected on purpose: a single college placement system has one
database, one deployment cadence and one team, so the operational cost of separate
services buys nothing.

## 2. System overview

```mermaid
flowchart LR
    subgraph Client
        B["Browser<br/>React SPA"]
    end

    subgraph Edge
        N["Nginx<br/>static assets + SPA routing"]
    end

    subgraph Application
        API["Spring Boot REST API<br/>/api/v1"]
    end

    subgraph Data
        DB[("PostgreSQL 16")]
        FS[["File storage volume"]]
    end

    B -->|HTTPS| N
    N -->|"/config.js, index.html, /assets"| B
    B -->|"JSON + JWT"| API
    API -->|JDBC| DB
    API --> FS

    CFG["API_BASE_URL<br/>environment variable"] -.->|"written into /config.js<br/>at container startup"| N
```

The browser calls the API directly using the URL it read from `/config.js`. Nginx
serves the SPA; in Kubernetes the Ingress puts both behind one host so the API base
URL is simply `/api/v1`.

## 3. Backend modules

```mermaid
flowchart TB
    subgraph Cross-cutting
        SEC["security<br/>JWT filter, CurrentUser"]
        EXC["exception<br/>GlobalExceptionHandler"]
        CFG2["config<br/>CORS, OpenAPI, seeder"]
    end

    USER["user<br/>User, Role, auth"]
    STU["student<br/>profile, education,<br/>projects, experience"]
    COM["company<br/>profile, approval status"]
    JOB["job"]
    INT["internship"]
    APP["application<br/>+ status history"]
    SKL["skill<br/>catalogue, student skills,<br/>gap analysis"]
    ASM["assessment<br/>questions, attempts"]
    CRT["certificate"]
    RES["resume<br/>+ PDF"]
    NOT["notification"]
    ANA["analytics"]
    ADM["admin"]

    USER --> STU
    USER --> COM
    COM --> JOB
    COM --> INT
    STU --> APP
    JOB --> APP
    INT --> APP
    SKL --> STU
    SKL --> JOB
    SKL --> INT
    SKL --> ASM
    STU --> CRT
    STU --> RES
    APP --> NOT
    CRT --> NOT
    COM --> NOT
    ADM --> COM
    ADM --> CRT
    ADM --> SKL
    ADM --> ASM
    ANA --> APP
    ANA --> JOB
```

Each module follows the same shape:

```
module/
├── Entity.java            JPA entity
├── EntityRepository.java  Spring Data repository
├── EntityService.java     business rules and authorisation
├── EntityController.java  REST endpoints, validation
└── EntityDtos.java        request and view records
```

## 4. Request flow

```mermaid
sequenceDiagram
    participant Br as Browser
    participant F as JwtAuthenticationFilter
    participant C as Controller
    participant S as Service
    participant R as Repository
    participant DB as PostgreSQL

    Br->>F: GET /api/v1/students/me (Bearer token)
    F->>F: parse and verify the JWT
    F->>DB: load the user, check that it is active
    F->>C: authenticated SecurityContext
    C->>C: @PreAuthorize role check
    C->>S: delegate
    S->>R: query
    R->>DB: SQL
    DB-->>R: rows
    R-->>S: entities
    S-->>C: DTO
    C-->>Br: 200 JSON
```

An unhandled failure anywhere in that chain is converted by `GlobalExceptionHandler`
into a consistent body: `{timestamp, status, error, message, path, fieldErrors}`.

## 5. Use cases

```mermaid
flowchart LR
    S(("Student"))
    C(("Company"))
    A(("College<br/>administrator"))

    subgraph CareerHub
        UC1["Register and sign in"]
        UC2["Maintain profile"]
        UC3["Manage skills"]
        UC4["Take assessment"]
        UC5["Run skill gap analysis"]
        UC6["Browse and save openings"]
        UC7["Apply to an opening"]
        UC8["Track and withdraw applications"]
        UC9["Build resume and download PDF"]
        UC10["Submit certificates"]
        UC11["Publish jobs and internships"]
        UC12["Review applicants"]
        UC13["Change application status"]
        UC14["Approve or suspend companies"]
        UC15["Verify certificates"]
        UC16["Curate skills and assessments"]
        UC17["View placement analytics"]
        UC18["Broadcast announcements"]
    end

    S --- UC1
    S --- UC2
    S --- UC3
    S --- UC4
    S --- UC5
    S --- UC6
    S --- UC7
    S --- UC8
    S --- UC9
    S --- UC10

    C --- UC1
    C --- UC11
    C --- UC12
    C --- UC13

    A --- UC14
    A --- UC15
    A --- UC16
    A --- UC17
    A --- UC18
```

## 6. Student application workflow

```mermaid
stateDiagram-v2
    [*] --> APPLIED: student applies
    APPLIED --> UNDER_REVIEW: recruiter opens the application
    APPLIED --> REJECTED: recruiter rejects
    APPLIED --> WITHDRAWN: student withdraws
    UNDER_REVIEW --> SHORTLISTED: profile fits
    UNDER_REVIEW --> REJECTED
    UNDER_REVIEW --> WITHDRAWN
    SHORTLISTED --> INTERVIEW: interview scheduled
    SHORTLISTED --> REJECTED
    SHORTLISTED --> WITHDRAWN
    INTERVIEW --> SELECTED: offer made
    INTERVIEW --> REJECTED
    INTERVIEW --> WITHDRAWN
    SELECTED --> [*]
    REJECTED --> [*]
    WITHDRAWN --> [*]

    note right of APPLIED
        Every transition writes an
        application_status_history row
        and notifies the student.
    end note
```

## 7. Company recruitment workflow

```mermaid
sequenceDiagram
    participant C as Company
    participant A as College administrator
    participant Sys as CareerHub
    participant St as Student

    C->>Sys: register
    Sys-->>C: account created, status PENDING
    Sys->>A: company awaiting approval

    A->>Sys: PATCH /admin/companies/{id}/status APPROVED
    Sys->>C: notification "company approved"

    C->>Sys: POST /jobs (status PUBLISHED)
    Sys-->>C: 201 Created
    Note over Sys: A PENDING company is refused here with 403.

    St->>Sys: POST /applications
    Sys->>C: application received

    C->>Sys: PATCH /applications/{id}/status SHORTLISTED
    Sys->>St: notification + status history row
    C->>Sys: PATCH /applications/{id}/status SELECTED
    Sys->>St: notification + status history row
```

## 8. Frontend architecture

```
src/
├── lib/       api.ts (axios + runtime config + interceptors), types.ts, format.ts
├── context/   AuthContext (session), ToastContext (feedback)
├── components/ AppLayout, ProtectedRoute, Ui, Modal, Charts
└── pages/     public/, student/, company/, admin/
```

- `AuthContext` holds the session, restores it on load through `GET /auth/me` and
  clears it when a `401` comes back.
- `ProtectedRoute` guards routes by role. It is convenience only — the backend
  enforces the same rules and is the real boundary.
- `lib/types.ts` mirrors every backend DTO, so a contract change surfaces as a
  compile error rather than a runtime `undefined`.
- Every page handles loading, empty and error states explicitly.

## 9. Security

| Concern | Approach |
| --- | --- |
| Password storage | BCrypt via Spring Security's `PasswordEncoder` |
| Sessions | Stateless JWT in the `Authorization` header |
| Secret management | `JWT_SECRET` and database credentials from the environment, Kubernetes Secrets or a mode-600 `.env` |
| Authorisation | `@PreAuthorize` per endpoint plus ownership checks inside each service |
| Input validation | Bean Validation on every request record; failures become `fieldErrors` |
| SQL injection | Spring Data JPA with bound parameters only |
| CORS | Explicit allow-list from `CORS_ALLOWED_ORIGINS` |
| Assessment integrity | Correct answers never leave the server |
| Database exposure | PostgreSQL is never published to the host or the internet |

## 10. CI/CD pipeline

```mermaid
flowchart LR
    DEV["git push"] --> GH["GitHub Actions"]

    GH --> B1["backend job<br/>JDK 21, mvn clean verify"]
    GH --> B2["frontend job<br/>Node 20, npm ci, npm run build"]

    B1 --> D{"push to<br/>main?"}
    B2 --> D

    D -->|no| STOP["stop after build and test"]
    D -->|yes| L["docker/login-action<br/>DOCKERHUB_USERNAME + DOCKERHUB_TOKEN"]

    L --> IM1["build and push<br/>careerhub-backend:SHA + :latest"]
    L --> IM2["build and push<br/>careerhub-frontend:SHA + :latest"]

    IM1 --> DH[("Docker Hub")]
    IM2 --> DH

    DH --> DEP["helm upgrade --install<br/>--set image.tag=SHA"]
```

Tagging by commit SHA is what makes a deployment reproducible: `latest` moves, the
SHA tag does not, so a rollback is a `helm upgrade` with the previous SHA.
