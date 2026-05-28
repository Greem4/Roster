# RosterRx

Учёт лекарств с личным кабинетом и правами доступа.

## Одна база PostgreSQL на B3

PostgreSQL **только один** — в Docker на **B3 (Pi)**. И прод, и локальная разработка ходят в **эту же** БД.

```
┌─────────────┐     SSH :5432      ┌──────────────────────────┐
│  Mac (dev)  │ ────────────────►  │  B3 (Pi)                 │
│  Vite :5173 │                    │  Docker: postgres :5432  │
│  API :8000  │                    │  Docker: api     :8000   │
└─────────────┘                    │  nginx :80 → сайт        │
                                   └──────────────────────────┘
┌─────────────┐                    ▲
│  Прод (web) │ ───────────────────┘  тот же postgres + api на Pi
└─────────────┘
```

На B3 postgres слушает **127.0.0.1:5432** (в интернет не светится). С Mac — **SSH-туннель** на `localhost:5432`.

---

## B3 (Pi): первый запуск и прод

На сервере в каталоге проекта:

```bash
cp .env.example .env
# POSTGRES_PASSWORD, JWT_SECRET, CORS_ORIGINS=https://medicine.greemlab.ru

docker compose up -d --build
curl http://127.0.0.1:8000/health
```

`DATABASE_URL` для контейнера `api` подставляет [docker-compose.yml](docker-compose.yml) (`@db:5432`).

Фронт и Caddy (с Mac):

```bash
chmod +x scripts/deploy-all.sh scripts/deploy-caddy.sh scripts/deploy-frontend.sh
./scripts/deploy-all.sh        # push + API на B3 + фронт (типовой цикл после коммита)
./scripts/deploy-caddy.sh      # proxy /api/ → контейнер api (один раз или после смены Caddyfile)
./scripts/deploy-frontend.sh   # только сборка → ~/server/www на B3
```

Проверка: `curl -s https://medicine.greemlab.ru/api/health` → JSON `{"status":"ok"}`.

На B3 вручную: статика в `~/server/www`, Caddy — `~/server` (`server/caddy/Caddyfile` в репозитории).

Вход: `admin` / `admin` — затем сменить пароль.

**Бэкап БД (только на B3):**

```bash
docker compose exec db pg_dump -U roster roster > backup.sql
```

**Не выполняйте** `docker compose down -v` без необходимости — удалит данные на Pi.

---

## Mac: SSH без пароля (один раз)

Скрипты ходят на Pi по SSH (туннель к БД/API). Чтобы не вводить пароль каждый раз:

```bash
chmod +x scripts/setup-ssh-key.sh
./scripts/setup-ssh-key.sh
# в .env: PI_SSH=roster-b3
```

---

## Mac: быстро открыть localhost с логикой как на проде

API уже на B3 (после деплоя). Два терминала, **без** `.env` и без локального Python:

```bash
./scripts/api-tunnel.sh      # терминал 1 — пароль SSH только если ключ ещё не настроен
./scripts/dev-frontend.sh    # терминал 2
```

http://localhost:5173 — обычный пользователь видит лекарства; правки — только у админа (`users:manage` или `admin`).

---

## Mac: локальная разработка backend

**Один терминал** — свой API на Mac (hot-reload), БД та же на B3:

```bash
cp .env.example .env
# В .env раскомментируйте DATABASE_URL (пароль postgres с B3, не SSH)

chmod +x scripts/dev-local.sh
./scripts/dev-local.sh
```

Откройте **http://localhost:5173** — правки в `backend/` и `frontend/` видны сразу, без деплоя.

Быстрая проверка перед выкладкой:

```bash
./scripts/dev-local.sh --check
```

Нужен **Python 3.12** (`brew install python@3.12`, в скрипте `PYTHON=python3.12`). На 3.14 venv может не собраться.

### Только UI, API как на проде (backend не тестируется)

Два терминала — туннель к API на B3, затем Vite:

```bash
./scripts/api-tunnel.sh      # терминал 1
./scripts/dev-frontend.sh    # терминал 2
```

На B3: `docker compose up -d` в `~/RosterRx`.

### Вручную: туннель к БД + API отдельно

```bash
./scripts/db-tunnel.sh       # терминал 1
./scripts/dev-api.sh         # терминал 2 (нужен .env с DATABASE_URL)
./scripts/dev-frontend.sh    # терминал 3
```

---

## Важно

| Где | PostgreSQL | API |
|-----|------------|-----|
| B3 | `docker compose up` (сервис `db`) | `docker compose up` (сервис `api`) |
| Mac | туннель `:5432` | **`dev-local.sh`** (свой API) или `dev-api.sh` |

Миграции на B3 — при старте контейнера `api`. С Mac — `./scripts/dev-api.sh` (alembic перед uvicorn) против **той же** БД через туннель.

Данные, созданные локально, сразу видны на проде и наоборот.

### Деплой backend на B3 (без git)

После правок API с Mac — сразу на Pi (rsync + пересборка):

```bash
./scripts/deploy-backend.sh
```

Использует Cursor-агент по правилу `.cursor/rules/api-auto-deploy-b3.mdc`.

### Деплой «всё сразу» после коммита

```bash
git add -A && git commit -m "…"
./scripts/deploy-all.sh
```

Скрипт: `git push` → на Pi `git pull` и `docker compose up -d --build` → `deploy-frontend.sh`.

Опции: `--no-push`, `--no-backend`, `--no-frontend`.

---

## Права и API

| Код | Назначение |
|-----|------------|
| — | Список лекарств на сайте — **без входа** (публично) |
| активный пользователь | Личный кабинет, алерты (после входа и активации) |
| `users:manage` | Админ: пользователи, добавление/изменение/удаление лекарств |
| супер-админ (`admin`) | Всё, включая правки лекарств |

API: `/auth/*`, `/medicines`, `/alerts/expiring`, `/users` — снаружи префикс `/api` (nginx).

## Позже

- Email при истечении срока годности
