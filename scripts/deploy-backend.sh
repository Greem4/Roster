#!/bin/sh
# Деплой backend на B3 без git: rsync кода + пересборка контейнера api (миграции при старте).
# Для агента и быстрой проверки правок API на проде.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
. "$ROOT/scripts/_ssh-b3.sh"
[ -f "$ROOT/.env" ] && . "$ROOT/.env"
PI_PROJECT_DIR="${PI_PROJECT_DIR:-RosterRx}"

roster_ssh_ensure_master || exit 1

echo "=== Синхронизация backend → ${PI_SSH}:~/${PI_PROJECT_DIR} ==="
roster_rsync -avz \
  --exclude '.venv' \
  --exclude '__pycache__' \
  --exclude '*.pyc' \
  --exclude '.pytest_cache' \
  "$ROOT/backend/" "${PI_SSH}:~/${PI_PROJECT_DIR}/backend/"

roster_rsync -avz "$ROOT/docker-compose.yml" "${PI_SSH}:~/${PI_PROJECT_DIR}/docker-compose.yml"

echo "=== Пересборка API на B3 ==="
roster_ssh "$PI_SSH" "cd ~/${PI_PROJECT_DIR} && docker compose up -d --build api"

echo "Ожидание API на Pi…"
i=0
while [ "$i" -lt 40 ]; do
  if roster_ssh "$PI_SSH" "curl -sf http://127.0.0.1:8000/health" >/dev/null 2>&1; then
    roster_ssh "$PI_SSH" "curl -sf http://127.0.0.1:8000/health && echo"
    break
  fi
  sleep 1
  i=$((i + 1))
done
if [ "$i" -ge 40 ]; then
  echo "API не ответил за 40 с. Логи: ssh $PI_SSH 'cd ~/${PI_PROJECT_DIR} && docker compose logs api --tail 30'" >&2
  exit 1
fi

echo ""
echo "Готово. Прод: curl -s https://medicine.greemlab.ru/api/health"
