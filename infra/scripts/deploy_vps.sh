#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="/opt/axioma-local"

cd "$PROJECT_DIR"

if [[ ! -f .env.production ]]; then
  echo "Missing .env.production in $PROJECT_DIR"
  exit 1
fi

cp .env.production .env

docker compose -f docker-compose.yml -f docker-compose.prod.yml pull || true
docker compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T backend bun run prisma:migrate
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T backend bun run prisma:seed

docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
