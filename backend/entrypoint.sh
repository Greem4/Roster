#!/bin/sh
set -e
alembic upgrade head
if [ -n "${RX_DATABASE_URL:-}" ]; then
  python - <<'PY'
"""Создать БД roster_rx в том же Postgres, если ещё нет (первый деплой на Pi)."""
import os
from urllib.parse import urlparse

import psycopg2
from psycopg2 import sql

url = urlparse(os.environ["RX_DATABASE_URL"])
db_name = url.path.lstrip("/")
conn = psycopg2.connect(
    dbname="postgres",
    user=url.username,
    password=url.password,
    host=url.hostname,
    port=url.port or 5432,
)
conn.autocommit = True
with conn.cursor() as cur:
    cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (db_name,))
    if cur.fetchone() is None:
        cur.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(db_name)))
conn.close()
PY
  alembic -c alembic_rx/alembic.ini upgrade head
fi
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
