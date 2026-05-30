#!/bin/sh
# Один раз из домашней Wi‑Fi: Pi пробросит SSH на VPS (127.0.0.1:22022).
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
  roster_ssh "$PI_SSH" "cp '${TUNNEL_SCRIPT}' '${TUNNEL_SCRIPT}.bak-\$(date +%Y%m%d%H%M%S)'"
  roster_ssh "$PI_SSH" "sed -i 's/-R 127.0.0.1:18080:127.0.0.1:80/-R 127.0.0.1:18080:127.0.0.1:80 -R ${MARKER}/' '${TUNNEL_SCRIPT}'" || {
    echo "Не удалось дописать -R в ${TUNNEL_SCRIPT}." >&2
    echo "Вручную добавьте: -R ${MARKER}" >&2
    exit 1
  }
  echo "Добавлен -R ${MARKER}"
fi

echo "Перезапуск VPS-туннеля на Pi…"
roster_ssh "$PI_SSH" "pkill -f start-vps-tunnel.sh 2>/dev/null || true; nohup '${TUNNEL_SCRIPT}' >>/home/greem4/.config/vps-tunnel/tunnel.log 2>&1 &"
sleep 3

echo ""
echo "Проверка с Mac…"
if pi_route_pick auto 2>/dev/null; then
  echo "OK — с ноутбука откуда угодно:"
  echo "  ./scripts/deploy-backend.sh --with-env"
  echo "  ./scripts/internal/import.sh"
else
  echo "Пока не пускает на :${REMOTE_PORT}." >&2
  echo "  ssh ${ROSTER_VPS_SSH} \"ss -tln | grep ${REMOTE_PORT}\"" >&2
  exit 1
fi
