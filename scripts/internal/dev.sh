#!/bin/sh
# Локальная разработка: Docker (db + api) + UI (Vite). Одна команда.
set -e
. "$(dirname "$0")/_root.sh"
roster_load_env
. "$INTERNAL/_docker-local.sh"

port_open() {
  nc -z 127.0.0.1 "$1" 2>/dev/null
}

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
  . "$INTERNAL/_ssh-b3.sh"
  . "$INTERNAL/_pi-route.sh"

  if ! port_open 8000; then
    if pi_lan_reachable; then
      roster_ssh_ensure_master || exit 1
      echo "Туннель API: localhost:8000 → Pi"
      roster_ssh -f -N -L 8000:127.0.0.1:8000 "$PI_SSH"
      sleep 1
    elif remote_api_ok; then
      echo "Pi недоступна — API с прода (${ROSTER_REMOTE_API_URL})"
      echo "API: ${ROSTER_REMOTE_API_HEALTH} — OK"
      run_dev_frontend_remote
    else
      echo "Нет локального Docker. Проверьте .env и Docker Desktop." >&2
      echo "Первый раз: ./scripts/internal/sync-db-from-pi.sh" >&2
      exit 1
    fi
  fi

  if ! roster_docker_local_api_ok; then
    if remote_api_ok; then
      echo "Туннель :8000 не отвечает — переключаюсь на prod API"
      run_dev_frontend_remote
    fi
    echo "API на :8000 не отвечает." >&2
    exit 1
  fi

  echo "API: localhost:8000 (туннель с Pi)"
fi

. "$INTERNAL/_lan-ip.sh"
echo "Mac:    http://localhost:5173"
if lan=$(roster_lan_ip); then
  echo "Телефон (та же Wi‑Fi): http://${lan}:5173"
fi
echo "На Pi после push: GitHub Actions (см. README)"
frontend_npm_ci_if_needed
exec npm run dev
