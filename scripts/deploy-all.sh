#!/bin/sh
# Полный деплой на B3: git push → pull на Pi → пересборка API (миграции) → фронт.
# Сначала проверьте локально: ./scripts/dev-local.sh  (или ./scripts/dev-local.sh --check)
# Запускать после коммита: ./scripts/deploy-all.sh
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PI_SSH="${PI_SSH:-greem4@192.168.31.96}"
PI_PROJECT_DIR="${PI_PROJECT_DIR:-RosterRx}"

SKIP_PUSH=false
SKIP_BACKEND=false
SKIP_FRONTEND=false

usage() {
  cat <<'EOF'
Использование: ./scripts/deploy-all.sh [опции]

  git push → на B3: git pull + docker compose up -d --build → deploy-frontend.sh

Опции:
  --no-push      не делать git push (код уже на remote)
  --no-backend   только фронт (deploy-frontend.sh)
  --no-frontend  только backend на Pi
  -h, --help     эта справка

Переменные окружения:
  PI_SSH           SSH-хост (по умолчанию greem4@192.168.31.96)
  PI_PROJECT_DIR   каталог проекта на Pi (по умолчанию RosterRx)
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --no-push) SKIP_PUSH=true ;;
    --no-backend) SKIP_BACKEND=true ;;
    --no-frontend) SKIP_FRONTEND=true ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Неизвестный аргумент: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
  shift
done

cd "$ROOT"

if [ -n "$(git status --porcelain)" ]; then
  echo "Внимание: есть незакоммиченные изменения (деплой идёт с текущего HEAD на remote после push)." >&2
fi

if [ "$SKIP_PUSH" = false ]; then
  echo "=== 1/3 git push ==="
  git push
fi

if [ "$SKIP_BACKEND" = false ]; then
  echo "=== 2/3 B3: git pull + API (миграции при старте контейнера) ==="
  ssh "$PI_SSH" "cd ~/${PI_PROJECT_DIR} && git pull && docker compose up -d --build"
  echo "Проверка API на Pi:"
  ssh "$PI_SSH" "curl -sf http://127.0.0.1:8000/health && echo"
fi

if [ "$SKIP_FRONTEND" = false ]; then
  echo "=== 3/3 Frontend ==="
  "$ROOT/scripts/deploy-frontend.sh"
fi

echo ""
echo "=== Готово ==="
echo "Прод API:  curl -s https://medicine.greemlab.ru/api/health"
echo "Локально:  ./scripts/api-tunnel.sh  и  ./scripts/dev-frontend.sh"
