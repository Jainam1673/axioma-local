# Axioma Local

Production-ready MVP for the **Agency Profit Discipline & Withdrawal Intelligence Platform**.

## Product Scope

The implementation follows the strategy and engine documents now stored in:

- `docs/PROJECT.md`
- `docs/ENGINE.md`

Implemented modules (real functionality):

- OAuth2-compatible authentication (`/oauth/token`) + refresh and revoke
- Role-protected financial APIs (owner/admin/member)
- Income, expenses, withdrawals, partners, salary settings, buffer settings modules
- Deterministic financial engine (`FinancialEngineService`)
- Withdrawal impact simulator (`WithdrawalSimulatorService`)
- Client margin analytics (`ClientProfitabilityService`)
- Risk classification (`RiskEvaluatorService`)
- Dashboard summary API with Redis cache

## Tech Stack

- Runtime/package manager: Bun
- Frontend: Next.js App Router, TypeScript strict, Tailwind
- Backend: NestJS, TypeScript strict, Prisma
- Data: PostgreSQL + Redis
- Infra: Docker Compose + Nginx

## Run Locally (No Docker)

Use this mode if PostgreSQL and Redis are installed directly on your machine.

Prerequisites:

- Bun `1.3.5+`
- Node.js `20+` (for runtime/tooling compatibility)
- PostgreSQL running on `localhost:5432`
- Redis running on `localhost:6379`

1. Copy env:
   - `cp .env.example .env`
2. Install deps:
   - `bun install`
3. Ensure local DB + Redis are up:
   - PostgreSQL should have database `axioma` and valid credentials from `.env`
   - Redis should accept connections at `redis://localhost:6379`
4. Setup Prisma:
   - `bun run --filter @axioma/backend prisma:generate`
   - `bun run --filter @axioma/backend prisma:migrate --name init`
   - `bun run --filter @axioma/backend prisma:seed`
5. Start frontend + backend:
   - `bun run dev`

## Run Locally (Hybrid: App Native + Data via Docker)

If you prefer native app processes but containerized data services:

1. `cp .env.example .env`
2. `bun install`
3. `docker compose up -d postgres redis`
4. `bun run --filter @axioma/backend prisma:generate`
5. `bun run --filter @axioma/backend prisma:migrate --name init`
6. `bun run --filter @axioma/backend prisma:seed`
7. `bun run dev`

Endpoints:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`
- OAuth token: `POST http://localhost:4000/oauth/token`
- Dashboard summary: `GET http://localhost:4000/dashboard/summary`
- Engine simulation: `POST http://localhost:4000/engine/simulate`

Seed user:

- Email: `owner@axioma.local`
- Password: `Owner@12345`

## Run with Docker (Full Stack)

Use this mode for production-like local execution (frontend + backend + postgres + redis + nginx).

1. Copy env:
   - `cp .env.production.example .env.production`
2. Build images:
   - `docker compose build --no-cache`
3. Start stack:
   - `docker compose up -d`
4. Open app:
   - `http://localhost:8080`
5. Check status/logs:
   - `docker compose ps`
   - `docker compose logs -f backend`
   - `docker compose logs -f frontend`
6. Stop stack:
   - `docker compose down`

Containerized behavior:

- Backend runs `prisma migrate deploy` on startup.
- Frontend uses same-origin `/api` and is proxied to backend.
- Nginx is the intended entrypoint for browser traffic.

Health endpoints:

- Backend: `http://localhost:4000/health`
- Liveness: `http://localhost:4000/health/live`
- Readiness: `http://localhost:4000/health/ready`
- Nginx: `http://localhost:8080/nginx-health`

## Tests & Quality Gates

- Lint all: `bun run lint`
- Build all: `bun run build`
- Backend unit tests: `bun run --filter @axioma/backend test`
- Backend strict coverage: `bun run --filter @axioma/backend test:coverage`
- Frontend E2E: `bun run --filter @axioma/frontend test:e2e`

Playwright validates login, auth failure behavior, route protection, session expiry, and dashboard rendering.

## OAuth2 Password Grant Example

```bash
curl -X POST http://localhost:4000/oauth/token \
  -H "content-type: application/json" \
  -d '{
    "grant_type": "password",
    "client_id": "axioma-web-app",
    "username": "owner@axioma.local",
    "password": "Owner@12345"
  }'
```

## VPS Deployment (Ubuntu 24.04/Cosmic)

1. Bootstrap host:
   - `sudo bash infra/scripts/setup_vps.sh`
2. Place repo at `/opt/axioma-local` and create `.env.production`.
3. Deploy:
   - `bash infra/scripts/deploy_vps.sh`
4. Enable backup timer:
   - `sudo cp infra/systemd/axioma-backup.service /etc/systemd/system/`
   - `sudo cp infra/systemd/axioma-backup.timer /etc/systemd/system/`
   - `sudo systemctl daemon-reload`
   - `sudo systemctl enable --now axioma-backup.timer`

## Operations & Governance

- Runbook: `infra/OPERATIONS.md`
- Security policy: `SECURITY.md`
- Dependency updates: `.github/dependabot.yml`
- Ownership: `.github/CODEOWNERS`
