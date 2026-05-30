#!/bin/sh
# PostgreSQL на Pi через reverse SSH на VPS (порт 22022). Нужен setup-vps-dev-ssh.sh (один раз дома).
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [ -f "$ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$ROOT/.env"
  set +a
fi
. "$ROOT/scripts/_dev-remote.sh"

LOCAL_PORT="${LOCAL_PORT:-5432}"
KEY="${ROSTER_SSH_KEY:-$HOME/.ssh/id_ed25519_roster}"
SSH_ID=""
[ -f "$KEY" ] && SSH_ID="-i $KEY"

echo "Туннель: localhost:${LOCAL_PORT} → Pi postgres (через ${ROSTER_VPS_SSH}:${ROSTER_VPS_PI_SSH_PORT})"
echo "Если отказ в соединении — дома один раз: ./scripts/setup-vps-dev-ssh.sh"
echo "Ctrl+C — выход"

# shellcheck disable=SC2086
exec ssh $SSH_ID -o ServerAliveInterval=60 -N -L "${LOCAL_PORT}:127.0.0.1:5432" \
  -p "${ROSTER_VPS_PI_SSH_PORT}" "greem4@${ROSTER_VPS_SSH#*@}"
