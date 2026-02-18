#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODE="auto"
SKIP_INSTALL="false"
SKIP_DB_SETUP="false"
FOLLOW_LOGS="false"
TMUX_SESSION_NAME="axioma-dev"

STARTED_DOCKER_DATA="false"

print_usage() {
  cat <<'USAGE'
Run Axioma project with one command.

Usage:
  bash scripts/run_project.sh [options]

Options:
  --mode <auto|docker|hybrid|native|terminals>  Run mode (default: auto)
    auto      : prefer full Docker stack if Docker daemon is available; otherwise terminals TUI
    docker : frontend + backend + postgres + redis + nginx via Docker Compose
    hybrid : frontend/backend native + postgres/redis via Docker Compose
    native : frontend/backend native + local postgres/redis services
    terminals : frontend/backend in separate tmux terminals + db health terminal
  --skip-install                       Skip dependency install
  --skip-db-setup                      Skip Prisma generate/migrate/seed
  --follow-logs                        In docker mode, stream compose logs after startup
  -h, --help                           Show help

Examples:
  bash scripts/run_project.sh
  bash scripts/run_project.sh --mode docker --follow-logs
  bash scripts/run_project.sh --mode hybrid
  bash scripts/run_project.sh --mode terminals
USAGE
}

log() {
  echo "[axioma-runner] $*"
}

title() {
  printf '\n\033[1;36m%s\033[0m\n' "$*"
}

fail() {
  echo "[axioma-runner] ERROR: $*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "Missing required command: $1"
}

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

docker_daemon_available() {
  command_exists docker && docker info >/dev/null 2>&1
}

wait_http() {
  local url="$1"
  local attempts="${2:-60}"
  local sleep_seconds="${3:-2}"

  for _ in $(seq 1 "$attempts"); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep "$sleep_seconds"
  done

  fail "Health check failed for $url"
}

ensure_env_file() {
  if [[ ! -f "$ROOT_DIR/.env" ]]; then
    if [[ -f "$ROOT_DIR/.env.example" ]]; then
      cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
      log "Created .env from .env.example"
    else
      fail "Missing .env and .env.example"
    fi
  fi
}

setup_database() {
  if [[ "$SKIP_DB_SETUP" == "true" ]]; then
    log "Skipping Prisma setup"
    return
  fi

  log "Running Prisma generate/migrate/seed"
  (cd "$ROOT_DIR" && bun run --filter @axioma/backend prisma:generate)
  (cd "$ROOT_DIR" && bun run --filter @axioma/backend prisma:migrate --name init)
  (cd "$ROOT_DIR" && bun run --filter @axioma/backend prisma:seed)
}

start_hybrid_data_services() {
  require_cmd docker
  require_cmd curl

  log "Starting postgres + redis via Docker Compose"
  (cd "$ROOT_DIR" && docker compose up -d postgres redis)
  STARTED_DOCKER_DATA="true"

  log "Waiting for backend dependencies (postgres/redis)"
  (cd "$ROOT_DIR" && docker compose ps postgres redis)
}

cleanup() {
  if [[ "$STARTED_DOCKER_DATA" == "true" ]]; then
    log "Stopping postgres + redis containers"
    (cd "$ROOT_DIR" && docker compose stop postgres redis >/dev/null 2>&1 || true)
  fi
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --mode)
        MODE="${2:-}"
        shift 2
        ;;
      --skip-install)
        SKIP_INSTALL="true"
        shift
        ;;
      --skip-db-setup)
        SKIP_DB_SETUP="true"
        shift
        ;;
      --follow-logs)
        FOLLOW_LOGS="true"
        shift
        ;;
      -h|--help)
        print_usage
        exit 0
        ;;
      *)
        fail "Unknown argument: $1"
        ;;
    esac
  done

  case "$MODE" in
    auto|docker|hybrid|native|terminals) ;;
    *) fail "Invalid --mode value: $MODE" ;;
  esac
}

resolve_mode() {
  if [[ "$MODE" != "auto" ]]; then
    return
  fi

  if docker_daemon_available; then
    MODE="docker"
  else
    MODE="terminals"
  fi

  log "Auto mode resolved to: $MODE"
}

run_docker_mode() {
  require_cmd docker
  require_cmd curl

  title "Axioma Runner - Docker Mode"
  log "Starting full Docker stack"
  (cd "$ROOT_DIR" && docker compose up -d --build)

  log "Waiting for service health endpoints"
  wait_http "http://localhost:8080/nginx-health" 90 2
  wait_http "http://localhost:4000/health/ready" 90 2

  log "Project is up"
  log "App URL: http://localhost:8080"
  log "Backend URL: http://localhost:4000"

  if [[ "$FOLLOW_LOGS" == "true" ]]; then
    log "Streaming Docker logs (Ctrl+C to stop)"
    (cd "$ROOT_DIR" && docker compose logs -f)
  else
    (cd "$ROOT_DIR" && docker compose ps)
  fi
}

check_native_services() {
  local db_url="${DATABASE_URL:-postgresql://axioma:axioma@localhost:5432/axioma?schema=public}"
  local redis_url="${REDIS_URL:-redis://localhost:6379}"

  title "Dependency Checks"

  if ! command_exists pg_isready; then
    fail "pg_isready not found. Install PostgreSQL client tools for native/terminals mode."
  fi

  if ! command_exists redis-cli; then
    fail "redis-cli not found. Install Redis tools for native/terminals mode."
  fi

  if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    fail "PostgreSQL is not reachable on localhost:5432. Start local DB or use --mode docker."
  fi

  if ! redis-cli -u "$redis_url" ping >/dev/null 2>&1; then
    fail "Redis is not reachable at $redis_url. Start local Redis or use --mode docker."
  fi

  log "PostgreSQL and Redis are reachable"
  log "DATABASE_URL=$db_url"
}

run_terminals_mode() {
  require_cmd bun
  require_cmd tmux

  title "Axioma Runner - Terminal TUI Mode"

  ensure_env_file
  check_native_services

  if [[ "$SKIP_INSTALL" != "true" ]]; then
    log "Installing dependencies"
    (cd "$ROOT_DIR" && bun install)
  fi

  setup_database

  if tmux has-session -t "$TMUX_SESSION_NAME" >/dev/null 2>&1; then
    fail "tmux session '$TMUX_SESSION_NAME' already exists. Close it or run: tmux kill-session -t $TMUX_SESSION_NAME"
  fi

  log "Creating tmux TUI session: $TMUX_SESSION_NAME"

  tmux new-session -d -s "$TMUX_SESSION_NAME" -n frontend "cd '$ROOT_DIR' && bun run dev:frontend"
  tmux new-window -t "$TMUX_SESSION_NAME" -n backend "cd '$ROOT_DIR' && bun run dev:backend"
  tmux new-window -t "$TMUX_SESSION_NAME" -n health "cd '$ROOT_DIR' && while true; do clear; echo 'Axioma Health Monitor'; echo '--------------------'; date; echo; pg_isready -h localhost -p 5432 || true; redis-cli -u \"\${REDIS_URL:-redis://localhost:6379}\" ping || true; echo; echo 'Frontend: http://localhost:3000'; echo 'Backend : http://localhost:4000'; sleep 3; done"

  log "Attaching tmux session (Ctrl+b then d to detach)"
  tmux attach-session -t "$TMUX_SESSION_NAME"
}

run_hybrid_mode() {
  require_cmd bun
  require_cmd docker

  trap cleanup EXIT INT TERM

  ensure_env_file

  if [[ "$SKIP_INSTALL" != "true" ]]; then
    log "Installing dependencies"
    (cd "$ROOT_DIR" && bun install)
  fi

  start_hybrid_data_services
  setup_database

  title "Axioma Runner - Hybrid Mode"
  log "Starting frontend + backend (native)"
  log "Frontend: http://localhost:3000"
  log "Backend: http://localhost:4000"
  (cd "$ROOT_DIR" && bun run dev)
}

run_native_mode() {
  require_cmd bun

  title "Axioma Runner - Native Mode"

  ensure_env_file
  check_native_services

  if [[ "$SKIP_INSTALL" != "true" ]]; then
    log "Installing dependencies"
    (cd "$ROOT_DIR" && bun install)
  fi

  setup_database

  log "Starting frontend + backend (native)"
  log "Ensure local PostgreSQL and Redis match .env values before running"
  log "Frontend: http://localhost:3000"
  log "Backend: http://localhost:4000"
  (cd "$ROOT_DIR" && bun run dev)
}

main() {
  parse_args "$@"
  resolve_mode

  case "$MODE" in
    docker)
      run_docker_mode
      ;;
    terminals)
      run_terminals_mode
      ;;
    hybrid)
      run_hybrid_mode
      ;;
    native)
      run_native_mode
      ;;
  esac
}

main "$@"
