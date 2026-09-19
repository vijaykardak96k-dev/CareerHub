# Deployment

Four ways to run CareerHub, from a laptop to a Kubernetes cluster. In every one, the
frontend gets its backend URL at **runtime**, so the image is built once and
configured per environment.

---

## 1. Local development

### Database

```bash
createdb careerhub
createuser careerhub --pwprompt
psql -c "GRANT ALL PRIVILEGES ON DATABASE careerhub TO careerhub;"
```

Flyway creates the schema on the first backend start.

### Backend

```bash
cp .env.example .env
cd backend
export $(grep -v '^#' ../.env | xargs)
mvn spring-boot:run
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The dev server reads `frontend/public/config.js`, which points at
`http://localhost:8080/api/v1`. Edit that file if your backend runs elsewhere; no
rebuild is needed.

---

## 2. Docker Compose

```bash
cp .env.docker.example .env
# Set DB_PASSWORD and JWT_SECRET before starting.
docker compose up --build -d
docker compose ps
docker compose logs -f backend
```

| Service | Host port | Notes |
| --- | --- | --- |
| frontend | 3000 | Nginx serving the SPA |
| backend | 8080 | Spring Boot + Swagger UI |
| postgres | *(none)* | `expose` only; reachable solely from the `careerhub` network |

Leaving PostgreSQL unpublished is deliberate. Publishing 5432 would expose the
database to anything that can reach the host.

```bash
docker compose down      # stop, keep the data
docker compose down -v   # stop and delete the volumes
```

---

## 3. AWS EC2

### 3.1 Launch the instance

| Setting | Value |
| --- | --- |
| AMI | Ubuntu Server 22.04 LTS |
| Type | `t3.small` minimum (2 GB RAM); `t3.medium` is comfortable |
| Storage | 20 GB gp3 |
| Key pair | Your SSH key |

### 3.2 Security group

| Type | Port | Source | Reason |
| --- | --- | --- | --- |
| SSH | 22 | **Your IP only** | Administration |
| HTTP | 80 | 0.0.0.0/0 | Public site |
| HTTPS | 443 | 0.0.0.0/0 | Public site over TLS |

> **Do not add a rule for 5432.** PostgreSQL runs as a Compose service on the
> internal bridge network and is never published to the host, so there is nothing to
> open. An inbound 5432 rule would expose the database to the internet.

### 3.3 Install Docker

```bash
sudo apt-get update && sudo apt-get upgrade -y
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker $USER && newgrp docker
```

### 3.4 Deploy

```bash
git clone <your-repository-url> careerhub
cd careerhub

cp .env.production.example .env
nano .env
chmod 600 .env

docker compose up -d --build
docker compose ps
```

Set at minimum:

```bash
DB_PASSWORD=<strong password>
JWT_SECRET=<openssl rand -base64 48>
CORS_ALLOWED_ORIGINS=https://careerhub.example.com
API_BASE_URL=https://careerhub.example.com/api/v1
SEED_DEMO_DATA=false
```

`API_BASE_URL` is resolved by the **browser**, so it must be the public address, not
a Docker service name.

### 3.5 Nginx and TLS on the host

```bash
sudo apt-get install -y nginx certbot python3-certbot-nginx
sudo nano /etc/nginx/sites-available/careerhub
```

```nginx
server {
    listen 80;
    server_name careerhub.example.com;

    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /swagger-ui/ { proxy_pass http://127.0.0.1:8080; }
    location /v3/api-docs { proxy_pass http://127.0.0.1:8080; }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/careerhub /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d careerhub.example.com
```

With this proxy in place, the frontend and the API share an origin, so
`API_BASE_URL=/api/v1` also works and CORS stops mattering.

### 3.6 Backups

```bash
docker compose exec -T postgres pg_dump -U careerhub careerhub | gzip > backup-$(date +%F).sql.gz
```

Restore:

```bash
gunzip -c backup-2026-05-20.sql.gz | docker compose exec -T postgres psql -U careerhub -d careerhub
```

Add it to cron and copy the dumps off the instance — an EBS volume is not a backup.

---

## 4. Kubernetes

```bash
kubectl apply -f k8s/namespace.yaml

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
```

```bash
kubectl -n careerhub get pods -w
kubectl -n careerhub logs -f deployment/careerhub-backend
```

| Manifest | Contents |
| --- | --- |
| `namespace.yaml` | The `careerhub` namespace |
| `configmap.yaml` | Non-secret settings including `API_BASE_URL: /api/v1` |
| `secret.example.yaml` | Template; create the real Secret with `kubectl create secret` |
| `pvc.yaml` | 5 Gi for PostgreSQL, 1 Gi for backend file storage |
| `postgres.yaml` | StatefulSet with `pg_isready` probes |
| `backend.yaml` | Deployment ×2 with startup, readiness and liveness probes on `/actuator/health` |
| `frontend.yaml` | Deployment ×2 with probes on `/healthz` |
| `services.yaml` | Headless PostgreSQL service plus ClusterIP services |
| `ingress.yaml` | `/api`, `/swagger-ui`, `/v3/api-docs` to the backend, `/` to the frontend |

Point `careerhub.local` at your ingress controller:

```bash
echo "$(kubectl -n ingress-nginx get svc ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}') careerhub.local" | sudo tee -a /etc/hosts
```

The backend starts before PostgreSQL is ready on a cold cluster; the startup probe
allows up to 150 seconds, and Flyway retries, so the pod settles on its own.

---

## 5. Helm

```bash
helm lint ./helm/careerhub
helm template careerhub ./helm/careerhub | less   # render without installing

helm upgrade --install careerhub ./helm/careerhub \
  --namespace careerhub --create-namespace \
  --set backend.image.repository=vijaykardak/careerhub-backend \
  --set backend.image.tag=$GIT_SHA \
  --set frontend.image.repository=vijaykardak/careerhub-frontend \
  --set frontend.image.tag=$GIT_SHA \
  --set secrets.dbPassword="$(openssl rand -base64 24)" \
  --set secrets.jwtSecret="$(openssl rand -base64 48)" \
  --set ingress.host=careerhub.example.com \
  --set config.corsAllowedOrigins=https://careerhub.example.com
```

Key values:

| Value | Default | Purpose |
| --- | --- | --- |
| `backend.image.repository` / `.tag` | `vijaykardak/careerhub-backend` / `latest` | Which backend image to run |
| `frontend.image.repository` / `.tag` | `vijaykardak/careerhub-frontend` / `latest` | Which frontend image to run |
| `backend.replicaCount`, `frontend.replicaCount` | `2` | Horizontal scale |
| `config.apiBaseUrl` | `/api/v1` | Injected into the frontend at startup |
| `postgres.enabled` | `true` | Set to `false` to use a managed database |
| `ingress.host` | `careerhub.local` | Public hostname |

Rollback:

```bash
helm history careerhub -n careerhub
helm rollback careerhub <revision> -n careerhub
```

Because images are tagged with the commit SHA, a rollback pulls exactly the bytes
that were running before.

---

## 6. CI/CD

`.github/workflows/ci.yml`:

1. **backend** — JDK 21, `mvn clean verify`, uploads the surefire reports and the jar.
2. **frontend** — Node 20, `npm ci`, `npm run build`.
3. **docker** — only on a push to `main`/`master` once both pass. Logs in to Docker
   Hub and pushes both images tagged `:<commit-sha>` and `:latest`.

Required repository secrets (*Settings → Secrets and variables → Actions*):

| Secret | Value |
| --- | --- |
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | A Docker Hub access token, not your password |

To deploy automatically, add a step after the push that runs the `helm upgrade`
command above with `--set *.image.tag=${{ github.sha }}`.

---

## 7. Production checklist

- [ ] `JWT_SECRET` is at least 32 random characters and unique to this environment.
- [ ] `DB_PASSWORD` is strong and not reused.
- [ ] `SEED_DEMO_DATA=false`.
- [ ] `CORS_ALLOWED_ORIGINS` lists only the real frontend origin.
- [ ] TLS terminates at Nginx, an ALB or the Ingress.
- [ ] PostgreSQL is not reachable from outside the private network.
- [ ] `.env` is `chmod 600` and is not in version control.
- [ ] Database backups run on a schedule and are stored off the instance.
- [ ] Image tags are commit SHAs, not `latest`, so deployments are reproducible.
- [ ] Health endpoints (`/actuator/health`, `/healthz`) are monitored.
