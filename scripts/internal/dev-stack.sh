#!/bin/sh
# Локальный Docker: управление стеком (up встроен в dev.sh).
set -e
. "$(dirname "$0")/_root.sh"
roster_load_env
. "$INTERNAL/_docker-local.sh"

usage() {
  cat <<EOF
Локальный бэкенд (docker compose: db + api).
Для разработки достаточно: ./scripts/dev.sh

  ./scripts/internal/dev-stack.sh up       поднять стек вручную
  ./scripts/internal/dev-stack.sh down     остановить (том pgdata сохраняется)
  ./scripts/internal/dev-stack.sh stop     stop без удаления контейнеров
  ./scripts/internal/dev-stack.sh status   состояние и /health

EOF
}

cmd="${1:-up}"
roster_docker_local_require_env
roster_docker_local_cd

case "$cmd" in
  up)
    "$INTERNAL/_dev-stack-up.sh"
    echo "Готово. UI: ./scripts/dev.sh"
    ;;
  down)
    docker compose down
    echo "Стек остановлен (том roster_pgdata сохранён)."
    ;;
  stop)
    docker compose stop
    echo "Контейнеры остановлены."
    ;;
  status)
    docker compose ps
    if roster_docker_local_api_ok; then
      curl -sf http://127.0.0.1:8000/health && echo
    else
      echo "API :8000 не отвечает." >&2
      exit 1
    fi
    ;;
  -h|--help)
    usage
    ;;
  *)
    echo "Неизвестная команда: $cmd" >&2
    usage >&2
    exit 1
    ;;
esac
