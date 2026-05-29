#!/bin/sh
# Полная перезаливка medicines из scripts/data/medicines-invoices.json (TRUNCATE + INSERT).
# Одна команда с Mac: ./scripts/reload-medicines.sh
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
. "$ROOT/scripts/_ssh-b3.sh"
[ -f "$ROOT/.env" ] && . "$ROOT/.env"

LOCAL_PORT="${LOCAL_PORT:-5432}"
: "${DATABASE_URL:?В .env задайте DATABASE_URL (127.0.0.1:5432, пароль как на B3)}"

roster_ssh_ensure_master

STARTED_TUNNEL=0
cleanup() {
  [ "$STARTED_TUNNEL" = 1 ] && roster_ssh -S "$ROSTER_SSH_SOCKET" -O cancel "$PI_SSH" 2>/dev/null || true
}
trap cleanup EXIT

if command -v nc >/dev/null 2>&1 && nc -z 127.0.0.1 "$LOCAL_PORT" 2>/dev/null; then
  echo "Порт ${LOCAL_PORT} уже открыт (туннель, видимо, уже есть)."
else
  echo "Туннель к БД на B3…"
  roster_ssh -f -N -L "${LOCAL_PORT}:127.0.0.1:5432" "$PI_SSH"
  STARTED_TUNNEL=1
  sleep 1
fi

python3 "$ROOT/scripts/import-medicines-invoices.py" --replace
