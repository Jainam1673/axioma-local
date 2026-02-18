# Axioma Local

Production-grade MVP foundation for the **Agency Profit Discipline & Withdrawal Intelligence Platform**.

## Stack

- Runtime/PM: Bun
- Frontend: Next.js App Router + TypeScript + Tailwind
- Backend: NestJS + TypeScript + Prisma
- Database: PostgreSQL
- Cache/Queue base: Redis
- Infra: Docker Compose + Nginx reverse proxy

## MVP Modules Implemented

- Income tracking module shell
- Expense tracking module shell
- Withdrawals module shell
- Partners module shell
- Salary settings module
- Buffer settings module
- Deterministic `FinancialEngineService`
- `WithdrawalSimulatorService`
- `ClientProfitabilityService`
- `RiskEvaluatorService`
- Decision dashboard API + frontend page
- Redis-backed dashboard summary caching
- OAuth2-compatible token endpoint with JWT access + refresh tokens
- Role-based access guard for financial APIs

## Local Setup (native)

1. Copy environment file:
   - `cp .env.example .env`
2. Install dependencies:
   - `bun install`
3. Start data services (Docker):
   - `docker compose up -d postgres redis`
4. Run Prisma setup:
   - `bun run --filter @axioma/backend prisma:generate`
   - `bun run --filter @axioma/backend prisma:migrate --name init`
   - `bun run --filter @axioma/backend prisma:seed`
5. Start apps:
   - `bun run dev`

Frontend: `http://localhost:3000`
Backend: `http://localhost:4000`
Dashboard API: `http://localhost:4000/dashboard/summary`
Engine simulate API: `POST http://localhost:4000/engine/simulate`
OAuth token API: `POST http://localhost:4000/oauth/token`
Legacy login compatibility API: `POST http://localhost:4000/auth/login`

Default seed credentials:

- Email: `owner@axioma.local`
- Password: `Owner@12345`

## Local Setup (fully containerized)

- `docker compose build --no-cache`
- `docker compose up -d`
- Open `http://localhost:8080`

Health endpoints:

- Backend: `http://localhost:4000/health`
- Nginx: `http://localhost:8080/nginx-health`

## Verification

- Backend tests:
   - `bun run --filter @axioma/backend test`
- Backend strict coverage:
   - `bun run --filter @axioma/backend test:coverage`
- Backend lint:
   - `bun run --filter @axioma/backend lint`
- Frontend lint:
   - `bun run --filter @axioma/frontend lint`
- Frontend E2E (Playwright):
   - `bun run --filter @axioma/frontend test:e2e`

## OAuth2 Token Request (password grant)

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

1. Bootstrap host as root:
   - `sudo bash infra/scripts/setup_vps.sh`
2. Clone repository to `/opt/axioma-local` and add `.env.production`.
3. Deploy release:
   - `bash infra/scripts/deploy_vps.sh`
4. Enable automated DB backups:
   - `sudo cp infra/systemd/axioma-backup.service /etc/systemd/system/`
   - `sudo cp infra/systemd/axioma-backup.timer /etc/systemd/system/`
   - `sudo systemctl daemon-reload`
   - `sudo systemctl enable --now axioma-backup.timer`

## Notes

- Financial calculations are deterministic and decimal-based (no floating-point drift).
- Controllers are thin; business logic is isolated in `FinancialEngineService`.
- Redis is wired as first-class infrastructure and used for dashboard response caching.
- Docker is optimized with multi-stage builds, non-root runtime users, healthchecks, read-only containers, and no-new-privileges.
- This is intentionally MVP-focused per project scope; non-MVP ERP/CRM/tax features are excluded.
