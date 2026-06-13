#!/bin/sh
# Поднять локальный Docker (db + api). Вызывается из dev.sh и dev-stack.sh.
set -e
. "$(dirname "$0")/_root.sh"
roster_load_env
. "$INTERNAL/_docker-local.sh"

roster_docker_local_require_env
roster_docker_local_cd

echo "=== Локальный стек: db + api ==="
docker compose up -d db
roster_docker_local_wait_db
docker compose up -d --build api
roster_docker_local_wait_api
curl -sf http://127.0.0.1:8000/health && echo
