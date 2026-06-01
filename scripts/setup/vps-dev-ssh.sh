#!/bin/sh
# Один раз из домашней Wi‑Fi: Pi пробросит SSH на VPS (127.0.0.1:22022).
# Порт слушает только на localhost VPS — с интернета к Pi только через ProxyJump (см. vps-ssh-config.sh).
set -e
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
if [ -f "$ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$ROOT/.env"
  set +a
fi
. "$ROOT/scripts/internal/_ssh-b3.sh"
. "$ROOT/scripts/internal/_pi-route.sh"

TUNNEL_SCRIPT='/home/greem4/.local/bin/start-vps-tunnel.sh'
MARKER='127.0.0.1:22022:127.0.0.1:22'
REMOTE_PORT="${ROSTER_VPS_PI_SSH_PORT}"
PATCH_PY="$ROOT/scripts/setup/_patch-vps-tunnel-ssh.py"

echo "=== Dev-доступ к Pi через VPS (порт ${REMOTE_PORT}) ==="
echo "Нужна домашняя LAN: ${PI_SSH}"
echo ""

roster_ssh_ensure_master || exit 1

roster_ssh "$PI_SSH" "test -f '${TUNNEL_SCRIPT}'" || {
  echo "На Pi нет ${TUNNEL_SCRIPT} — настройте VPS-туннель по README." >&2
  exit 1
}

if roster_ssh "$PI_SSH" "grep -q '${MARKER}' '${TUNNEL_SCRIPT}'"; then
  echo "Проброс SSH уже есть в ${TUNNEL_SCRIPT}"
else
  roster_rsync -az "$PATCH_PY" "${PI_SSH}:/tmp/_patch-vps-tunnel-ssh.py"
  roster_ssh "$PI_SSH" "cp '${TUNNEL_SCRIPT}' '${TUNNEL_SCRIPT}.bak-\$(date +%Y%m%d%H%M%S)'"
  roster_ssh "$PI_SSH" "python3 /tmp/_patch-vps-tunnel-ssh.py" || {
    echo "Не удалось дописать -R в ${TUNNEL_SCRIPT}." >&2
    echo "Вручную добавьте строку: -R \"${MARKER}\" \\" >&2
    exit 1
  }
  echo "Добавлен -R ${MARKER}"
fi

echo "Перезапуск VPS-туннеля на Pi…"
roster_ssh "$PI_SSH" "pkill -f id_ed25519_vps_tunnel 2>/dev/null || true"
sleep 2
roster_ssh "$PI_SSH" "nohup '${TUNNEL_SCRIPT}' >>/home/greem4/.config/vps-tunnel/tunnel.log 2>&1 &"
sleep 4

echo ""
echo "Проверка с Mac…"
if pi_route_pick vps-hop 2>/dev/null; then
  echo "OK — с ноутбука откуда угодно (ProxyJump → Pi:${REMOTE_PORT}):"
  echo "  ./scripts/setup/vps-ssh-config.sh   — Host в ~/.ssh/config"
  echo "  ./scripts/deploy-backend.sh"
  echo "  ./scripts/internal/import.sh        — туннель к БД"
else
  echo "Пока не пускает на :${REMOTE_PORT}." >&2
  echo "  ssh ${ROSTER_VPS_SSH} \"ss -tln | grep ${REMOTE_PORT}\"" >&2
  exit 1
fi
