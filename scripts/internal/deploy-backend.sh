#!/bin/sh
# Деплой API на малинку: rsync backend + docker compose build api. Маршрут LAN/VPS — auto.
set -e
. "$(dirname "$0")/_root.sh"
roster_load_env
. "$INTERNAL/_ssh-b3.sh"
. "$INTERNAL/_pi-route.sh"

PI_PROJECT_DIR="${PI_PROJECT_DIR:-Roster}"
ROUTE_VIA=auto
SYNC_ENV=false
REMOTE_API="${ROSTER_REMOTE_API_URL}"

usage() {
  cat <<EOF
Деплой backend на малинку (Pi).

  ./scripts/deploy.sh --backend           только API
  ./scripts/deploy.sh --backend --with-env   скопировать .env (OAuth, JWT…)

Снаружи то же: `./scripts/deploy-backend.sh`

EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --via)
      ROUTE_VIA="${2:?lan|vps|auto}"
      shift 2
      ;;
    --via=*) ROUTE_VIA="${1#*=}"; shift ;;
    --with-env) SYNC_ENV=true; shift ;;
    -h|--help) usage; exit 0 ;;
    *)
      echo "Неизвестный аргумент: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

pi_route_pick "$ROUTE_VIA" || exit 1

echo "=== Деплой API (${PI_ROUTE_MODE}: ${PI_ROUTE_TARGET}) ==="

echo "→ server/docker-compose.yml, caddy/Caddyfile"
pi_rsync -avz "$ROOT/server/docker-compose.yml" "${PI_ROUTE_TARGET}:~/server/docker-compose.yml"
pi_rsync -avz "$ROOT/server/caddy/Caddyfile" "${PI_ROUTE_TARGET}:~/server/caddy/Caddyfile"

if pi_ssh "[ ! -d ~/${PI_PROJECT_DIR} ] && [ -d ~/RosterRx ]"; then
  echo "=== Миграция RosterRx → Roster на Pi ==="
  pi_rsync -avz "$INTERNAL/migrate-pi-roster-name.sh" "${PI_ROUTE_TARGET}:/tmp/migrate-pi-roster-name.sh"
  pi_ssh "sh /tmp/migrate-pi-roster-name.sh"
fi

echo "→ backend/"
pi_rsync -avz \
  --exclude '.venv' \
  --exclude '__pycache__' \
  --exclude '*.pyc' \
  --exclude '.pytest_cache' \
  "$ROOT/backend/" "${PI_ROUTE_TARGET}:~/${PI_PROJECT_DIR}/backend/"

echo "→ docker-compose.yml"
pi_rsync -avz "$ROOT/docker-compose.yml" "${PI_ROUTE_TARGET}:~/${PI_PROJECT_DIR}/docker-compose.yml"

if [ "$SYNC_ENV" = true ]; then
  if [ ! -f "$ROOT/.env" ]; then
    echo "Нет $ROOT/.env" >&2
    exit 1
  fi
  echo "→ .env"
  pi_rsync -avz "$ROOT/.env" "${PI_ROUTE_TARGET}:~/${PI_PROJECT_DIR}/.env"
fi

echo "=== Пересборка api ==="
pi_ssh "cd ~/${PI_PROJECT_DIR} && docker compose up -d --build api"

echo "Ожидание API на Pi…"
i=0
while [ "$i" -lt 60 ]; do
  if pi_ssh "curl -sf http://127.0.0.1:8000/health" >/dev/null 2>&1; then
    pi_ssh "curl -sf http://127.0.0.1:8000/health && echo"
    break
  fi
  sleep 1
  i=$((i + 1))
done
if [ "$i" -ge 60 ]; then
  echo "API не ответил за 60 с." >&2
  exit 1
fi

echo "=== Перенос medicines → roster_rx (если пусто) ==="
pi_ssh "cd ~/${PI_PROJECT_DIR} && sh -s" <<'REMOTE'
set -e
# shellcheck disable=SC1091
[ -f .env ] && . ./.env
PU="${POSTGRES_USER:-roster}"
RX="${RX_POSTGRES_DB:-roster_rx}"
DEST="$(docker compose exec -T db psql -U "$PU" -d "$RX" -t -A -c 'SELECT COUNT(*) FROM medicines' 2>/dev/null || echo no_table)"
if [ "$DEST" = "no_table" ]; then
  echo "Таблица medicines в $RX ещё не создана — пропуск"
  exit 0
fi
SRC="$(docker compose exec -T db psql -U "$PU" -d roster -t -A -c 'SELECT COUNT(*) FROM medicines')"
if [ "$DEST" = "0" ] && [ "$SRC" -gt 0 ]; then
  docker compose exec -T db pg_dump -U "$PU" -d roster -t medicines --data-only \
    | docker compose exec -T db psql -U "$PU" -d "$RX" -q
  echo "Перенесено $SRC позиций в $RX"
else
  echo "В $RX уже $DEST записей (roster: $SRC) — пропуск"
fi
REMOTE

echo ""
if curl -sf "${REMOTE_API}/api/health" >/dev/null 2>&1; then
  echo "Прод: $(curl -sf "${REMOTE_API}/api/health")"
else
  echo "Прод пока не отвечает: ${REMOTE_API}/api/health"
fi

yandex_code=$(curl -sI -o /dev/null -w '%{http_code}' \
  "${REMOTE_API}/api/auth/yandex/start?return_to=${REMOTE_API}" 2>/dev/null || echo "000")
case "$yandex_code" in
  302|307) echo "Яндекс OAuth: OK" ;;
  503) echo "Яндекс OAuth: задайте YANDEX_* в .env и --with-env" ;;
  404) echo "Яндекс OAuth: 404 (старый код на Pi?)" ;;
esac

echo "Готово."
