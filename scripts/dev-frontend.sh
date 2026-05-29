#!/bin/sh
# Только Vite (API на :8000 уже должен быть). Удобнее: ./scripts/dev-ui.sh
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/frontend"
if ! curl -sf http://127.0.0.1:8000/health >/dev/null 2>&1; then
  echo "Ошибка: API недоступен на http://127.0.0.1:8000"
  echo "Для разработки с backend:  ./scripts/dev-local.sh"
  echo "Только UI + API на B3:      ./scripts/api-tunnel.sh  (в другом терминале), затем снова этот скрипт"
  exit 1
fi
. "$ROOT/scripts/_lan-ip.sh"
echo "Mac: http://localhost:5173"
if lan=$(roster_lan_ip); then
  echo "Телефон (та же Wi‑Fi): http://${lan}:5173"
fi
echo "Вход: учётная запись с правами админа — правки лекарств; обычная — только просмотр"
exec npm run dev
