# Доступ к малинке: LAN → VPS :22022 → ProxyJump через VPS.
# Подключать после _ssh-b3.sh; нужны переменные из .env (PI_SSH, ROSTER_VPS_*).
#
# pi_route_pick [auto|lan|vps|vps-hop]
# pi_ssh / pi_rsync — команды на Pi после pi_route_pick

ROSTER_REMOTE_API_URL="${ROSTER_REMOTE_API_URL:-https://medicine.greemlab.ru}"
ROSTER_REMOTE_API_HEALTH="${ROSTER_REMOTE_API_URL}/api/health"
ROSTER_VPS_SSH="${ROSTER_VPS_SSH:-root@176.12.65.86}"
ROSTER_VPS_PI_SSH_PORT="${ROSTER_VPS_PI_SSH_PORT:-22022}"

PI_ROUTE_MODE=""
PI_ROUTE_SSH_BASE=""
PI_ROUTE_TARGET=""

pi_roster_key_path() {
  KEY="${ROSTER_SSH_KEY:-$HOME/.ssh/id_ed25519_roster}"
  if [ -f "$KEY" ]; then
    echo "$KEY"
  elif [ -f "$HOME/.ssh/id_ed25519" ]; then
    echo "$HOME/.ssh/id_ed25519"
  elif [ -f "$HOME/.ssh/id_rsa" ]; then
    echo "$HOME/.ssh/id_rsa"
  fi
}

pi_vps_key_path() {
  KEY="${VPS_SSH_KEY:-$HOME/.ssh/id_ed25519_vps}"
  if [ -f "$KEY" ]; then
    echo "$KEY"
  fi
}

pi_ssh_key_opts() {
  KEY="$(pi_roster_key_path)"
  if [ -n "$KEY" ]; then
    echo "-i ${KEY}"
  fi
}

# ProxyJump на VPS: отдельный ключ VPS, на Pi — roster.
pi_vps_proxy_opts() {
  VPS_KEY="$(pi_vps_key_path)"
  if [ -n "$VPS_KEY" ]; then
    echo "-o ProxyCommand=ssh -i ${VPS_KEY} -o BatchMode=yes -o StrictHostKeyChecking=accept-new -W %h:%p ${ROSTER_VPS_SSH}"
  else
    echo "-o ProxyJump=${ROSTER_VPS_SSH}"
  fi
}

pi_lan_reachable() {
  # shellcheck disable=SC2086
  ssh $ROSTER_SSH_BASE -o ConnectTimeout=3 -o BatchMode=yes "$PI_SSH" 'echo ok' >/dev/null 2>&1
}

_pi_vps_direct_base() {
  PI_ROUTE_TARGET="greem4@${ROSTER_VPS_SSH#*@}"
  PI_ROUTE_SSH_BASE="-o ServerAliveInterval=60 -p ${ROSTER_VPS_PI_SSH_PORT} $(pi_ssh_key_opts)"
}

_pi_vps_hop_base() {
  PI_ROUTE_MODE=vps-hop
  PI_ROUTE_TARGET="greem4@127.0.0.1"
  PI_ROUTE_SSH_BASE="-o ServerAliveInterval=60 $(pi_vps_proxy_opts) -p ${ROSTER_VPS_PI_SSH_PORT} $(pi_ssh_key_opts)"
}

pi_vps_reachable() {
  _pi_vps_direct_base
  PI_ROUTE_MODE=vps
  # shellcheck disable=SC2086
  ssh $PI_ROUTE_SSH_BASE -o ConnectTimeout=8 -o BatchMode=yes "$PI_ROUTE_TARGET" 'echo ok' >/dev/null 2>&1
}

pi_vps_hop_reachable() {
  _pi_vps_hop_base
  # shellcheck disable=SC2086
  ssh $PI_ROUTE_SSH_BASE -o ConnectTimeout=8 -o BatchMode=yes "$PI_ROUTE_TARGET" 'echo ok' >/dev/null 2>&1
}

pi_use_lan() {
  PI_ROUTE_MODE=lan
  PI_ROUTE_TARGET="$PI_SSH"
  PI_ROUTE_SSH_BASE="$ROSTER_SSH_BASE"
}

pi_use_vps_direct() {
  _pi_vps_direct_base
  PI_ROUTE_MODE=vps
}

pi_use_vps_hop() {
  _pi_vps_hop_base
}

# shellcheck disable=SC2034
pi_route_pick() {
  via="${1:-auto}"
  case "$via" in
    lan)
      pi_use_lan
      roster_ssh_ensure_master || return 1
      ;;
    vps)
      if pi_vps_reachable; then
        pi_use_vps_direct
      elif pi_vps_hop_reachable; then
        pi_use_vps_hop
        echo "ProxyJump ${ROSTER_VPS_SSH} → Pi:${ROSTER_VPS_PI_SSH_PORT}"
      else
        echo "Pi недоступна через VPS (порт ${ROSTER_VPS_PI_SSH_PORT})." >&2
        echo "Один раз из домашней Wi‑Fi: ./scripts/setup/vps-dev-ssh.sh" >&2
        return 1
      fi
      ;;
    vps-hop)
      pi_use_vps_hop
      if ! pi_vps_hop_reachable; then
        echo "ProxyJump ${ROSTER_VPS_SSH} → 127.0.0.1:${ROSTER_VPS_PI_SSH_PORT} не работает." >&2
        echo "Один раз дома: ./scripts/setup/vps-dev-ssh.sh" >&2
        return 1
      fi
      ;;
    auto)
      if pi_lan_reachable; then
        pi_use_lan
        roster_ssh_ensure_master || return 1
      elif pi_vps_reachable; then
        pi_use_vps_direct
        echo "LAN недоступна — связь через VPS (:${ROSTER_VPS_PI_SSH_PORT})."
      elif pi_vps_hop_reachable; then
        pi_use_vps_hop
        echo "Связь через ${ROSTER_VPS_SSH} → Pi:${ROSTER_VPS_PI_SSH_PORT}."
      else
        echo "Не удалось достучаться до Pi." >&2
        echo "  Дома:     PI_SSH=${PI_SSH}  (./scripts/setup/ssh-key.sh)" >&2
        echo "  Вне дома: ./scripts/setup/vps-dev-ssh.sh  (один раз дома)" >&2
        return 1
      fi
      ;;
    *)
      echo "pi_route_pick: auto | lan | vps | vps-hop" >&2
      return 1
      ;;
  esac
  return 0
}

pi_ssh() {
  # shellcheck disable=SC2086
  ssh $PI_ROUTE_SSH_BASE "$PI_ROUTE_TARGET" "$@"
}

pi_rsync() {
  # shellcheck disable=SC2086
  rsync -e "ssh $PI_ROUTE_SSH_BASE" "$@"
}

remote_api_ok() {
  curl -sf "$ROSTER_REMOTE_API_HEALTH" >/dev/null 2>&1
}

run_dev_frontend_remote() {
  export ROSTER_DEV_REMOTE=1
  export ROSTER_REMOTE_API_URL
  . "$INTERNAL/_lan-ip.sh"
  echo "UI локально, API → ${ROSTER_REMOTE_API_URL}/api"
  echo "Mac: http://localhost:5173"
  if lan=$(roster_lan_ip); then
    echo "Телефон (та же Wi‑Fi): http://${lan}:5173"
  fi
  echo "На сайт: ./scripts/deploy-frontend.sh"
  frontend_npm_ci_if_needed
  exec npm run dev
}
