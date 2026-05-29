#!/bin/sh
# Проброс PostgreSQL с B3 на localhost:5432 (держите терминал открытым).
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
. "$ROOT/scripts/_ssh-b3.sh"
[ -f "$ROOT/.env" ] && . "$ROOT/.env"
LOCAL_PORT="${LOCAL_PORT:-5432}"
REMOTE_PORT="${REMOTE_PORT:-5432}"

roster_ssh_ensure_master
echo "Туннель: localhost:${LOCAL_PORT} -> B3 postgres (127.0.0.1:${REMOTE_PORT})"
echo "Подключение: ${PI_SSH} (Ctrl+C — выход)"
roster_ssh -N -L "${LOCAL_PORT}:127.0.0.1:${REMOTE_PORT}" "$PI_SSH"
