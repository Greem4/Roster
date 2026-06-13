#!/bin/sh
# Однократная миграция ~/RosterRx → ~/Roster на Pi: каталог, том PostgreSQL, Docker-сеть.
# Вызывается из internal/deploy-backend.sh, если на Pi ещё старый путь.
set -eu

OLD_DIR="${HOME}/RosterRx"
NEW_DIR="${HOME}/Roster"
OLD_VOL="rosterrx_pgdata"
NEW_VOL="roster_pgdata"
OLD_NET="rosterrx_default"

if [ -d "$NEW_DIR" ]; then
  echo "Уже есть ${NEW_DIR} — миграция не нужна."
  exit 0
fi

if [ ! -d "$OLD_DIR" ]; then
  echo "Нет ${OLD_DIR} — миграция не нужна."
  exit 0
fi

echo "Миграция RosterRx → Roster на Pi…"

if [ -f "${HOME}/server/docker-compose.yml" ]; then
  echo "Останавливаю Caddy…"
  (cd "${HOME}/server" && docker compose down) || true
fi

echo "Останавливаю API и БД (проект rosterrx)…"
(cd "$OLD_DIR" && docker compose -p rosterrx down) || true
for c in rosterrx-api-1 rosterrx-db-1; do
  docker rm -f "$c" 2>/dev/null || true
done

if docker volume inspect "$OLD_VOL" >/dev/null 2>&1; then
  if ! docker volume inspect "$NEW_VOL" >/dev/null 2>&1; then
    echo "Копирую том ${OLD_VOL} → ${NEW_VOL}…"
    docker volume create "$NEW_VOL"
    docker run --rm -v "${OLD_VOL}:/from:ro" -v "${NEW_VOL}:/to" alpine \
      sh -c 'cp -a /from/. /to/.'
  fi
fi

echo "Переименовываю ${OLD_DIR} → ${NEW_DIR}…"
mv "$OLD_DIR" "$NEW_DIR"

echo "Поднимаю API (сеть roster_default)…"
(cd "$NEW_DIR" && docker compose up -d --build)

if [ -f "${HOME}/server/docker-compose.yml" ]; then
  echo "Поднимаю Caddy…"
  (cd "${HOME}/server" && docker compose up -d)
fi

docker volume rm "$OLD_VOL" 2>/dev/null || true
docker network rm "$OLD_NET" 2>/dev/null || true

echo "Миграция завершена: ${NEW_DIR}"
