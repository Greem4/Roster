#!/bin/sh
# Host roster-docker-auto — Docker via SSH в JetBrains (LAN или VPS).
set -e
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
# shellcheck disable=SC1091
. "$ROOT/scripts/setup/_intellij-pi-ssh-common.sh"

roster_pi_ssh_install_host roster-docker-auto "# Roster Docker IDE"

echo "Добавлен Host roster-docker-auto в ~/.ssh/config"
echo ""
echo "JetBrains: Settings → Docker → SSH → roster-docker-auto"
echo ""
echo "Проверка:"
ssh -o BatchMode=yes -o ConnectTimeout=15 roster-docker-auto 'docker ps --format "table {{.Names}}\t{{.Status}}"'
