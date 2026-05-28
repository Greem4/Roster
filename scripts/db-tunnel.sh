#!/usr/sh
# Проброс PostgreSQL с B3 на localhost:5432 (держите терминал открытым).
set -e
PI_SSH="${PI_SSH:-greem4@192.168.31.96}"
LOCAL_PORT="${LOCAL_PORT:-5432}"
REMOTE_PORT="${REMOTE_PORT:-5432}"

echo "Туннель: localhost:${LOCAL_PORT} -> B3 postgres (127.0.0.1:${REMOTE_PORT})"
echo "Подключение: ${PI_SSH}"
echo "Остановка: Ctrl+C"
exec ssh -N -L "${LOCAL_PORT}:127.0.0.1:${REMOTE_PORT}" "$PI_SSH"
