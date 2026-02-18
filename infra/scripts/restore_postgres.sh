#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 /path/to/backup.sql"
  exit 1
fi

BACKUP_FILE="$1"
PROJECT_DIR="/opt/axioma-local"

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "Backup file not found: $BACKUP_FILE"
  exit 1
fi

cd "$PROJECT_DIR"

if [[ ! -f .env.production ]]; then
  echo "Missing .env.production in $PROJECT_DIR"
  exit 1
fi

cp .env.production .env

cat "$BACKUP_FILE" | docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T postgres psql -U axioma -d axioma
