#!/bin/sh
# CI: деплой на Pi (вызов общего deploy.sh).
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
      echo "CI-обёртка: ./scripts/internal/deploy.sh $VIA_ARGS"
      exit 0
      ;;
    *)
      echo "Неизвестный аргумент: $1" >&2
      exit 1
      ;;
  esac
done

# shellcheck disable=SC2086
exec "$INTERNAL/deploy.sh" $VIA_ARGS
