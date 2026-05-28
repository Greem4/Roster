#!/bin/sh
# Локальная разработка с СВОИМ API на Mac (изменения backend видны сразу).
# БД — та же на B3, через SSH-туннель :5432.
#
# Не запускайте одновременно api-tunnel.sh — он занимает :8000 продовым API.
#
#   ./scripts/dev-local.sh
#
# Первый раз: скопируйте .env.example → .env и раскомментируйте DATABASE_URL.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
. "$ROOT/scripts/_ssh-b3.sh"
if [ -f "$ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$ROOT/.env"
  set +a
fi
PYTHON="${PYTHON:-python3.12}"

OWN_TUNNEL_PID=""
API_PID=""

cleanup() {
  if [ -n "$API_PID" ]; then
    kill "$API_PID" 2>/dev/null || true
    wait "$API_PID" 2>/dev/null || true
  fi
  if [ -n "$OWN_TUNNEL_PID" ]; then
    kill "$OWN_TUNNEL_PID" 2>/dev/null || true
  fi
}
trap cleanup INT TERM EXIT

port_open() {
  nc -z 127.0.0.1 "$1" 2>/dev/null
}

ensure_env() {
  if [ ! -f "$ROOT/.env" ]; then
    echo "Нет файла .env — скопируйте шаблон:" >&2
    echo "  cp .env.example .env" >&2
    echo "Раскомментируйте строку DATABASE_URL (пароль как на B3)." >&2
    exit 1
  fi
  # shellcheck disable=SC1091
  set -a
  . "$ROOT/.env"
  set +a
  if [ -z "${DATABASE_URL:-}" ]; then
    echo "В .env задайте DATABASE_URL, например:" >&2
    echo "  DATABASE_URL=postgresql://roster:ПАРОЛЬ@127.0.0.1:5432/roster" >&2
    exit 1
  fi
}

ensure_db_tunnel() {
  if port_open 5432; then
    echo "PostgreSQL: localhost:5432 (туннель уже открыт)"
    return
  fi
  roster_ssh_ensure_master || exit 1
  echo "Туннель к БД на B3…"
  roster_ssh -f -N -L "5432:127.0.0.1:5432" "$PI_SSH"
  sleep 1
  if ! port_open 5432; then
    echo "Не удалось подключиться к :5432. Проверьте SSH: $PI_SSH" >&2
    exit 1
  fi
  OWN_TUNNEL_PID=$(pgrep -f "ssh.*5432:127.0.0.1:5432" 2>/dev/null | head -1 || true)
  echo "Туннель к БД запущен (остановится при Ctrl+C)"
}

ensure_api_port_free() {
  if ! port_open 8000; then
    return
  fi
  echo "" >&2
  echo "Порт 8000 уже занят." >&2
  echo "Если запущен ./scripts/api-tunnel.sh — остановите его (Ctrl+C)." >&2
  echo "Для разработки backend нужен локальный API на :8000, не туннель к B3." >&2
  echo "" >&2
  echo "Либо только фронт без своего API: api-tunnel + dev-frontend (правки Python не проверятся)." >&2
  exit 1
}

start_local_api() {
  if ! command -v "$PYTHON" >/dev/null 2>&1; then
    PYTHON=python3
  fi
  cd "$ROOT/backend"
  if [ ! -d .venv ]; then
    echo "Создание venv ($PYTHON)…"
    "$PYTHON" -m venv .venv
    .venv/bin/pip install -r requirements.txt
  fi
  echo "Миграции и локальный API (hot-reload)…"
  .venv/bin/alembic upgrade head
  .venv/bin/uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 &
  API_PID=$!
  cd "$ROOT"

  i=0
  while [ "$i" -lt 30 ]; do
    if curl -sf http://127.0.0.1:8000/health >/dev/null 2>&1; then
      echo "API: http://127.0.0.1:8000/health — OK (ваш код с Mac)"
      return
    fi
    sleep 0.5
    i=$((i + 1))
  done
  echo "API не ответил за 15 с. Смотрите вывод uvicorn выше." >&2
  exit 1
}

usage() {
  cat <<'EOF'
Локальный стек: туннель к БД на B3 + API на Mac + Vite.

  ./scripts/dev-local.sh          всё в одном терминале
  ./scripts/dev-local.sh --check  только проверка .env, БД и health

SSH без пароля (один раз): ./scripts/setup-ssh-key.sh

Перед деплоем: убедитесь здесь, затем ./scripts/deploy-all.sh
EOF
}

case "${1:-}" in
  -h|--help) usage; exit 0 ;;
  --check)
    ensure_env
    ensure_db_tunnel
    ensure_api_port_free
    start_local_api
    cleanup
    trap - INT TERM EXIT
    echo "Проверка пройдена."
    exit 0
    ;;
  "") ;;
  *)
    echo "Неизвестный аргумент: $1" >&2
    usage >&2
    exit 1
    ;;
esac

ensure_env
ensure_api_port_free
ensure_db_tunnel
start_local_api

echo ""
echo "Откройте http://localhost:5173"
echo "Остановка: Ctrl+C"
echo ""

cd "$ROOT/frontend"
if [ ! -d node_modules ]; then
  npm ci
fi
exec npm run dev
