#!/bin/sh
# ProxyCommand для Host roster-*-auto: LAN → nc, иначе VPS → Pi:22022.
LAN="${ROSTER_PI_LAN_HOST:-${ROSTER_DOCKER_LAN_HOST:-192.168.31.96}}"
VPS_KEY="${ROSTER_PI_VPS_KEY:-${ROSTER_DOCKER_VPS_KEY:-$HOME/.ssh/id_ed25519_vps}}"
VPS_SSH="${ROSTER_PI_VPS_SSH:-${ROSTER_DOCKER_VPS_SSH:-root@176.12.65.86}}"
PI_PORT="${ROSTER_PI_PORT:-${ROSTER_DOCKER_PI_PORT:-22022}}"

if ping -c 1 -t 1 "$LAN" >/dev/null 2>&1; then
  exec nc "$LAN" 22
fi

exec ssh -i "$VPS_KEY" -o BatchMode=yes -o StrictHostKeyChecking=accept-new \
  -W "127.0.0.1:${PI_PORT}" "$VPS_SSH"
