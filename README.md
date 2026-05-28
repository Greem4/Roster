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
chmod +x scripts/deploy-caddy.sh scripts/deploy-frontend.sh
./scripts/deploy-caddy.sh      # proxy /api/ → контейнер api (один раз или после смены Caddyfile)
./scripts/deploy-frontend.sh   # сборка → ~/server/www на B3
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

## Mac: посмотреть React локально (БД и API на B3)

На Mac **не нужен** локальный Python/Docker для API — всё крутится на B3, с Mac только туннель и Vite.

**На B3** (один раз или после обновлений):

```bash
ssh greem4@192.168.31.96
cd ~/RosterRx && docker compose up -d
```

**На Mac — два терминала:**

Терминал 1 — туннель к API:

```bash
./scripts/api-tunnel.sh
```

Терминал 2 — React:

```bash
./scripts/dev-frontend.sh
# или: cd frontend && npm run dev
```

Откройте **http://localhost:5173** — логин `admin` / `admin`.  
Данные в PostgreSQL на B3 (та же БД, что и в проде).

Проверка API с Mac: `curl http://127.0.0.1:8000/health`

### Опционально: туннель только к PostgreSQL

Если нужен `psql` или миграции с Mac (нужен Python 3.12; на 3.14 venv не собирается):

```bash
./scripts/db-tunnel.sh
```

---

## Важно

| Где | PostgreSQL | API |
|-----|------------|-----|
| B3 | `docker compose up` (сервис `db`) | `docker compose up` (сервис `api`) |
| Mac | **не запускать** | туннель + `dev-api.sh` или `docker-compose.local.yml` |

Миграции на B3 — при старте контейнера `api`. С Mac — `./scripts/dev-api.sh` (alembic перед uvicorn) против **той же** БД через туннель.

Данные, созданные локально, сразу видны на проде и наоборот.

---

## Права и API

| Код | Назначение |
|-----|------------|
| `medicines:view` | Просмотр |
| `medicines:edit` | Редактирование |
| `users:manage` | Пользователи |

API: `/auth/*`, `/medicines`, `/alerts/expiring`, `/users` — снаружи префикс `/api` (nginx).

## Позже

- Email при истечении срока годности
