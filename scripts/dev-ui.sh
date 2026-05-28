#!/bin/sh
# Фронт на Mac (Vite), API на B3 — основной режим разработки UI.
# Деплой на сайт только когда готово: ./scripts/deploy-frontend.sh
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
. "$ROOT/scripts/_ssh-b3.sh"
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
  roster_ssh_ensure_master || exit 1
  echo "Туннель API: localhost:8000 → B3"
  roster_ssh -f -N -L 8000:127.0.0.1:8000 "$PI_SSH"
  sleep 1
fi

if ! curl -sf http://127.0.0.1:8000/health >/dev/null 2>&1; then
  echo "API на :8000 не отвечает. На B3: docker compose up -d api" >&2
  exit 1
fi

echo "http://localhost:5173 — правки React сразу; на сайт: ./scripts/deploy-frontend.sh"
cd "$ROOT/frontend"
[ -d node_modules ] || npm ci
exec npm run dev
