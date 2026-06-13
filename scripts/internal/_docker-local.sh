# Локальный docker compose (db + api на Mac). Подключать после _root.sh и roster_load_env.

POSTGRES_USER="${POSTGRES_USER:-roster}"
POSTGRES_DB="${POSTGRES_DB:-roster}"

roster_docker_local_require_env() {
  : "${POSTGRES_PASSWORD:?Задайте POSTGRES_PASSWORD в .env (скопируйте с Pi)}"
}

roster_docker_local_cd() {
  cd "$ROOT"
}

roster_docker_local_wait_db() {
  i=0
  while [ $i -lt 60 ]; do
    if docker compose exec -T db pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
    i=$((i + 1))
  done
  echo "PostgreSQL не поднялась за 60 с." >&2
  return 1
}

roster_docker_local_wait_api() {
  i=0
  while [ $i -lt 90 ]; do
    if curl -sf http://127.0.0.1:8000/health >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
    i=$((i + 1))
  done
  echo "API не ответил за 90 с." >&2
  return 1
}

roster_docker_local_api_running() {
  roster_docker_local_cd
  docker compose ps api --status running -q 2>/dev/null | grep -q .
}

roster_docker_local_api_ok() {
  curl -sf http://127.0.0.1:8000/health >/dev/null 2>&1
}
