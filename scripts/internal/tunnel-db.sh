#!/bin/sh
# Туннель PostgreSQL: localhost:5432 → Pi (LAN или VPS hop). Процесс в foreground.
set -e
. "$(dirname "$0")/_root.sh"
roster_load_env
. "$INTERNAL/_ssh-b3.sh"
. "$INTERNAL/_pi-route.sh"

LOCAL_PORT="${LOCAL_PORT:-5432}"

if nc -z 127.0.0.1 "$LOCAL_PORT" 2>/dev/null; then
  echo "Порт ${LOCAL_PORT} уже занят (туннель или локальный postgres)."
  echo "DATABASE_URL в .env → 127.0.0.1:${LOCAL_PORT}"
  exit 0
fi

pi_route_pick auto || exit 1
echo "Туннель БД (${PI_ROUTE_MODE}): 127.0.0.1:${LOCAL_PORT} → Pi:5432"
echo "Остановка: Ctrl+C"
echo "DATABASE_URL=postgresql://\${POSTGRES_USER}:\${POSTGRES_PASSWORD}@127.0.0.1:${LOCAL_PORT}/\${POSTGRES_DB}"
pi_ssh_port_forward "$LOCAL_PORT"
