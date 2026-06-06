#!/bin/sh
# Сборка React и выкладка на Pi (~/server/www). Маршрут LAN/VPS — auto.
set -e
. "$(dirname "$0")/_root.sh"
roster_load_env
. "$INTERNAL/_ssh-b3.sh"
. "$INTERNAL/_pi-route.sh"

WEB_ROOT="${WEB_ROOT:-server/www}"
ROUTE_VIA=auto

while [ $# -gt 0 ]; do
  case "$1" in
    --via)
      ROUTE_VIA="${2:?lan|vps|auto}"
      shift 2
      ;;
    --via=*) ROUTE_VIA="${1#*=}"; shift ;;
    -h|--help) exit 0 ;;
    *) echo "Неизвестный аргумент: $1" >&2; exit 1 ;;
  esac
done

pi_route_pick "$ROUTE_VIA" || exit 1

cd "$ROOT/frontend"
echo "Сборка frontend…"
frontend_npm_ci_if_needed
npm run build

echo "Копирование dist/ → ${PI_ROUTE_TARGET}:~/${WEB_ROOT}/ (${PI_ROUTE_MODE})"
pi_rsync -avz --delete dist/ "${PI_ROUTE_TARGET}:${WEB_ROOT}/"

echo "Готово. Сайт: ${ROSTER_REMOTE_API_URL}"
