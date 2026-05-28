#!/usr/sh
# Проброс API с B3 на localhost:8000 — UI с продовым API (новая логика уже на B3).
# Правки Python: ./scripts/dev-local.sh  (не совмещать с этим туннелем на :8000).
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
. "$ROOT/scripts/_ssh-b3.sh"
[ -f "$ROOT/.env" ] && . "$ROOT/.env"
roster_ssh_ensure_master
echo "Туннель API: localhost:8000 -> B3 (логика как на проде)"
echo "Подключение: ${PI_SSH} (Ctrl+C — выход)"
exec roster_ssh -N -L 8000:127.0.0.1:8000 "$PI_SSH"
