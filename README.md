# RosterRx

Учёт лекарств с личным кабинетом и правами доступа.

## Как работаем (основной процесс)

| Часть | Где живёт | Как проверять | Как выкатить |
|-------|-----------|---------------|--------------|
| **API** | только B3 | уже на сервере после деплоя | `./scripts/deploy-backend.sh` |
| **Фронт** | сначала Mac | `./scripts/dev.sh` → http://localhost:5173 | `./scripts/deploy-frontend.sh` |

```bash
chmod +x scripts/dev.sh scripts/deploy-backend.sh scripts/deploy-frontend.sh
./scripts/dev.sh
```

Когда UI устраивает:

```bash
./scripts/deploy-frontend.sh
```

Cursor-агент после правок **API** сам запускает `deploy-backend.sh`; **фронт на сайт** — только если вы попросите.

**Один раз дома** (`scripts/setup/`):

```bash
./scripts/setup/ssh-key.sh           # SSH без пароля
./scripts/setup/vps-dev-ssh.sh      # деплой/import из интернета
./scripts/setup/vps-ssh-config.sh   # Host roster-pi-remote в ~/.ssh/config
./scripts/setup/docker-autostart.sh # Docker после reboot
./scripts/setup/caddy.sh            # Caddy на Pi
```

### Разработка вне дома

С интернета к Pi **напрямую не зайти** (CGNAT). Доступ только через **ваш** VPS и SSH-ключи:

| Что | Как | Кто может |
|-----|-----|-----------|
| Сайт / prod API | `https://medicine.greemlab.ru` | все с URL |
| SSH на Pi | `ProxyJump` → VPS → `127.0.0.1:22022` (туннель с Pi) | только ключи в `authorized_keys` на VPS и Pi |
| PostgreSQL | `127.0.0.1:5432` на Pi, с Mac — `./scripts/internal/tunnel-db.sh` | тот же SSH |
| Деплой API | `./scripts/deploy-backend.sh` | тот же SSH (auto: LAN или VPS hop) |

**Один раз дома** (Pi в LAN):

1. `./scripts/setup/ssh-key.sh` — ключ на Pi, без пароля SSH.
2. `./scripts/setup/vps-dev-ssh.sh` — Pi пробрасывает `127.0.0.1:22022` на VPS (не в интернет, только localhost VPS).
3. `./scripts/setup/vps-ssh-config.sh` — удобные Host `roster-vps` / `roster-pi-remote`.

**Вне дома** (кафе, LTE):

```bash
./scripts/deploy-backend.sh              # обновить API на Pi
./scripts/internal/tunnel-db.sh          # БД на localhost:5432 (в другом терминале)
./scripts/dev.sh                         # UI локально; API — prod, если Pi недоступна
```

Проверка доступа к Pi:

```bash
ssh roster-pi-remote 'hostname'
```

Безопасность: пароль SSH на Pi отключён; порты API/БД на Pi — `127.0.0.1`; порт `22022` на VPS слушает только `127.0.0.1` — сначала нужен SSH на VPS под **вашим** `root` (или другим пользователем с ключом), затем hop на Pi.

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
         │  dev.sh: SSH :8000 → API (разработка с Mac)
    Mac (Vite :5173)
```

| Роль | Где | Что делает |
|------|-----|------------|
| **VPS** | публичный IP | DNS, HTTPS, «витрина» в интернет |
| **Туннель Pi→VPS** | постоянный SSH | Проброс `VPS:127.0.0.1:18080` → `Pi:127.0.0.1:80` |
| **B3 (Pi)** | дома | PostgreSQL, API, Caddy, статика — **все данные** |
| **Mac** | dev | Туннель к API/БД на Pi; на прод не участвует |

На Pi **три Docker Compose** (все с `restart: unless-stopped`):

| Каталог | Сервисы |
|---------|---------|
| `~/RosterRx` | `db`, `api` |
| `~/server` | `caddy` (:80 — то, что видит туннель) |
| `~/singbox` | `sing-box` (VPN, `network_mode: host`) |

**Важно:**

- База **только на Pi**; на VPS данных нет.
- PostgreSQL и API на Pi слушают **127.0.0.1** ([docker-compose.yml](docker-compose.yml)).
- С LTE сайт открывается **не из‑за проброса портов на роутере**, а потому что Pi **сама** держит исходящий туннель на VPS.
- С Mac: `dev.sh` — туннель к API на Pi или prod API вне дома.

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
| Автозапуск | `crontab` пользователя `greem4` (`@reboot` → `start-vps-tunnel.sh`) |

**Pi — автозапуск Docker после перезагрузки / отключения питания:**

| Что | Путь / команда |
|-----|----------------|
| `docker.service` | `systemctl enable docker` — уже в автозагрузке |
| Скрипт стеков | `/home/greem4/bin/docker-stacks-up.sh` (из `scripts/internal/`) |
| Лог | `/home/greem4/docker-stacks.log` |
| Автозапуск | `crontab`: `@reboot sleep 45 && /home/greem4/bin/docker-stacks-up.sh` |
| Установка с Mac | `./scripts/setup/docker-autostart.sh` |
| Опционально systemd | `scripts/internal/docker-stacks.service` |

После загрузки Pi: `docker.service` поднимает контейнеры с `unless-stopped`; через ~45 с crontab ещё раз вызывает `docker compose up -d` для `~/RosterRx`, `~/server`, `~/singbox`.

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

# Docker-стеки на Pi
ssh greem4@192.168.31.96 "docker ps --format 'table {{.Names}}\t{{.Status}}'"
ssh greem4@192.168.31.96 "tail -20 ~/docker-stacks.log"
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
7. Если после отключения света контейнеры не поднялись: `ssh greem4@192.168.31.96 "/home/greem4/bin/docker-stacks-up.sh"` или `./scripts/setup/docker-autostart.sh`.

---

## B3: SSH и sudo

| Что | Как настроено |
|-----|----------------|
| **SSH по ключу** | `./scripts/setup/ssh-key.sh` → Host `roster-b3` |
| **Пароль SSH** | отключён на Pi (`PasswordAuthentication no`) — без ключа не войти |
| **`sudo` на Pi** | **отдельно** от SSH-ключа; для systemd/Cursor-агента нужен пароль или `NOPASSWD` в `/etc/sudoers.d/` |

Проверка ключа с Mac:

```bash
ssh -o BatchMode=yes greem4@192.168.31.96 'echo OK'
```

Если «не пускает» — это обычно не слетевший ключ, а другой хост/устройство без ключа в `authorized_keys`, или запрос **пароля sudo** (не SSH).

---

## B3: первый запуск

На Pi в каталоге проекта (обычно `~/RosterRx`, клон репозитория):

```bash
cp .env.example .env
# Заполнить POSTGRES_PASSWORD, JWT_SECRET, CORS_ORIGINS=https://medicine.greemlab.ru

docker compose up -d --build
curl http://127.0.0.1:8000/health
```

С Mac (после `./scripts/setup/ssh-key.sh`):

```bash
./scripts/setup/docker-autostart.sh
./scripts/setup/caddy.sh
./scripts/deploy-frontend.sh
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

Импорт лекарств: `./scripts/internal/import.sh` (туннель к БД сам).

Для ручного `pg_dump` (порт 5432 должен быть открыт, например после import):

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

6. На новой Pi: `~/server` + `./scripts/setup/caddy.sh` + `./scripts/deploy-frontend.sh`, туннель Pi→VPS, `./scripts/setup/docker-autostart.sh`.
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
| Автозапуск Docker | `~/bin/docker-stacks-up.sh`, crontab | после reboot / отключения питания |
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

## Mac: команды

| Команда | Назначение |
|---------|------------|
| `./scripts/dev.sh` | UI локально (дома — API с Pi, вне дома — prod) |
| `./scripts/deploy-backend.sh` | API на малинку (дома и вне дома) |
| `./scripts/deploy-frontend.sh` | Фронт на сайт |

**Редко (`scripts/internal/`):** `tunnel-db.sh` — PostgreSQL → `127.0.0.1:5432`; `import.sh` — перезаливка лекарств из JSON.

**Один раз дома** — каталог `scripts/setup/`:

| Скрипт | Назначение |
|--------|------------|
| `setup/ssh-key.sh` | SSH-ключ на Pi |
| `setup/vps-dev-ssh.sh` | проброс SSH Pi→VPS (`:22022`, деплой вне дома) |
| `setup/vps-ssh-config.sh` | `~/.ssh/config`: `roster-pi-remote` |
| `setup/docker-autostart.sh` | Docker после reboot |
| `setup/caddy.sh` | Caddy на Pi |

Внутренние (`scripts/internal/`) — не запускать вручную, кроме import.

---

## Права

| Кто | Что |
|-----|-----|
| Гость | Просмотр списка лекарств |
| Вошедший активный пользователь | Личный кабинет, алерты |
| Админ (`users:manage` или `admin`) | Пользователи, правки лекарств |

API снаружи: префикс `/api` (Caddy). Эндпоинты: `/auth/*`, `/medicines`, `/alerts/expiring`, `/users`.
