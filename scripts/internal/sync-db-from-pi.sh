#!/bin/sh
# Полный дамп PostgreSQL с Pi → восстановление в локальный docker compose db.
set -e
. "$(dirname "$0")/_root.sh"
roster_load_env
. "$INTERNAL/_ssh-b3.sh"
. "$INTERNAL/_pi-route.sh"
. "$INTERNAL/_docker-local.sh"

PI_PROJECT_DIR="${PI_PROJECT_DIR:-Roster}"
ROUTE_VIA=auto

usage() {
  cat <<EOF
Скачать БД с Pi и восстановить локально.

  ./scripts/internal/sync-db-from-pi.sh
  ./scripts/internal/sync-db-from-pi.sh --via lan

Нужны те же POSTGRES_PASSWORD и JWT_SECRET в .env, что на Pi.

EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
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

roster_docker_local_require_env

BACKUP_DIR="$ROOT/.local/backups"
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/roster-$(date +%Y%m%d-%H%M%S).sql"

pi_route_pick "$ROUTE_VIA" || exit 1

echo "=== Дамп с Pi (${PI_ROUTE_MODE}: ${PI_ROUTE_TARGET}) ==="
pi_ssh "cd ~/${PI_PROJECT_DIR} && docker compose exec -T db pg_dump --clean --if-exists -U ${POSTGRES_USER} ${POSTGRES_DB}" > "$BACKUP_FILE"
bytes=$(wc -c < "$BACKUP_FILE" | tr -d ' ')
echo "Сохранено: $BACKUP_FILE ($bytes байт)"

if [ "$bytes" -lt 100 ]; then
  echo "Дамп слишком маленький — проверьте SSH и docker compose на Pi." >&2
  exit 1
fi

roster_docker_local_cd
echo "=== Локальный PostgreSQL ==="
docker compose up -d db
roster_docker_local_wait_db

echo "=== Остановка api (если запущен) ==="
docker compose stop api 2>/dev/null || true

echo "=== Восстановление дампа ==="
db_cid=$(docker compose ps db -q)
docker cp "$BACKUP_FILE" "${db_cid}:/tmp/restore.sql"
docker compose exec -T db psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /tmp/restore.sql

echo "=== Запуск api ==="
docker compose up -d --build api
roster_docker_local_wait_api
curl -sf http://127.0.0.1:8000/health && echo
echo "Данные с Pi перенесены в локальную БД."
