#!/bin/sh
# UI на ноутбуке вне дома: без SSH к Pi, данные с продового API (малинка через VPS).
# Для правок Python + БД: один раз дома ./scripts/setup-vps-dev-ssh.sh, затем dev-local.sh вне дома.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [ -f "$ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$ROOT/.env"
  set +a
fi
. "$ROOT/scripts/_dev-remote.sh"

if ! remote_api_ok; then
  echo "Не отвечает ${ROSTER_REMOTE_API_HEALTH}" >&2
  echo "Проверьте интернет и что сайт открывается: ${ROSTER_REMOTE_API_URL}" >&2
  exit 1
fi

echo "API: ${ROSTER_REMOTE_API_HEALTH} — OK"
run_dev_frontend_remote
