#!/bin/sh
# Деплой кода на Pi: backend + frontend. Для CI после git push в release.
set -e
. "$(dirname "$0")/_root.sh"

VIA_ARGS=""
while [ $# -gt 0 ]; do
  case "$1" in
    --via)
      VIA_ARGS="--via $2"
      shift 2
      ;;
    --via=*) VIA_ARGS="$1"; shift ;;
    -h|--help)
      cat <<EOF
Выкладка кода на Pi (БД на малинке не трогаем — только миграции Alembic).

  ./scripts/internal/ci-deploy.sh
  ./scripts/internal/ci-deploy.sh --via vps-hop

EOF
      exit 0
      ;;
    *)
      echo "Неизвестный аргумент: $1" >&2
      exit 1
      ;;
  esac
done

# shellcheck disable=SC2086
"$INTERNAL/deploy-backend.sh" $VIA_ARGS
# shellcheck disable=SC2086
"$INTERNAL/deploy-frontend.sh" $VIA_ARGS

echo "Деплой на Pi завершён."
