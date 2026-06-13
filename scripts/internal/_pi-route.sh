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

pi_expand_path() {
  case "$1" in
    "~/"*) printf '%s\n' "$HOME/${1#~/}" ;;
    "~") printf '%s\n' "$HOME" ;;
    *) printf '%s\n' "$1" ;;
  esac
}

pi_roster_key_path() {
  KEY="$(pi_expand_path "${ROSTER_SSH_KEY:-$HOME/.ssh/id_ed25519_roster}")"
  if [ -f "$KEY" ]; then
    echo "$KEY"
  elif [ -f "$HOME/.ssh/id_ed25519" ]; then
    echo "$HOME/.ssh/id_ed25519"
  elif [ -f "$HOME/.ssh/id_rsa" ]; then
    echo "$HOME/.ssh/id_rsa"
  fi
}

pi_vps_key_path() {
  KEY="$(pi_expand_path "${VPS_SSH_KEY:-$HOME/.ssh/id_ed25519_vps}")"
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
  ROSTER_KEY="$(pi_roster_key_path)"
  if [ -f "$HOME/.ssh/config" ] && grep -q '^Host roster-vps' "$HOME/.ssh/config" 2>/dev/null; then
    PI_ROUTE_SSH_BASE="-o ServerAliveInterval=60 -o ProxyJump=roster-vps -p ${ROSTER_VPS_PI_SSH_PORT} -i ${ROSTER_KEY}"
  else
    VPS_KEY="$(pi_vps_key_path)"
    if [ -n "$VPS_KEY" ] && [ -n "$ROSTER_KEY" ]; then
      PI_ROUTE_SSH_BASE="-o ServerAliveInterval=60 -o ProxyJump=${ROSTER_VPS_SSH} -p ${ROSTER_VPS_PI_SSH_PORT} -i ${ROSTER_KEY}"
    else
      PI_ROUTE_SSH_BASE="-o ServerAliveInterval=60 -o ProxyJump=${ROSTER_VPS_SSH} -p ${ROSTER_VPS_PI_SSH_PORT} $(pi_ssh_key_opts)"
    fi
  fi
}

pi_vps_reachable() {
  _pi_vps_direct_base
  PI_ROUTE_MODE=vps
  # shellcheck disable=SC2086
  ssh $PI_ROUTE_SSH_BASE -o ConnectTimeout=8 -o BatchMode=yes "$PI_ROUTE_TARGET" 'echo ok' >/dev/null 2>&1
}

pi_ssh_config_reachable() {
  host="$1"
  [ -n "$host" ] || return 1
  ssh -o ConnectTimeout=8 -o BatchMode=yes "$host" 'echo ok' >/dev/null 2>&1
}

pi_vps_hop_reachable() {
  if pi_ssh_config_reachable roster-pi-remote; then
    return 0
  fi
  _pi_vps_hop_base
  # shellcheck disable=SC2086
  ssh $PI_ROUTE_SSH_BASE -o ConnectTimeout=8 -o BatchMode=yes "$PI_ROUTE_TARGET" 'echo ok' >/dev/null 2>&1
}

pi_use_config_host() {
  PI_ROUTE_MODE=ssh-host
  PI_ROUTE_TARGET="$1"
  PI_ROUTE_SSH_BASE="-o ServerAliveInterval=60"
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

# Host из ~/.ssh/config (например roster-pi-remote) — как в CI после шага SSH.
pi_use_ssh_host() {
  pi_use_config_host "$PI_SSH"
}

pi_ssh_host_reachable() {
  [ -n "$PI_SSH" ] || return 1
  case "$PI_SSH" in *@*) return 1 ;; esac
  pi_ssh_config_reachable "$PI_SSH"
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
      if pi_ssh_host_reachable; then
        pi_use_ssh_host
      elif pi_ssh_config_reachable roster-pi-remote; then
        pi_use_config_host roster-pi-remote
      elif pi_vps_hop_reachable; then
        if pi_ssh_config_reachable roster-pi-remote; then
          pi_use_config_host roster-pi-remote
        else
          pi_use_vps_hop
        fi
      else
        echo "ProxyJump ${ROSTER_VPS_SSH} → 127.0.0.1:${ROSTER_VPS_PI_SSH_PORT} не работает." >&2
        echo "Один раз дома: ./scripts/setup/vps-dev-ssh.sh" >&2
        return 1
      fi
      ;;
    auto)
      if pi_lan_reachable; then
        pi_use_lan
        roster_ssh_ensure_master || return 1
      elif pi_ssh_host_reachable; then
        pi_use_ssh_host
        echo "LAN недоступна — ${PI_SSH} (~/.ssh/config)."
      elif pi_ssh_config_reachable roster-pi-remote; then
        pi_use_config_host roster-pi-remote
        echo "LAN недоступна — roster-pi-remote (~/.ssh/config)."
      elif pi_vps_reachable; then
        pi_use_vps_direct
        echo "LAN недоступна — связь через VPS (:${ROSTER_VPS_PI_SSH_PORT})."
      elif pi_vps_hop_reachable; then
        if pi_ssh_config_reachable roster-pi-remote; then
          pi_use_config_host roster-pi-remote
        else
          pi_use_vps_hop
        fi
        echo "Связь через VPS → Pi:${ROSTER_VPS_PI_SSH_PORT}."
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
  case "$PI_ROUTE_MODE" in
    ssh-host)
      ssh -o ServerAliveInterval=60 "$PI_ROUTE_TARGET" "$@"
      ;;
    *)
      # shellcheck disable=SC2086
      ssh $PI_ROUTE_SSH_BASE "$PI_ROUTE_TARGET" "$@"
      ;;
  esac
}

pi_rsync() {
  case "$PI_ROUTE_MODE" in
    ssh-host)
      rsync -e "ssh -o ServerAliveInterval=60" "$@"
      ;;
    *)
      # shellcheck disable=SC2086
      rsync -e "ssh $PI_ROUTE_SSH_BASE" "$@"
      ;;
  esac
}

# SSH -L для tunnel-db.sh и import.sh
pi_ssh_port_forward() {
  local_port="$1"
  bg="${2:-}"
  case "$PI_ROUTE_MODE" in
    ssh-host)
      if [ "$bg" = bg ]; then
        ssh -o ServerAliveInterval=60 -f -N -L "${local_port}:127.0.0.1:5432" "$PI_ROUTE_TARGET"
      else
        exec ssh -o ServerAliveInterval=60 -N -L "${local_port}:127.0.0.1:5432" "$PI_ROUTE_TARGET"
      fi
      ;;
    *)
      if [ "$bg" = bg ]; then
        # shellcheck disable=SC2086
        ssh $PI_ROUTE_SSH_BASE -f -N -L "${local_port}:127.0.0.1:5432" "$PI_ROUTE_TARGET"
      else
        # shellcheck disable=SC2086
        exec ssh $PI_ROUTE_SSH_BASE -N -L "${local_port}:127.0.0.1:5432" "$PI_ROUTE_TARGET"
      fi
      ;;
  esac
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
