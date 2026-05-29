# RosterRx

Учёт лекарств с личным кабинетом и правами доступа.

## Как работаем (основной процесс)

| Часть | Где живёт | Как проверять | Как выкатить |
|-------|-----------|---------------|--------------|
| **API** | только B3 | уже на сервере после деплоя | `./scripts/deploy-backend.sh` |
| **Фронт** | сначала Mac | `./scripts/dev-ui.sh` → http://localhost:5173 (с телефона в той же Wi‑Fi — `http://<IP-Mac>:5173`) | `./scripts/deploy-frontend.sh` |

**Один терминал для UI** (API с Pi по туннелю, React с hot-reload):

```bash
chmod +x scripts/dev-ui.sh scripts/deploy-backend.sh scripts/deploy-frontend.sh
./scripts/dev-ui.sh
```

Когда UI устраивает:

```bash
./scripts/deploy-frontend.sh
```

Cursor-агент после правок **API** сам запускает `deploy-backend.sh`; **фронт на сайт** — только если вы попросите.

SSH без пароля (один раз): `./scripts/setup-ssh-key.sh`, в `.env` можно `PI_SSH=roster-b3`.

---

## Архитектура: VPS + туннель + B3

У провайдера **серый IP (CGNAT)** — с интернета на домашнюю Pi напрямую не зайти. Поэтому схема такая:

**Интернет → VPS (белый IP, HTTPS) → reverse SSH-туннель → B3 (Pi, данные и приложение).**

```
  Телефон / браузер
         │
         ▼
  medicine.greemlab.ru  (DNS → IP VPS, не дома)
         │
         ▼
┌─────────────────────────────────────┐
│  VPS (Ubuntu, nginx :443)           │
│  Let's Encrypt на домене              │
│  proxy_pass → 127.0.0.1:18080       │  ◄── порт туннеля на VPS
└─────────────────┬───────────────────┘
                  │  reverse SSH (Pi сам подключается наружу)
                  ▼
┌─────────────────────────────────────┐
│  B3 — Pi 192.168.31.96              │
│  Caddy :80  ← туннель сюда          │
│    /      → ~/server/www            │
│    /api/* → контейнер api:8000      │
│  ~/RosterRx: postgres + FastAPI     │
└─────────────────────────────────────┘
         ▲
         │  dev-ui.sh: SSH :8000 → API (разработка с Mac)
    Mac (Vite :5173)
```

| Роль | Где | Что делает |
|------|-----|------------|
| **VPS** | публичный IP | DNS, HTTPS, «витрина» в интернет |
| **Туннель Pi→VPS** | постоянный SSH | Проброс `VPS:127.0.0.1:18080` → `Pi:127.0.0.1:80` |
| **B3 (Pi)** | дома | PostgreSQL, API, Caddy, статика — **все данные** |
| **Mac** | dev | Туннель к API/БД на Pi; на прод не участвует |

На Pi **два Docker Compose**:

| Каталог | Сервисы |
|---------|---------|
| `~/RosterRx` | `db`, `api` |
| `~/server` | `caddy` (:80 — то, что видит туннель) |

**Важно:**

- База **только на Pi**; на VPS данных нет.
- PostgreSQL и API на Pi слушают **127.0.0.1** ([docker-compose.yml](docker-compose.yml)).
- С LTE сайт открывается **не из‑за проброса портов на роутере**, а потому что Pi **сама** держит исходящий туннель на VPS.
- С Mac: `dev-ui.sh` — отдельный SSH-туннель к API на Pi (для разработки, не путать с VPS-туннелем).

Переменные на Pi: [.env.example](.env.example) (`POSTGRES_*`, `JWT_SECRET`, `CORS_ORIGINS`).

### VPS и туннель (как настроено)

| Параметр | Значение |
|----------|----------|
| Домен | `medicine.greemlab.ru` |
| VPS | `176.12.65.86` (Ubuntu 24.04) |
| Pi (LAN) | `192.168.31.96` |
| Порт на VPS (backend туннеля) | `127.0.0.1:18080` |
| Веб на Pi (куда смотрит туннель) | `127.0.0.1:80` (Caddy) |

**DNS (Beget):** `A` `medicine` → `176.12.65.86`. Старую `CNAME` на GitHub Pages держать выключенной.

**VPS:** nginx, certbot, fail2ban. Vhost `/etc/nginx/sites-available/medicine.greemlab.ru` → `proxy_pass http://127.0.0.1:18080`. SSL: `/etc/letsencrypt/live/medicine.greemlab.ru/`, автопродление `certbot.timer`.

**Pi — постоянный reverse-туннель:**

| Что | Путь |
|-----|------|
| Ключ | `/home/greem4/.ssh/id_ed25519_vps_tunnel` (на VPS — пользователь `tunnel`) |
| env | `/home/greem4/.config/vps-tunnel/env` |
| Скрипт | `/home/greem4/.local/bin/start-vps-tunnel.sh` |
| Лог | `/home/greem4/.config/vps-tunnel/tunnel.log` |
| Автозапуск | `crontab` пользователя `greem4` |

Конфиги туннеля и nginx на VPS **вне этого git-репозитория** — на машинах; здесь только приложение RosterRx.

### Быстрые проверки

```bash
# DNS → VPS
dig +short medicine.greemlab.ru @8.8.8.8

# HTTPS снаружи
curl -I https://medicine.greemlab.ru
curl -s https://medicine.greemlab.ru/api/health

# Туннель на VPS
ssh root@176.12.65.86 "ss -tulpen | sed -n '/127.0.0.1:18080/p'"
ssh root@176.12.65.86 "curl -I http://127.0.0.1:18080"

# Процесс на Pi
ssh greem4@192.168.31.96 "pgrep -af start-vps-tunnel.sh"
```

### Если сайт с LTE не открывается

1. `dig` — домен на IP VPS.
2. На VPS: `nginx -t && systemctl reload nginx`.
3. На VPS: слушается ли `127.0.0.1:18080`.
4. На Pi перезапустить туннель:

   ```bash
   ssh greem4@192.168.31.96 "pkill -f start-vps-tunnel.sh || true; nohup /home/greem4/.local/bin/start-vps-tunnel.sh >>/home/greem4/.config/vps-tunnel/tunnel.log 2>&1 &"
   ```

5. Лог: `ssh greem4@192.168.31.96 "tail -80 /home/greem4/.config/vps-tunnel/tunnel.log"`
6. На Pi: `docker compose -f ~/RosterRx/docker-compose.yml ps` и Caddy в `~/server`.

---

## B3: первый запуск

На Pi в каталоге проекта (обычно `~/RosterRx`, клон репозитория):

```bash
cp .env.example .env
# Заполнить POSTGRES_PASSWORD, JWT_SECRET, CORS_ORIGINS=https://medicine.greemlab.ru

docker compose up -d --build
curl http://127.0.0.1:8000/health
```

С Mac (после `./scripts/setup-ssh-key.sh`):

```bash
./scripts/deploy-caddy.sh      # один раз или после смены Caddyfile
./scripts/deploy-frontend.sh   # сборка React → ~/server/www на Pi
```

Проверка снаружи: `curl -s https://medicine.greemlab.ru/api/health`

Первый вход: `admin` / `admin` — сразу сменить пароль.

**Не выполняйте** `docker compose down -v` в `~/RosterRx` — удалит том `pgdata` и все данные.

---

## Бэкап и перенос на другой хост

Рекомендуемый способ — **дамп SQL** (лёгкий перенос). Тяжёлый вариант — копирование Docker-тома `pgdata` (ниже).

### 1. Бэкап на текущем B3

На Pi в `~/RosterRx`:

```bash
docker compose exec -T db pg_dump -U roster roster > backup-$(date +%Y%m%d).sql
```

Скопировать файл на Mac (подставьте свой `PI_SSH`):

```bash
scp roster-b3:~/RosterRx/backup-*.sql ./
```

С Mac, пока открыт `./scripts/db-tunnel.sh`, можно и так:

```bash
pg_dump -h 127.0.0.1 -U roster roster > backup.sql
```

### 2. Новый сервер (новая Pi, VPS, облако)

1. Установить Docker, склонировать репозиторий в `~/RosterRx`.
2. Скопировать **старый** `.env` (те же `POSTGRES_PASSWORD` и `JWT_SECRET`, иначе пользователи с существующими JWT не войдут; пароли в БД сохранятся из дампа).
3. Поднять только БД и дождаться healthcheck:

   ```bash
   cd ~/RosterRx
   docker compose up -d db
   ```

4. Восстановить дамп (**API пока не запускать**, чтобы Alembic не создал пустые таблицы поверх):

   ```bash
   docker compose exec -T db psql -U roster roster < backup-YYYYMMDD.sql
   ```

5. Поднять API (миграции дойдут до `head` и ничего не сломают, если схема уже из дампа):

   ```bash
   docker compose up -d --build api
   curl http://127.0.0.1:8000/health
   ```

6. На новой Pi: `~/server` + `./scripts/deploy-caddy.sh` + `./scripts/deploy-frontend.sh`, **заново поднять reverse-туннель на VPS** (`start-vps-tunnel.sh`, crontab).
7. **VPS не переезжает** — DNS по-прежнему на `176.12.65.86`; nginx всё так же на `127.0.0.1:18080`.
8. Проверка: блок «Быстрые проверки» выше + вход на сайт.

### 3. Что ещё сохранить при переезде

| Что | Где | Зачем |
|-----|-----|--------|
| `.env` | `~/RosterRx/.env` | пароль БД, JWT, CORS |
| `backup-*.sql` | дамп | лекарства, пользователи, alembic_version |
| `~/server/www` | статика фронта | можно пересобрать `deploy-frontend.sh` |
| `~/server/caddy/` | Caddyfile | есть в репозитории `server/` |
| Туннель Pi→VPS | `~/.config/vps-tunnel/`, `start-vps-tunnel.sh` | без туннеля сайт с интернета мёртв |
| VPS nginx + Let's Encrypt | `/etc/nginx`, `/etc/letsencrypt` | бэкапить при смене VPS |

### 4. Тяжёлый путь: том PostgreSQL целиком

Если нужна побайтовая копия диска БД (редко):

```bash
cd ~/RosterRx
docker compose stop api
docker compose exec db pg_dump -U roster roster > backup.sql   # страховка
docker compose stop db

# имя тома: обычно rosterrx_pgdata или <имя_проекта>_pgdata — смотреть: docker volume ls
docker run --rm -v rosterrx_pgdata:/data -v "$PWD":/backup alpine \
  tar czf /backup/pgdata.tar.gz -C /data .

# на новой машине — после первого docker compose up -d db (пустой том):
docker compose stop db
docker run --rm -v rosterrx_pgdata:/data -v "$PWD":/backup alpine \
  sh -c "cd /data && tar xzf /backup/pgdata.tar.gz"
docker compose up -d
```

После такого переноса всё равно проверьте `curl …/api/health` и выборочно данные в UI.

---

## Mac: разработка

| Режим | Команда | Когда |
|-------|---------|--------|
| UI, API как на проде | `./scripts/dev-ui.sh` | обычная работа над фронтом |
| Backend на Mac | `./scripts/dev-local.sh` | правки Python, hot-reload; БД на Pi через туннель :5432 |
| Только туннель к БД | `./scripts/db-tunnel.sh` | `psql`, ручные миграции, `pg_dump` с Mac |
| API-туннель + Vite вручную | `api-tunnel.sh` + `dev-frontend.sh` | то же, что dev-ui, но два терминала |

Для `dev-local.sh`: в `.env` раскомментировать `DATABASE_URL=postgresql://roster:ПАРОЛЬ@127.0.0.1:5432/roster` (пароль как на Pi). Нужен Python 3.12.

Данные, созданные локально через API на Pi или через `dev-local.sh`, сразу видны на проде — одна БД.

---

## Скрипты

| Скрипт | Назначение |
|--------|------------|
| `dev-ui.sh` | Фронт локально + туннель API на B3 |
| `dev-local.sh` | API на Mac + туннель БД на B3 |
| `db-tunnel.sh` | PostgreSQL Pi → `localhost:5432` |
| `api-tunnel.sh` | API Pi → `localhost:8000` |
| `deploy-backend.sh` | rsync backend + `docker compose up -d --build api` на Pi |
| `deploy-frontend.sh` | `npm run build` → `~/server/www` |
| `deploy-caddy.sh` | Caddyfile и compose в `~/server` |
| `deploy-all.sh` | `git push` → на Pi `git pull` + API + фронт (`--no-push`, `--no-backend`, `--no-frontend`) |
| `setup-ssh-key.sh` | SSH-ключ, Host `roster-b3` |
| `import-medicines-invoices.py` | разовый импорт из JSON в medicines (нужен API/туннель) |

---

## Права

| Кто | Что |
|-----|-----|
| Гость | Просмотр списка лекарств |
| Вошедший активный пользователь | Личный кабинет, алерты |
| Админ (`users:manage` или `admin`) | Пользователи, правки лекарств |

API снаружи: префикс `/api` (Caddy). Эндпоинты: `/auth/*`, `/medicines`, `/alerts/expiring`, `/users`.
