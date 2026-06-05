#!/bin/sh
# Один раз дома: SSH-ключ на малинку, дальше deploy без пароля.
set -e
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
. "$ROOT/scripts/internal/_ssh-b3.sh"

KEY="${ROSTER_SSH_KEY:-$HOME/.ssh/id_ed25519_roster}"

echo "Хост: ${PI_SSH}"
echo "Ключ: ${KEY}"

if [ ! -f "$KEY" ]; then
  echo "Создаю ключ…"
  ssh-keygen -t ed25519 -f "$KEY" -C "roster-mac"
fi

echo "Копирую ключ на Pi (введите пароль SSH последний раз)…"
ssh-copy-id -i "${KEY}.pub" "$PI_SSH"

CFG="$HOME/.ssh/config"
MARKER="# Roster B3"
if ! grep -q "$MARKER" "$CFG" 2>/dev/null; then
  echo ""
  echo "Добавляю Host roster-b3 в ${CFG}…"
  mkdir -p "$HOME/.ssh"
  chmod 700 "$HOME/.ssh"
  cat >>"$CFG" <<EOF

$MARKER
Host roster-b3
  HostName 192.168.31.96
  User greem4
  IdentityFile ${KEY}
  ControlMaster auto
  ControlPath ${ROSTER_SSH_SOCKET}
  ControlPersist 8h
EOF
  chmod 600 "$CFG"
fi

echo ""
echo "Проверка (без пароля):"
ssh -i "$KEY" -o BatchMode=yes "$PI_SSH" 'echo OK'

echo ""
echo "В .env можно указать:  PI_SSH=roster-b3"
