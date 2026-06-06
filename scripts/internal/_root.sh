# Корень репозитория и каталог scripts/ — подключать первым из internal/*.sh
INTERNAL="$(cd "$(dirname "$0")" && pwd)"
SCRIPTS="$(cd "$INTERNAL/.." && pwd)"
ROOT="$(cd "$SCRIPTS/.." && pwd)"

roster_load_env() {
  if [ -f "$ROOT/.env" ]; then
    set -a
    # shellcheck disable=SC1091
    . "$ROOT/.env"
    set +a
  fi
}

# npm ci для frontend: пустой node_modules после сбоя или lockfile новее установки.
frontend_npm_ci_if_needed() {
  cd "$ROOT/frontend"
  if [ ! -x node_modules/.bin/vite ] || [ ! -f node_modules/.package-lock.json ] \
    || [ package-lock.json -nt node_modules/.package-lock.json ]; then
    npm ci
  fi
}
