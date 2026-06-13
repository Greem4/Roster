#!/bin/sh
# Общая установка Host *-auto в ~/.ssh/config (LAN или VPS через ssh-pi-proxy.sh).
set -e
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
if [ -f "$ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$ROOT/.env"
  set +a
fi

PI_SSH="${PI_SSH:-greem4@192.168.31.96}"
PI_LAN_HOST="${PI_SSH#*@}"
if [ -z "$PI_LAN_HOST" ] || [ "$PI_LAN_HOST" = "$PI_SSH" ]; then
  PI_LAN_HOST="192.168.31.96"
fi

ROSTER_VPS_SSH="${ROSTER_VPS_SSH:-root@176.12.65.86}"
PI_PORT="${ROSTER_VPS_PI_SSH_PORT:-22022}"
VPS_KEY="${VPS_SSH_KEY:-$HOME/.ssh/id_ed25519_vps}"
ROSTER_KEY="${ROSTER_SSH_KEY:-$HOME/.ssh/id_ed25519_roster}"
PROXY="$ROOT/scripts/setup/ssh-pi-proxy.sh"

chmod +x "$PROXY"

# Установить или обновить один Host в ~/.ssh/config.
# $1 — имя Host (roster-docker-auto, roster-db-auto)
# $2 — маркер блока (# Roster Docker IDE)
roster_pi_ssh_install_host() {
  host_name="$1"
  marker="$2"
  CFG="$HOME/.ssh/config"

  mkdir -p "$HOME/.ssh"
  chmod 700 "$HOME/.ssh"
  touch "$CFG"
  chmod 600 "$CFG"

  if grep -q "$marker" "$CFG" 2>/dev/null || grep -q "^Host ${host_name}$" "$CFG" 2>/dev/null; then
    awk -v host="$host_name" -v marker="$marker" '
      $0 ~ marker { skip=1; next }
      $0 ~ ("^Host " host "$") { skip=1; next }
      skip && /^Host / { skip=0 }
      !skip { print }
    ' "$CFG" > "${CFG}.tmp" && mv "${CFG}.tmp" "$CFG"
  fi

  cat >>"$CFG" <<EOF

${marker}
Host ${host_name}
  HostName ${PI_LAN_HOST}
  User greem4
  IdentityFile ${ROSTER_KEY}
  ProxyCommand env ROSTER_PI_LAN_HOST=${PI_LAN_HOST} ROSTER_PI_VPS_KEY=${VPS_KEY} ROSTER_PI_VPS_SSH=${ROSTER_VPS_SSH} ROSTER_PI_PORT=${PI_PORT} ${PROXY}
EOF
}
