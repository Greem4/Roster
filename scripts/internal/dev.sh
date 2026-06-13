#!/bin/sh
# Локальная разработка: Docker (db + api) + Vite на Mac. Без Pi и без prod API.
set -e
. "$(dirname "$0")/_root.sh"
roster_load_env
. "$INTERNAL/_docker-local.sh"

ensure_local_stack() {
  if roster_docker_local_api_ok && roster_docker_local_api_running; then
    echo "API: локальный Docker :8000"
    return 0
  fi

  if roster_docker_local_api_ok; then
    echo "API: localhost:8000"
    return 0
  fi

  if command -v docker >/dev/null 2>&1 && [ -f "$ROOT/docker-compose.yml" ] && [ -f "$ROOT/.env" ]; then
    echo "Поднимаю локальный Docker (db + api)…"
    if "$INTERNAL/_dev-stack-up.sh"; then
      echo "API: локальный Docker :8000"
      return 0
    fi
    echo "Локальный Docker не поднялся." >&2
  fi

  return 1
}

if ! ensure_local_stack; then
  echo "Нужны Docker Desktop и .env в корне проекта." >&2
  echo "Первый раз:" >&2
  echo "  cp .env.example .env" >&2
  echo "  ./scripts/internal/sync-db-from-pi.sh" >&2
  exit 1
fi

. "$INTERNAL/_lan-ip.sh"
echo "Mac:    http://localhost:5173"
if lan=$(roster_lan_ip); then
  echo "Телефон (та же Wi‑Fi): http://${lan}:5173"
fi
echo "На Pi:  ./scripts/deploy.sh"
cd "$ROOT/frontend"
frontend_npm_ci_if_needed
exec npm run dev
