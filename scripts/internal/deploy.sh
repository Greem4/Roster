#!/bin/sh
# Выкладка локального кода на Raspberry Pi: backend + frontend (по умолчанию оба).
set -e
. "$(dirname "$0")/_root.sh"

DO_BACKEND=true
DO_FRONTEND=true
ROUTE_VIA=auto
SYNC_ENV=false
START_DEV=false

usage() {
  cat <<EOF
Деплой с Mac на малинку (LAN или VPS — auto).

  ./scripts/deploy.sh                 backend + frontend
  ./scripts/deploy.sh --backend       только API
  ./scripts/deploy.sh --frontend      только сайт
  ./scripts/deploy.sh --with-env      скопировать .env на Pi (OAuth, JWT…)
  ./scripts/deploy.sh --via lan         принудительно домашняя Wi‑Fi

После деплоя: https://medicine.greemlab.ru

EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --backend)
      DO_BACKEND=true
      DO_FRONTEND=false
      shift
      ;;
    --frontend)
      DO_BACKEND=false
      DO_FRONTEND=true
      shift
      ;;
    --via)
      ROUTE_VIA="${2:?lan|vps|auto|vps-hop}"
      shift 2
      ;;
    --via=*) ROUTE_VIA="${1#*=}"; shift ;;
    --with-env) SYNC_ENV=true; shift ;;
    --dev) START_DEV=true; shift ;;
    -h|--help) usage; exit 0 ;;
    *)
      echo "Неизвестный аргумент: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

VIA_ARGS=""
if [ "$ROUTE_VIA" != auto ]; then
  VIA_ARGS="--via $ROUTE_VIA"
fi

if [ "$DO_BACKEND" = true ]; then
  BACKEND_ARGS=""
  # shellcheck disable=SC2086
  [ -n "$VIA_ARGS" ] && BACKEND_ARGS="$BACKEND_ARGS $VIA_ARGS"
  [ "$SYNC_ENV" = true ] && BACKEND_ARGS="$BACKEND_ARGS --with-env"
  # shellcheck disable=SC2086
  "$INTERNAL/deploy-backend.sh" $BACKEND_ARGS
fi

if [ "$DO_FRONTEND" = true ]; then
  # shellcheck disable=SC2086
  "$INTERNAL/deploy-frontend.sh" $VIA_ARGS
fi

echo "Деплой на Pi завершён."

if [ "$START_DEV" = true ]; then
  echo ""
  exec "$SCRIPTS/dev.sh"
fi
