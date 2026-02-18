# Operations Runbook

## Deployment

- Use `infra/scripts/deploy_vps.sh` from `/opt/axioma-local`.
- Validate services after deploy:
  - `docker compose -f docker-compose.yml -f docker-compose.prod.yml ps`
  - `curl -fsS http://localhost:4000/health/live`
  - `curl -fsS http://localhost:4000/health/ready`

## Backup / Restore

- Manual backup:
  - `bash infra/scripts/backup_postgres.sh`
- Restore from backup:
  - `bash infra/scripts/restore_postgres.sh /opt/axioma-backups/<file>.sql`

## Incident Quick Checks

- App logs:
  - `docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f backend`
  - `docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f frontend`
- DB status:
  - `docker compose -f docker-compose.yml -f docker-compose.prod.yml exec postgres pg_isready`
- Redis status:
  - `docker compose -f docker-compose.yml -f docker-compose.prod.yml exec redis redis-cli ping`

## Rollback

- Re-deploy previous git commit:
  - `git checkout <known-good-commit>`
  - `bash infra/scripts/deploy_vps.sh`
