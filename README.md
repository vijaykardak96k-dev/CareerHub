# CareerHub

**Student Career, Internship & Skill Management System**

CareerHub is a full-stack placement platform that brings students, recruiters and the
college placement office onto one system. Students build a verified profile, take
skill assessments, generate a resume and apply to openings; recruiters register,
get verified by the college and manage their hiring pipeline; the placement office
approves companies, curates the skill catalogue, verifies certificates and watches
placement analytics.

---

## Contents

- [Features](#features)
- [Architecture](#architecture)
- [Technology stack](#technology-stack)
- [Project layout](#project-layout)
- [Prerequisites](#prerequisites)
- [Running locally](#running-locally)
- [Running with Docker Compose](#running-with-docker-compose)
- [Runtime configuration](#runtime-configuration)
- [Demo accounts](#demo-accounts)
- [Deploying to AWS EC2](#deploying-to-aws-ec2)
- [Deploying to Kubernetes](#deploying-to-kubernetes)
- [Deploying with Helm](#deploying-with-helm)
- [CI/CD](#cicd)
- [Testing](#testing)
- [API documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)
- [Documentation](#documentation)
- [Licence](#licence)

---

## Features

### Students
- Registration, login and JWT-backed sessions; passwords hashed with BCrypt.
- Profile with education, projects, experience, links and a live completion score.
- Skill profile with proficiency levels drawn from a college-curated catalogue.
- Multiple-choice skill assessments, **scored entirely on the server** — correct
  answers are never sent to the browser.
- Rule-based skill gap analysis against any job or internship.
- Resume builder with a server-generated PDF download.
- Certificates submitted for verification by the placement office.
- Browse, save and apply to jobs and internships; track every application and its
  full status history.
- In-app notifications and a dashboard built from real database records.

### Companies
- Self-registration; the account starts as `PENDING` and cannot publish anything.
- The placement office can `APPROVE`, `REJECT` or `SUSPEND` a company.
- Job and internship CRUD with `DRAFT` / `PUBLISHED` / `CLOSED` lifecycle, required
  skills, minimum CGPA, graduation year, deadline and vacancy count.
- Applicant list with candidate profiles and pipeline status changes.

### College administrators
- Approve or reject recruiters and activate or deactivate any account.
- Manage skill categories, skills and assessments.
- Verify or reject student certificates.
- Placement analytics: applications by stage, jobs posted per month, most common
  student skills and the overall selection rate.
- Broadcast announcements to students, companies or everyone.

---

## Architecture

A **modular monolith**: one Spring Boot application with clearly separated feature
packages (`user`, `student`, `company`, `job`, `internship`, `application`, `skill`,
`assessment`, `certificate`, `resume`, `notification`, `analytics`, `admin`), one
React single-page application and one PostgreSQL database.

```
Browser ──► Nginx (SPA + static assets) ──► Spring Boot REST API ──► PostgreSQL
                   │                                  │
                   └─ /config.js written at           └─ Flyway migrations,
                      container startup                  JWT auth, BCrypt
```

Full diagrams (architecture, use cases, ER, application workflow, recruitment
workflow, CI/CD) are in [`docs/architecture.md`](docs/architecture.md) and
[`docs/database.md`](docs/database.md).

---

## Technology stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router, Axios, Recharts, Lucide |
| Backend | Java 21, Spring Boot 3.3, Spring Security, JWT (jjwt), Spring Data JPA, Bean Validation, Maven |
| Database | PostgreSQL 16, Flyway migrations, UUID primary keys |
| Docs | springdoc-openapi (Swagger UI) |
| PDF | OpenPDF |
| Containers | Docker, Docker Compose, Nginx |
| Orchestration | Kubernetes manifests, Helm chart |
| CI/CD | GitHub Actions, Docker Hub |

---

## Project layout

```
CareerHub/
├── backend/                 Spring Boot application
│   ├── src/main/java/com/careerhub/
│   ├── src/main/resources/db/migration/   Flyway V1, V2, V3
│   ├── src/test/java/                     JUnit + MockMvc integration tests
│   └── Dockerfile
├── frontend/                React + TypeScript SPA
│   ├── public/config.js     Runtime configuration (rewritten at startup)
│   ├── src/
│   ├── nginx.conf
│   ├── docker-entrypoint.sh
│   └── Dockerfile
├── k8s/                     Plain Kubernetes manifests
├── helm/careerhub/          Helm chart
├── .github/workflows/ci.yml GitHub Actions pipeline
├── docs/                    Requirements, architecture, database, API, deployment, testing
├── docker-compose.yml
├── .env.example, .env.docker.example, .env.production.example
└── README.md
```

---

## Prerequisites

| Tool | Version | Needed for |
| --- | --- | --- |
| Java JDK | 21 | Backend |
| Maven | 3.9+ | Backend |
| Node.js | 20+ | Frontend |
| PostgreSQL | 14+ | Local database |
| Docker & Compose | 24+ | Container workflow |
| kubectl / Helm | 1.28+ / 3.12+ | Kubernetes deployment |

---

## Running locally

### 1. Database

```bash
createdb careerhub
createuser careerhub --pwprompt
psql -c "GRANT ALL PRIVILEGES ON DATABASE careerhub TO careerhub;"
```

Flyway creates the schema on the first backend start, so no manual DDL is needed.

### 2. Backend

```bash
cp .env.example .env          # then edit the values
cd backend
export $(grep -v '^#' ../.env | xargs)
mvn spring-boot:run
```

The API starts on <http://localhost:8080>, Swagger UI on
<http://localhost:8080/swagger-ui.html>.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app starts on <http://localhost:5173> and reads its backend URL from
`public/config.js`, which points at `http://localhost:8080/api/v1` by default.

---

## Running with Docker Compose

```bash
cp .env.docker.example .env   # edit DB_PASSWORD and JWT_SECRET first
docker compose up --build
```

| Service | URL |
| --- | --- |
| Frontend | <http://localhost:3000> |
| Backend | <http://localhost:8080> |
| Swagger UI | <http://localhost:8080/swagger-ui.html> |

PostgreSQL is deliberately **not** published to the host — only the backend
container can reach it over the internal `careerhub` network.

```bash
docker compose logs -f backend    # follow logs
docker compose down               # stop
docker compose down -v            # stop and delete the database volume
```

---

## Runtime configuration

The frontend never hardcodes a backend address and never bakes one into the bundle.

1. `index.html` loads `/config.js` before the React bundle.
2. `config.js` sets `window.__APP_CONFIG__ = { API_BASE_URL: "..." }`.
3. In Docker and Kubernetes, `docker-entrypoint.sh` **rewrites** that file at
   container startup from the `API_BASE_URL` environment variable.
4. `src/lib/api.ts` reads it, falling back to the page's own origin + `/api/v1`.

One image therefore runs unchanged on localhost, on an EC2 instance behind a public
IP and inside Kubernetes behind an Ingress. Changing the backend URL means restarting
a container, not rebuilding the frontend.

---

## Demo accounts

Demo data is seeded by `DemoDataSeeder` on first startup, but only when the `users`
table is empty and `SEED_DEMO_DATA=true` (the default for local and Compose; set to
`false` in the production templates). Passwords are hashed with the real
`PasswordEncoder`, so no hashes are checked into the repository.

All demo accounts share the password **`Password@123`** (override with `SEED_PASSWORD`).

| Role | Email | Notes |
| --- | --- | --- |
| College administrator | `admin@careerhub.edu` | Full admin dashboard |
| Student | `riya.sharma@student.careerhub.edu` | Skills, applications, assessments |
| Student | `aditya.patil@student.careerhub.edu` | Shortlisted application |
| Student | `sneha.kulkarni@student.careerhub.edu` | Certificates pending review |
| Student | `rahul.deshmukh@student.careerhub.edu` | Internship applicant |
| Student | `pooja.jadhav@student.careerhub.edu` | New profile |
| Company | `hr@novasoft.example` | **Approved** — can publish |
| Company | `careers@skylineanalytics.example` | **Approved** — can publish |
| Company | `talent@brightwave.example` | **Pending** — demonstrates the approval gate |

> Change or disable these before any real deployment: set `SEED_DEMO_DATA=false`.

---

## Deploying to AWS EC2

Summarised here; the full walkthrough with security-group rules, TLS and backups is
in [`docs/deployment.md`](docs/deployment.md).

1. Launch an Ubuntu 22.04 `t3.small` (or larger) instance.
2. Security group: allow **22** (your IP only), **80** and **443**. Do **not** open
   **5432** — PostgreSQL stays on the internal Docker network and is never reachable
   from the internet.
3. Install Docker and the Compose plugin.
4. Clone the repository, `cp .env.production.example .env`, then set a strong
   `DB_PASSWORD`, a random `JWT_SECRET` (`openssl rand -base64 48`), your domain in
   `CORS_ALLOWED_ORIGINS`, `API_BASE_URL`, and `SEED_DEMO_DATA=false`.
5. `chmod 600 .env`.
6. `docker compose up -d --build`.
7. Put Nginx or a load balancer in front for TLS, proxying `/api` to port 8080 and
   everything else to port 3000.

---

## Deploying to Kubernetes

```bash
kubectl apply -f k8s/namespace.yaml

# Create the secret from real values rather than committing one:
kubectl -n careerhub create secret generic careerhub-secrets \
  --from-literal=DB_USERNAME=careerhub \
  --from-literal=DB_PASSWORD="$(openssl rand -base64 24)" \
  --from-literal=JWT_SECRET="$(openssl rand -base64 48)"

kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/pvc.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
kubectl apply -f k8s/services.yaml
kubectl apply -f k8s/ingress.yaml

kubectl -n careerhub get pods -w
```

Add `careerhub.local` to your hosts file pointing at the ingress controller, then
open <http://careerhub.local>. Because the Ingress serves the API and the app from
one origin, `API_BASE_URL` is simply `/api/v1`.

---

## Deploying with Helm

```bash
helm upgrade --install careerhub ./helm/careerhub \
  --namespace careerhub --create-namespace \
  --set backend.image.repository=vijaykardak/careerhub-backend \
  --set backend.image.tag=<commit-sha> \
  --set frontend.image.repository=vijaykardak/careerhub-frontend \
  --set frontend.image.tag=<commit-sha> \
  --set secrets.dbPassword="$(openssl rand -base64 24)" \
  --set secrets.jwtSecret="$(openssl rand -base64 48)" \
  --set ingress.host=careerhub.example.com
```

Useful commands:

```bash
helm lint ./helm/careerhub
helm template careerhub ./helm/careerhub    # render without installing
helm uninstall careerhub -n careerhub
```

Everything that changes between environments — image repository and tag, replica
counts, resources, ingress host, API base URL, secrets — lives in `values.yaml`.

---

## CI/CD

`.github/workflows/ci.yml` runs on every push and pull request to `main`/`master`:

1. **backend** — JDK 21, `mvn clean verify` (compiles and runs the test suite),
   uploads the surefire reports and the jar.
2. **frontend** — Node 20, `npm ci`, `npm run build` (type check + Vite build).
3. **docker** — only on a push to the default branch, after both jobs pass. Logs in
   to Docker Hub with the `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` repository
   secrets and pushes both images tagged with the **commit SHA** and `latest`.

Add the two secrets under *Settings → Secrets and variables → Actions*. The SHA tag
is what you pass to Helm for a reproducible deployment.

---

## Testing

```bash
cd backend
mvn test
```

Six JUnit 5 + MockMvc integration suites run against an in-memory H2 database in
PostgreSQL compatibility mode: authentication, authorisation, student profile,
company approval and job publishing, the job application lifecycle and assessment
scoring. See [`docs/testing.md`](docs/testing.md) for what each one covers.

---

## API documentation

With the backend running:

- Swagger UI — <http://localhost:8080/swagger-ui.html>
- OpenAPI JSON — <http://localhost:8080/v3/api-docs>

Every endpoint, its role requirement and its request and response shape are also
listed in [`docs/api.md`](docs/api.md).

---

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| Frontend loads but every request fails | `API_BASE_URL` points somewhere the *browser* cannot reach. Open `/config.js` in the browser and check the value; remember it is resolved by the browser, not by the backend container. |
| `CORS` error in the console | Add the exact frontend origin (scheme, host and port) to `CORS_ALLOWED_ORIGINS` and restart the backend. |
| Backend exits with a JWT error at startup | `JWT_SECRET` is missing or shorter than 32 characters. Generate one with `openssl rand -base64 48`. |
| `FlywayValidateException` on startup | The database has an older schema. For a disposable environment run `docker compose down -v`; otherwise migrate forward with a new versioned script. |
| Demo accounts do not exist | The `users` table was not empty on first startup, or `SEED_DEMO_DATA=false`. |
| `401` immediately after logging in | The stored token expired or the secret changed. Sign out and in again. |
| Recruiter cannot publish a job | The company is still `PENDING`; approve it from the admin *Companies* page. |
| Refreshing a deep link gives 404 | The SPA fallback is missing. `frontend/nginx.conf` handles this with `try_files $uri $uri/ /index.html`. |
| Postgres pod stuck `Pending` in Kubernetes | No default StorageClass, so the PVC cannot bind. Check `kubectl get sc`. |

---

## Documentation

| Document | Contents |
| --- | --- |
| [`docs/requirements.md`](docs/requirements.md) | Functional and non-functional requirements, roles, scope |
| [`docs/architecture.md`](docs/architecture.md) | System, module, use-case and workflow diagrams |
| [`docs/database.md`](docs/database.md) | ER diagram, table-by-table schema, migrations |
| [`docs/api.md`](docs/api.md) | Every endpoint with its role requirement |
| [`docs/deployment.md`](docs/deployment.md) | Local, Docker, EC2, Kubernetes, Helm, CI/CD |
| [`docs/testing.md`](docs/testing.md) | Test strategy, suites and manual test plan |

---

## Licence

MIT — see [LICENSE](LICENSE).
