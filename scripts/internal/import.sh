#!/bin/sh
# УСТАРЕЛО: полная перезаливка из архивного medicines-invoices.json (TRUNCATE + INSERT).
# Не запускать, если список ведётся в БД и позиции удаляются вручную — вернёт удалённые.
# Для новых накладных: SELECT rx_import_medicines('…'::jsonb) — см. scripts/internal/data/README.md
set -e
. "$(dirname "$0")/_root.sh"
roster_load_env
. "$INTERNAL/_ssh-b3.sh"
. "$INTERNAL/_pi-route.sh"

LOCAL_PORT="${LOCAL_PORT:-5432}"
: "${DATABASE_URL:?В .env задайте DATABASE_URL}"

STARTED_TUNNEL=0
cleanup() {
  [ "$STARTED_TUNNEL" = 1 ] && kill "$TUNNEL_PID" 2>/dev/null || true
}
trap cleanup EXIT

if nc -z 127.0.0.1 "$LOCAL_PORT" 2>/dev/null; then
  echo "Порт ${LOCAL_PORT} уже открыт."
else
  pi_route_pick auto || exit 1
  echo "Туннель к БД (${PI_ROUTE_MODE})…"
  pi_ssh_port_forward "$LOCAL_PORT" bg
  TUNNEL_PID=$!
  STARTED_TUNNEL=1
  sleep 1
fi

exec python3 "$INTERNAL/import-medicines-invoices.py" --replace
