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
