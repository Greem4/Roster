#!/bin/sh
# Добавляет в ~/.ssh/config хосты для доступа к Pi вне дома.
# VPS — ключ id_ed25519_vps; Pi — id_ed25519_roster (раздельно).
set -e
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
if [ -f "$ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$ROOT/.env"
  set +a
fi

ROSTER_VPS_SSH="${ROSTER_VPS_SSH:-root@176.12.65.86}"
VPS_HOST="${ROSTER_VPS_SSH#*@}"
VPS_USER="${ROSTER_VPS_SSH%%@*}"
VPS_USER="${VPS_USER:-root}"
if [ -z "$VPS_HOST" ] || [ "$VPS_HOST" = "$ROSTER_VPS_SSH" ]; then
  echo "Задайте ROSTER_VPS_SSH=root@IP в .env" >&2
  exit 1
fi
PI_PORT="${ROSTER_VPS_PI_SSH_PORT:-22022}"
VPS_KEY="${VPS_SSH_KEY:-$HOME/.ssh/id_ed25519_vps}"
ROSTER_KEY="${ROSTER_SSH_KEY:-$HOME/.ssh/id_ed25519_roster}"

CFG="$HOME/.ssh/config"
MARKER="# Roster VPS hop"
mkdir -p "$HOME/.ssh"
chmod 700 "$HOME/.ssh"

# Перезаписываем блок, если уже был со старым одним ключом.
if grep -q "$MARKER" "$CFG" 2>/dev/null; then
  awk -v marker="$MARKER" '
    $0 ~ marker { skip=1; next }
    skip && /^Host / { skip=0 }
    !skip { print }
  ' "$CFG" > "${CFG}.tmp" && mv "${CFG}.tmp" "$CFG"
fi

cat >>"$CFG" <<EOF

$MARKER
Host roster-vps
  HostName ${VPS_HOST}
  User ${VPS_USER}
  IdentityFile ${VPS_KEY}

Host roster-pi-remote
  HostName 127.0.0.1
  User greem4
  Port ${PI_PORT}
  ProxyJump roster-vps
  IdentityFile ${ROSTER_KEY}
EOF
chmod 600 "$CFG"
echo "Обновлены Host roster-vps и roster-pi-remote в ${CFG}"

echo ""
echo "Проверка (нужен ./scripts/setup/vps-dev-ssh.sh и ключи на VPS и Pi):"
ssh -o BatchMode=yes -o ConnectTimeout=12 roster-pi-remote 'echo OK — Pi через VPS'

echo ""
echo "В .env для деплоя вне дома можно указать: PI_SSH=roster-pi-remote"
