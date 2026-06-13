#!/bin/sh
set -e
alembic upgrade head
if [ -n "${RX_DATABASE_URL:-}" ]; then
  alembic -c alembic_rx/alembic.ini upgrade head
fi
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
