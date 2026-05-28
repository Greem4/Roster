#!/usr/sh
# API на Mac без Docker (нужен открытый db-tunnel.sh и venv).
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/backend"

if [ ! -d .venv ]; then
  python3 -m venv .venv
  .venv/bin/pip install -r requirements.txt
fi

if [ -f "$ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$ROOT/.env"
  set +a
fi

: "${DATABASE_URL:?Задайте DATABASE_URL в .env (127.0.0.1:5432 через туннель)}"

.venv/bin/alembic upgrade head
exec .venv/bin/uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
