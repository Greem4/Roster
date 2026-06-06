#!/bin/sh
# Локальный UI (Vite). Дома — API с Pi по туннелю, вне дома — prod API. Маршрут сам.
set -e
. "$(dirname "$0")/_root.sh"
roster_load_env
. "$INTERNAL/_ssh-b3.sh"
. "$INTERNAL/_pi-route.sh"

port_open() {
  nc -z 127.0.0.1 "$1" 2>/dev/null
}

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
    echo "Pi (${PI_SSH}) недоступна и prod API не отвечает." >&2
    exit 1
  fi
fi

if ! curl -sf http://127.0.0.1:8000/health >/dev/null 2>&1; then
  if remote_api_ok; then
    echo "Туннель :8000 не отвечает — переключаюсь на prod API"
    run_dev_frontend_remote
  fi
  echo "API на :8000 не отвечает." >&2
  exit 1
fi

. "$INTERNAL/_lan-ip.sh"
echo "Mac:    http://localhost:5173"
if lan=$(roster_lan_ip); then
  echo "Телефон (та же Wi‑Fi): http://${lan}:5173"
fi
echo "На сайт: ./scripts/deploy-frontend.sh"
frontend_npm_ci_if_needed
exec npm run dev
