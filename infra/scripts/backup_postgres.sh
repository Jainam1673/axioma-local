#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="/opt/axioma-local"
BACKUP_DIR="/opt/axioma-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

mkdir -p "$BACKUP_DIR"
cd "$PROJECT_DIR"

if [[ ! -f .env.production ]]; then
  echo "Missing .env.production in $PROJECT_DIR"
  exit 1
fi

cp .env.production .env

docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U axioma -d axioma > "$BACKUP_DIR/axioma_$TIMESTAMP.sql"

find "$BACKUP_DIR" -type f -name "axioma_*.sql" -mtime +14 -delete
