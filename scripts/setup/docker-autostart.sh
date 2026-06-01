#!/bin/sh
# Один раз дома: автозапуск Docker-стеков на Pi после перезагрузки.
set -e
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
. "$ROOT/scripts/internal/_ssh-b3.sh"

REMOTE_BIN="/home/greem4/bin/docker-stacks-up.sh"
CRON_LINE='@reboot sleep 45 && /home/greem4/bin/docker-stacks-up.sh'

echo "=== Автозапуск Docker-стеков на B3 (${PI_SSH}) ==="

roster_ssh_ensure_master || exit 1

echo "Копирую docker-stacks-up.sh → ${PI_SSH}:${REMOTE_BIN}"
roster_ssh "$PI_SSH" "mkdir -p /home/greem4/bin"
roster_rsync -avz "$ROOT/scripts/internal/docker-stacks-up.sh" "${PI_SSH}:${REMOTE_BIN}"
roster_ssh "$PI_SSH" "chmod +x ${REMOTE_BIN}"

echo "Обновляю crontab (@reboot)…"
roster_ssh "$PI_SSH" "( crontab -l 2>/dev/null | grep -v 'docker-stacks-up.sh' || true; echo '${CRON_LINE}' ) | crontab -"

echo "Пробный запуск…"
roster_ssh "$PI_SSH" "${REMOTE_BIN}"

echo ""
echo "Crontab на Pi:"
roster_ssh "$PI_SSH" "crontab -l | grep -E 'docker-stacks|vps-tunnel' || crontab -l"

echo ""
echo "Контейнеры:"
roster_ssh "$PI_SSH" "docker ps --format 'table {{.Names}}\t{{.Status}}'"

echo ""
echo "Готово. Лог на Pi: ~/docker-stacks.log"
echo ""
echo "Опционально (systemd на Pi, нужен sudo):"
echo "  scp scripts/internal/docker-stacks.service ${PI_SSH}:/tmp/"
echo "  ssh ${PI_SSH} 'sudo cp /tmp/docker-stacks.service /etc/systemd/system/ && sudo systemctl daemon-reload && sudo systemctl enable --now docker-stacks.service'"
