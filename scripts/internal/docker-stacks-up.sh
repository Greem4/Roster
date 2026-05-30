#!/bin/bash
# Поднимает Docker Compose-стеки на B3 после загрузки Pi.
# Страховка после отключения питания: docker.service уже enabled, контейнеры — restart: unless-stopped,
# но этот скрипт ещё раз вызывает compose up -d для всех каталогов.
#
# Устанавливается на Pi: ./scripts/setup/docker-autostart.sh
# Лог: ~/docker-stacks.log

set -euo pipefail

LOG="${HOME}/docker-stacks.log"

log() {
  echo "$(date -Iseconds) [docker-stacks] $*" | tee -a "$LOG"
}

# Ждём готовности Docker daemon (до 2 минут)
for _ in $(seq 1 60); do
  if docker info >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

if ! docker info >/dev/null 2>&1; then
  log "ERROR: Docker daemon не отвечает"
  exit 1
fi

stacks=(
  "${HOME}/RosterRx"
  "${HOME}/server"
  "${HOME}/singbox"
)

for dir in "${stacks[@]}"; do
  if [[ -f "$dir/docker-compose.yml" ]]; then
    log "up: $dir"
    if (cd "$dir" && docker compose up -d >>"$LOG" 2>&1); then
      log "ok: $dir"
    else
      log "WARN: ошибка в $dir"
    fi
  fi
done

log "done"
