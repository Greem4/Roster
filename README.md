# Roster

Единая платформа с общим кабинетом и правами доступа. Четыре модуля:

| Модуль | Назначение |
|--------|------------|
| **RosterDuty** | график дежурств (в разработке) |
| **RosterCA** | календарь (в разработке) |
| **RosterPay** | учёт счетов и остатков |
| **RosterRX** | реестр и сводка по средствам |

Каталог проекта на Pi: `~/Roster`; локальная копия — `AndroidStudioProjects/Roster`.

## Содержание

| Раздел | О чём |
|--------|--------|
| [Как работаем](#как-работаем-основной-процесс) | dev, деплой API и фронта |
| [**SSH на Pi (дома и вне дома)**](#ssh-на-pi-дома-и-вне-дома) | **`192.168.31.96` не работает с LTE** — как зайти через VPS |
| [Архитектура: VPS + туннель + B3](#архитектура-vps--туннель--b3) | схема, DNS, проверки сайта |
| [B3: SSH и sudo](#b3-ssh-и-sudo) | ключи, sudo (кратко → см. раздел SSH) |
| [B3: первый запуск](#b3-первый-запуск) | docker compose, Caddy |
| [Бэкап и перенос](#бэкап-и-перенос-на-другой-хост) | pg_dump, переезд Pi |
| [Mac: команды](#mac-команды) | все скрипты в `scripts/` |

---

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

**Один раз дома** — см. [SSH на Pi](#ssh-на-pi-дома-и-вне-дома) и [Mac: команды → setup](#mac-команды).

**Вне дома** (кафе, LTE): SSH на Pi — **`ssh roster-pi-remote`**, не `greem4@192.168.31.96`. Деплой и туннель БД — те же `./scripts/deploy-backend.sh` и `./scripts/internal/tunnel-db.sh` (маршрут выбирается автоматически). Подробно — ниже ↓

---

## SSH на Pi (дома и вне дома)

> **Коротко:** дома — `ssh greem4@192.168.31.96` или `ssh roster-b3`. **Вне дома** — только **`ssh roster-pi-remote`**. Адрес `192.168.31.96` с интернета/LTE **не маршрутизируется** (домашняя LAN + CGNAT у провайдера).

### Какую команду использовать

| Где вы | SSH на Pi | Проверка |
|--------|-----------|----------|
| **Дома** (та же Wi‑Fi, что Pi) | `ssh greem4@192.168.31.96` или `ssh roster-b3` | `ssh roster-b3 'hostname'` |
| **Вне дома** (кафе, LTE, офис) | **`ssh roster-pi-remote`** | `ssh roster-pi-remote 'hostname'` |
| Сайт / prod API (откуда угодно) | не нужен SSH | `https://medicine.greemlab.ru` |

Почему не `ssh greem4@192.168.31.96` с LTE: это **локальный** адрес роутера; снаружи виден только **VPS** (`176.12.65.86`). Pi сама держит **reverse SSH** на VPS; вы заходите цепочкой **Mac → VPS → туннель → Pi**.

```
Mac (вне дома)  ──SSH──►  VPS 176.12.65.86  ──127.0.0.1:22022──►  Pi greem4@192.168.31.96
```

Эквивалент без алиаса в `~/.ssh/config`:

```bash
ssh -J root@176.12.65.86 -p 22022 greem4@127.0.0.1
```

### Один раз настроить (только из домашней Wi‑Fi)

Порядок важен — выполнять на Mac, пока Pi доступна по LAN:

```bash
./scripts/setup/ssh-key.sh           # 1. ключ на Pi → Host roster-b3
./scripts/setup/vps-dev-ssh.sh       # 2. Pi пробросит SSH на VPS (порт 22022 на localhost VPS)
./scripts/setup/vps-ssh-config.sh    # 3. Host roster-vps и roster-pi-remote в ~/.ssh/config
```

Опционально в `.env` проекта: `PI_SSH=roster-pi-remote` — тогда деплой/import с Mac вне дома не ищут LAN.

### Команды с Mac после настройки

| Задача | Дома | Вне дома |
|--------|------|----------|
| Интерактивный SSH | `ssh roster-b3` | **`ssh roster-pi-remote`** |
| Деплой API | `./scripts/deploy-backend.sh` | то же (auto: LAN или VPS) |
| Туннель PostgreSQL | `./scripts/internal/tunnel-db.sh` | то же |
| Локальный UI | `./scripts/dev.sh` | `./scripts/dev.sh` (API с prod, если Pi недоступна) |

### Если не пускает

1. **Вне дома, «Connection refused» на 22022** — туннель с Pi на VPS не поднят (Pi выключена, нет интернета дома, или не делали `vps-dev-ssh.sh`). Проверка **с VPS** (нужен ваш ключ на VPS):

   ```bash
   ssh root@176.12.65.86 "ss -tln | grep 22022"
   ```

   Перезапуск туннеля — **только из домашней LAN** (или попросить кого-то дома):

   ```bash
   ssh greem4@192.168.31.96 "pkill -f start-vps-tunnel.sh || true; nohup /home/greem4/.local/bin/start-vps-tunnel.sh >>/home/greem4/.config/vps-tunnel/tunnel.log 2>&1 &"
   ```

2. **Дома, «Permission denied»** — нет ключа: `./scripts/setup/ssh-key.sh`. Пароль SSH на Pi **отключён**.

3. **SSH есть, но sudo просит пароль** — это не SSH; для systemd нужен пароль `greem4` или `NOPASSWD` в `/etc/sudoers.d/`.

4. Лог туннеля на Pi: `ssh greem4@192.168.31.96 "tail -40 ~/.config/vps-tunnel/tunnel.log"` (только из LAN).

Безопасность: порт `22022` на VPS слушает **только** `127.0.0.1`; сначала SSH на VPS под **вашим** пользователем с ключом, затем hop на Pi. API и PostgreSQL на Pi — тоже `127.0.0.1`.

Схема сайта и веб-туннеля (`:18080`) — в [Архитектура](#архитектура-vps--туннель--b3).

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
│  ~/Roster: postgres + FastAPI     │
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

На Pi **два Docker Compose** (все с `restart: unless-stopped`):

| Каталог | Сервисы |
|---------|---------|
| `~/Roster` | `db`, `api` |
| `~/server` | `caddy` (:80 — то, что видит туннель) |

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

После загрузки Pi: `docker.service` поднимает контейнеры с `unless-stopped`; через ~45 с crontab ещё раз вызывает `docker compose up -d` для `~/Roster`, `~/server`.

Конфиги туннеля и nginx на VPS **вне этого git-репозитория** — на машинах; здесь только приложение Roster.

### Быстрые проверки

```bash
# SSH на Pi (вне дома — roster-pi-remote; дома — roster-b3 или greem4@192.168.31.96)
ssh roster-pi-remote 'hostname && docker ps --format "table {{.Names}}\t{{.Status}}"'
# см. также раздел «SSH на Pi»

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
6. На Pi: `docker compose -f ~/Roster/docker-compose.yml ps` и Caddy в `~/server`.
7. Если после отключения света контейнеры не поднялись: `ssh greem4@192.168.31.96 "/home/greem4/bin/docker-stacks-up.sh"` или `./scripts/setup/docker-autostart.sh`.

SSH с Mac вне дома — [раздел SSH на Pi](#ssh-на-pi-дома-и-вне-дома).

---

## B3: SSH и sudo

Команды и сценарии «дома / вне дома» — в разделе [**SSH на Pi**](#ssh-на-pi-дома-и-вне-дома).

| Что | Как настроено |
|-----|----------------|
| **SSH по ключу (LAN)** | `./scripts/setup/ssh-key.sh` → Host `roster-b3` |
| **SSH вне дома** | `./scripts/setup/vps-dev-ssh.sh` + `vps-ssh-config.sh` → `roster-pi-remote` |
| **Пароль SSH** | отключён на Pi — без ключа не войти |
| **`sudo` на Pi** | отдельно от SSH-ключа; для systemd нужен пароль или `NOPASSWD` |

Проверка ключа **дома**:

```bash
ssh -o BatchMode=yes roster-b3 'echo OK'
```

---

## B3: первый запуск

На Pi в каталоге проекта (обычно `~/Roster`, клон репозитория):

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

**Не выполняйте** `docker compose down -v` в `~/Roster` — удалит том `pgdata` и все данные.

---

## Бэкап и перенос на другой хост

Рекомендуемый способ — **дамп SQL** (лёгкий перенос). Тяжёлый вариант — копирование Docker-тома `pgdata` (ниже).

### 1. Бэкап на текущем B3

На Pi в `~/Roster`:

```bash
docker compose exec -T db pg_dump -U roster roster > backup-$(date +%Y%m%d).sql
```

Скопировать файл на Mac (подставьте свой `PI_SSH`):

```bash
scp roster-b3:~/Roster/backup-*.sql ./
```

Импорт лекарств: `./scripts/internal/import.sh` (туннель к БД сам).

Для ручного `pg_dump` (порт 5432 должен быть открыт, например после import):

```bash
pg_dump -h 127.0.0.1 -U roster roster > backup.sql
```

### 2. Новый сервер (новая Pi, VPS, облако)

1. Установить Docker, склонировать репозиторий в `~/Roster`.
2. Скопировать **старый** `.env` (те же `POSTGRES_PASSWORD` и `JWT_SECRET`, иначе пользователи с существующими JWT не войдут; пароли в БД сохранятся из дампа).
3. Поднять только БД и дождаться healthcheck:

   ```bash
   cd ~/Roster
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
| `.env` | `~/Roster/.env` | пароль БД, JWT, CORS |
| `backup-*.sql` | дамп | лекарства, пользователи, alembic_version |
| `~/server/www` | статика фронта | можно пересобрать `deploy-frontend.sh` |
| `~/server/caddy/` | Caddyfile | есть в репозитории `server/` |
| Туннель Pi→VPS | `~/.config/vps-tunnel/`, `start-vps-tunnel.sh` | без туннеля сайт с интернета мёртв |
| Автозапуск Docker | `~/bin/docker-stacks-up.sh`, crontab | после reboot / отключения питания |
| VPS nginx + Let's Encrypt | `/etc/nginx`, `/etc/letsencrypt` | бэкапить при смене VPS |

### 4. Тяжёлый путь: том PostgreSQL целиком

Если нужна побайтовая копия диска БД (редко):

```bash
cd ~/Roster
docker compose stop api
docker compose exec db pg_dump -U roster roster > backup.sql   # страховка
docker compose stop db

# имя тома: обычно roster_pgdata или <имя_проекта>_pgdata — смотреть: docker volume ls
docker run --rm -v roster_pgdata:/data -v "$PWD":/backup alpine \
  tar czf /backup/pgdata.tar.gz -C /data .

# на новой машине — после первого docker compose up -d db (пустой том):
docker compose stop db
docker run --rm -v roster_pgdata:/data -v "$PWD":/backup alpine \
  sh -c "cd /data && tar xzf /backup/pgdata.tar.gz"
docker compose up -d
```

После такого переноса всё равно проверьте `curl …/api/health` и выборочно данные в UI.

---

## Mac: команды

SSH **дома / вне дома** — [раздел SSH на Pi](#ssh-на-pi-дома-и-вне-дома).

| Команда | Назначение |
|---------|------------|
| `./scripts/dev.sh` | UI локально (дома — API с Pi, вне дома — prod) |
| `./scripts/deploy-backend.sh` | API на малинку (дома и вне дома) |
| `./scripts/deploy-frontend.sh` | Фронт на сайт |

**Редко (`scripts/internal/`):** `tunnel-db.sh` — PostgreSQL → `127.0.0.1:5432`; `import.sh` — перезаливка лекарств из JSON.

**Один раз дома** — каталог `scripts/setup/` (подробнее в [SSH на Pi → настройка](#один-раз-настроить-только-из-домашней-wi-fi)):

| Скрипт | Назначение |
|--------|------------|
| `setup/ssh-key.sh` | SSH-ключ на Pi → `roster-b3` |
| `setup/vps-dev-ssh.sh` | проброс SSH Pi→VPS (`:22022`, вход вне дома) |
| `setup/vps-ssh-config.sh` | `~/.ssh/config`: **`roster-pi-remote`** |
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
