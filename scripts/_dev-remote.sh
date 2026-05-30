# Режим разработки вне домашней LAN: API через HTTPS на VPS, без SSH к Pi.
# Подключать: . "$(dirname "$0")/_dev-remote.sh"

ROSTER_REMOTE_API_URL="${ROSTER_REMOTE_API_URL:-https://medicine.greemlab.ru}"
ROSTER_REMOTE_API_HEALTH="${ROSTER_REMOTE_API_URL}/api/health"

# VPS: reverse SSH Pi→VPS для db-tunnel-vps.sh (один раз: setup-vps-dev-ssh.sh дома).
ROSTER_VPS_SSH="${ROSTER_VPS_SSH:-root@176.12.65.86}"
ROSTER_VPS_PI_SSH_PORT="${ROSTER_VPS_PI_SSH_PORT:-22022}"

pi_ssh_reachable() {
  # shellcheck disable=SC2086
  ssh $ROSTER_SSH_BASE -o ConnectTimeout=3 -o BatchMode=yes "$PI_SSH" 'echo ok' >/dev/null 2>&1
}

remote_api_ok() {
  curl -sf "$ROSTER_REMOTE_API_HEALTH" >/dev/null 2>&1
}

run_dev_frontend_remote() {
  export ROSTER_DEV_REMOTE=1
  export ROSTER_REMOTE_API_URL
  . "$ROOT/scripts/_lan-ip.sh"
  echo "Режим вне дома: UI локально, API → ${ROSTER_REMOTE_API_URL}/api"
  echo "Mac: http://localhost:5173"
  if lan=$(roster_lan_ip); then
    echo "Телефон (та же Wi‑Fi): http://${lan}:5173"
  fi
  echo "На сайт: ./scripts/deploy-frontend.sh"
  cd "$ROOT/frontend"
  [ -d node_modules ] || npm ci
  exec npm run dev
}
