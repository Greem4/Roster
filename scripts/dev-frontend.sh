#!/usr/sh
# Локальный React; API на B3 — сначала в другом терминале: ./scripts/api-tunnel.sh
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/frontend"
if ! curl -sf http://127.0.0.1:8000/health >/dev/null 2>&1; then
  echo "Ошибка: API недоступен на http://127.0.0.1:8000"
  echo "Запустите в другом терминале: ./scripts/api-tunnel.sh"
  echo "(на B3 должен работать: docker compose up -d api)"
  exit 1
fi
echo "Откройте http://localhost:5173"
echo "Логин: admin / admin"
exec npm run dev
