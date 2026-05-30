#!/bin/sh
# Фронт на Mac (Vite), API на B3 — основной режим разработки UI.
# Вне дома Pi в LAN недоступна → автоматически prod API (см. dev-away.sh).
# Деплой на сайт только когда готово: ./scripts/deploy-frontend.sh
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
. "$ROOT/scripts/_ssh-b3.sh"
. "$ROOT/scripts/_dev-remote.sh"
if [ -f "$ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$ROOT/.env"
  set +a
fi

port_open() {
  nc -z 127.0.0.1 "$1" 2>/dev/null
}

if ! port_open 8000; then
  if pi_ssh_reachable; then
    roster_ssh_ensure_master || exit 1
    echo "Туннель API: localhost:8000 → B3"
    roster_ssh -f -N -L 8000:127.0.0.1:8000 "$PI_SSH"
    sleep 1
  elif remote_api_ok; then
    echo "Pi в LAN недоступна — режим вне дома (API через интернет)"
    echo "API: ${ROSTER_REMOTE_API_HEALTH} — OK"
    run_dev_frontend_remote
  else
    echo "Pi (${PI_SSH}) недоступна и прод API не отвечает." >&2
    echo "  Дома: ./scripts/dev-ui.sh" >&2
    echo "  Вне дома: ./scripts/dev-away.sh (нужен интернет и ${ROSTER_REMOTE_API_URL})" >&2
    exit 1
  fi
fi

if ! curl -sf http://127.0.0.1:8000/health >/dev/null 2>&1; then
  if remote_api_ok; then
    echo "Туннель :8000 не отвечает — переключаюсь на prod API"
    run_dev_frontend_remote
  fi
  echo "API на :8000 не отвечает. На B3: docker compose up -d api" >&2
  exit 1
fi

. "$ROOT/scripts/_lan-ip.sh"
echo "Mac:    http://localhost:5173"
if lan=$(roster_lan_ip); then
  echo "Телефон (та же Wi‑Fi): http://${lan}:5173"
else
  echo "Телефон: подключите Mac к Wi‑Fi — покажем http://<IP>:5173 после перезапуска"
fi
echo "На сайт: ./scripts/deploy-frontend.sh"
cd "$ROOT/frontend"
[ -d node_modules ] || npm ci
exec npm run dev
