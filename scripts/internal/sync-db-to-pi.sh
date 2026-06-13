#!/bin/sh
# Локальный дамп PostgreSQL → восстановление на Pi (перезаписывает БД на малинке).
set -e
. "$(dirname "$0")/_root.sh"
roster_load_env
. "$INTERNAL/_ssh-b3.sh"
. "$INTERNAL/_pi-route.sh"
. "$INTERNAL/_docker-local.sh"

PI_PROJECT_DIR="${PI_PROJECT_DIR:-Roster}"
ROUTE_VIA=auto
CONFIRM=false

usage() {
  cat <<EOF
Залить локальную БД на Pi (осторожно: данные на малинке будут заменены).

  ./scripts/internal/sync-db-to-pi.sh --confirm

EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --confirm) CONFIRM=true; shift ;;
    --via)
      ROUTE_VIA="${2:?lan|vps|auto}"
      shift 2
      ;;
    --via=*) ROUTE_VIA="${1#*=}"; shift ;;
    -h|--help) usage; exit 0 ;;
    *)
      echo "Неизвестный аргумент: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [ "$CONFIRM" != true ]; then
  echo "Нужен флаг --confirm (перезапишет БД на Pi)." >&2
  usage >&2
  exit 1
fi

roster_docker_local_require_env
roster_docker_local_cd

if ! roster_docker_local_wait_db 2>/dev/null; then
  docker compose up -d db
  roster_docker_local_wait_db
fi

BACKUP_DIR="$ROOT/.local/backups"
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/roster-local-$(date +%Y%m%d-%H%M%S).sql"

echo "=== Дамп локальной БД ==="
docker compose exec -T db pg_dump --clean --if-exists -U "$POSTGRES_USER" "$POSTGRES_DB" > "$BACKUP_FILE"
bytes=$(wc -c < "$BACKUP_FILE" | tr -d ' ')
echo "Сохранено: $BACKUP_FILE ($bytes байт)"

pi_route_pick "$ROUTE_VIA" || exit 1

echo "=== Восстановление на Pi (${PI_ROUTE_MODE}) ==="
pi_ssh "cd ~/${PI_PROJECT_DIR} && docker compose stop api"
pi_ssh "cd ~/${PI_PROJECT_DIR} && docker compose exec -T db psql -v ON_ERROR_STOP=1 -U ${POSTGRES_USER} -d ${POSTGRES_DB}" < "$BACKUP_FILE"
pi_ssh "cd ~/${PI_PROJECT_DIR} && docker compose up -d api"

echo "Ожидание API на Pi…"
i=0
while [ $i -lt 60 ]; do
  if pi_ssh "curl -sf http://127.0.0.1:8000/health" >/dev/null 2>&1; then
    pi_ssh "curl -sf http://127.0.0.1:8000/health && echo"
    echo "Локальная БД залита на Pi."
    exit 0
  fi
  sleep 1
  i=$((i + 1))
done

echo "API на Pi не ответил за 60 с." >&2
exit 1
