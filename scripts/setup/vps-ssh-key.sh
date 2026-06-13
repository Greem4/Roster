#!/bin/sh
# Один раз: отдельный SSH-ключ для VPS (не Roster, не личный id_ed25519).
# Roster-ключ остаётся только на Pi; CI использует оба: VPS_SSH_KEY + ROSTER_SSH_KEY.
set -e
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
if [ -f "$ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$ROOT/.env"
  set +a
fi

VPS_KEY="${VPS_SSH_KEY:-$HOME/.ssh/id_ed25519_vps}"
ROSTER_VPS_SSH="${ROSTER_VPS_SSH:-root@176.12.65.86}"
VPS_HOST="${ROSTER_VPS_SSH#*@}"
VPS_USER="${ROSTER_VPS_SSH%%@*}"
VPS_USER="${VPS_USER:-root}"

echo "VPS: ${VPS_USER}@${VPS_HOST}"
echo "Ключ VPS: ${VPS_KEY}"

if [ ! -f "$VPS_KEY" ]; then
  echo "Создаю ключ…"
  ssh-keygen -t ed25519 -f "$VPS_KEY" -C "vps-greemlab"
fi

echo ""
echo "Копирую публичный ключ на VPS (нужен доступ root — основной ключ или пароль)…"
ssh-copy-id -i "${VPS_KEY}.pub" "${VPS_USER}@${VPS_HOST}"

echo ""
echo "Проверка VPS (без пароля):"
ssh -i "$VPS_KEY" -o BatchMode=yes "${VPS_USER}@${VPS_HOST}" 'echo VPS OK'

echo ""
echo "Дальше:"
echo "  1. ./scripts/setup/vps-ssh-config.sh   — Host roster-vps / roster-pi-remote в ~/.ssh/config"
echo "  2. GitHub Environment Roster → Secret VPS_SSH_KEY (приватный ${VPS_KEY})"
echo "  3. ROSTER_SSH_KEY — только ключ Pi (~/.ssh/id_ed25519_roster), не класть на VPS"
