# RosterPay (backend)

Домен финансового учёта. Отдельный роутер и таблицы, **не** в `medicines` / `users` (кроме FK на `users`).

- `permissions.py` — коды `pay:view`, `pay:manage`
- API: `app/api/pay.py` → префикс `/pay`
- Модель: `app/models/pay.py` → таблица `pay_accounts`

Миграции: `alembic/versions/*pay*`.
