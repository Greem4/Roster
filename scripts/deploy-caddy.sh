#!/bin/sh
# Caddy + proxy /api на B3 (~/server)
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PI_SSH="${PI_SSH:-greem4@192.168.31.96}"

echo "Копирование Caddyfile и docker-compose.yml -> ${PI_SSH}:~/server/"
rsync -avz "$ROOT/server/caddy/Caddyfile" "${PI_SSH}:server/caddy/Caddyfile"
rsync -avz "$ROOT/server/docker-compose.yml" "${PI_SSH}:server/docker-compose.yml"

echo "Перезапуск Caddy…"
ssh "$PI_SSH" 'cd ~/server && docker compose up -d && (docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile 2>/dev/null || docker compose restart caddy)'

echo "Проверка API через Caddy:"
ssh "$PI_SSH" 'curl -sf http://127.0.0.1/api/health && echo'
