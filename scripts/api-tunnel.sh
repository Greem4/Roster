#!/usr/sh
# Проброс API с B3 на localhost:8000 (для npm run dev).
set -e
PI_SSH="${PI_SSH:-greem4@192.168.31.96}"
echo "Туннель API: localhost:8000 -> B3"
echo "Подключение: ${PI_SSH} (Ctrl+C для остановки)"
exec ssh -N -L 8000:127.0.0.1:8000 "$PI_SSH"
