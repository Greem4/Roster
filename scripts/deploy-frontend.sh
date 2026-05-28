#!/bin/sh
# Сборка React и выкладка на B3 (Caddy: ~/server/www)
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PI_SSH="${PI_SSH:-greem4@192.168.31.96}"
WEB_ROOT="${WEB_ROOT:-server/www}"

cd "$ROOT/frontend"
echo "Сборка frontend…"
npm ci
npm run build

echo "Копирование dist/ -> ${PI_SSH}:~/${WEB_ROOT}/"
rsync -avz --delete dist/ "${PI_SSH}:${WEB_ROOT}/"

echo "Готово. Проверка: curl -s http://192.168.31.96/api/health"
