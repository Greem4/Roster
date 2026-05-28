# RosterRx

Учёт лекарств с личным кабинетом и правами доступа.

## Как работаем (основной процесс)

| Часть | Где живёт | Как проверять | Как выкатить |
|-------|-----------|---------------|--------------|
| **API** | только B3 | уже на сервере после деплоя | `./scripts/deploy-backend.sh` |
| **Фронт** | сначала Mac | `./scripts/dev-ui.sh` → http://localhost:5173 | `./scripts/deploy-frontend.sh` |

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

## Одна база PostgreSQL на B3

PostgreSQL **только на B3 (Pi)**. API в Docker на Pi.

```
┌─────────────┐   туннель :8000    ┌──────────────────────────┐
│  Mac        │ ─────────────────► │  B3: api + postgres      │
│  Vite :5173 │                    │  Caddy → medicine.greem… │
└─────────────┘                    └──────────────────────────┘
```

---

## B3: первый запуск

```bash
cp .env.example .env
docker compose up -d --build
curl http://127.0.0.1:8000/health
```

Фронт с Mac: `./scripts/deploy-frontend.sh`  
Caddy (редко): `./scripts/deploy-caddy.sh`

Проверка: `curl -s https://medicine.greemlab.ru/api/health`

**Не делайте** `docker compose down -v` — сотрёт БД.

---

## Скрипты

| Скрипт | Назначение |
|--------|------------|
| `dev-ui.sh` | Фронт локально + API на B3 (ежедневная работа) |
| `deploy-backend.sh` | API на Pi (rsync + rebuild) |
| `deploy-frontend.sh` | Сборка и выкладка сайта |
| `deploy-all.sh` | git push + всё (после коммита) |
| `setup-ssh-key.sh` | SSH-ключ, без пароля |

Опционально (редко): `dev-local.sh` — свой API на Mac; `api-tunnel.sh` + `dev-frontend.sh` вручную.

---

## Права

| Кто | Что |
|-----|-----|
| Гость | Просмотр списка лекарств |
| Вошедший активный пользователь | Личный кабинет, алерты |
| Админ (`users:manage` или `admin`) | Пользователи, правки лекарств |

API снаружи: префикс `/api` (nginx/Caddy).
