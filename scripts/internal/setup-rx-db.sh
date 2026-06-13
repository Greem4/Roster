#!/bin/sh
# Локально: БД roster_rx в том же Postgres + схема RX + заливка medicines-live.json.
set -e
. "$(dirname "$0")/_root.sh"
roster_load_env
. "$INTERNAL/_docker-local.sh"

roster_docker_local_require_env
roster_docker_local_cd

POSTGRES_USER="${POSTGRES_USER:-roster}"
POSTGRES_DB="${POSTGRES_DB:-roster}"
RX_DB="${RX_POSTGRES_DB:-roster_rx}"
LIVE_JSON="$INTERNAL/data/medicines-live.json"

echo "=== PostgreSQL (Docker) ==="
docker compose up -d db
roster_docker_local_wait_db

docker compose exec -T db psql -U "$POSTGRES_USER" -d postgres -v ON_ERROR_STOP=1 <<EOF
SELECT format('CREATE DATABASE %I OWNER %I', '${RX_DB}', '${POSTGRES_USER}')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = '${RX_DB}') \\gexec
EOF

echo "=== Образ api (без ожидания entrypoint) ==="
docker compose build api

echo "=== Миграции alembic_rx → ${RX_DB} ==="
docker compose run --rm --no-deps --entrypoint alembic api -c alembic_rx/alembic.ini upgrade head

if [ ! -f "$LIVE_JSON" ]; then
  echo "Нет $LIVE_JSON — сначала: python3 scripts/internal/export-medicines-from-pi.py" >&2
  exit 1
fi

echo "=== Заливка ${LIVE_JSON} ==="
export RX_DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@127.0.0.1:5432/${RX_DB}"
python3 "$INTERNAL/import-medicines-live.py"

COUNT="$(docker compose exec -T db psql -U "$POSTGRES_USER" -d "$RX_DB" -t -A -c 'SELECT COUNT(*) FROM medicines;')"
echo "В ${RX_DB}.medicines: ${COUNT} записей"
echo ""
echo "Дальше: docker compose up -d api  &&  ./scripts/dev.sh"
echo "RX_DATABASE_URL=postgresql://${POSTGRES_USER}:****@127.0.0.1:5432/${RX_DB}"
