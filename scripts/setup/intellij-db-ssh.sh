#!/bin/sh
# Host roster-db-auto — PostgreSQL на Pi через SSH-туннель в JetBrains (LAN или VPS).
set -e
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
if [ -f "$ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$ROOT/.env"
  set +a
fi
# shellcheck disable=SC1091
. "$ROOT/scripts/setup/_intellij-pi-ssh-common.sh"

POSTGRES_USER="${POSTGRES_USER:-roster}"
POSTGRES_DB="${POSTGRES_DB:-roster}"
PI_PROJECT_DIR="${PI_PROJECT_DIR:-Roster}"

roster_pi_ssh_install_host roster-db-auto "# Roster DB IDE"

echo "Добавлен Host roster-db-auto в ~/.ssh/config"
echo ""
echo "JetBrains → Data Sources → roster@pi:"
echo "  General:  Host 127.0.0.1  Port 5432  User ${POSTGRES_USER}  Database ${POSTGRES_DB}"
echo "            Password — POSTGRES_PASSWORD из .env"
echo "  SSH/SSL:  ✓ Use SSH tunnel  →  SSH config: roster-db-auto"
echo "            (Parse ~/.ssh/config включён)"
echo ""
echo "Проверка PostgreSQL на Pi:"
ssh -o BatchMode=yes -o ConnectTimeout=15 roster-db-auto \
  "docker compose -f ~/${PI_PROJECT_DIR}/docker-compose.yml exec -T db pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"
