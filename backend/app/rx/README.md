# RosterRX (backend)

Реестр лекарств и предупреждения по срокам годности.

## База данных

| БД | Содержимое |
|----|------------|
| `roster` | users, pay, duty |
| **`roster_rx`** | `medicines`, `rx_import_medicines`, `rx_parse_expiry` |

- Модель: `app/rx/models/medicine.py` (`RxMedicine`)
- Подключение: `app/rx/db.py` → `get_rx_db()`, env `RX_DATABASE_URL`
- Миграции RX: `backend/alembic_rx/` (`alembic -c alembic_rx/alembic.ini`)

Локальная настройка: `python3 scripts/internal/export-medicines-from-pi.py` → `./scripts/internal/setup-rx-db.sh`.

## API

- `app/api/medicines.py` — CRUD `/medicines` (БД `roster_rx`)
- `app/api/alerts.py` — `/alerts/expiring`
- Схемы: `app/schemas/medicine.py`, `app/schemas/alert.py`
- Права: `app/rx/permissions.py` — `users:manage` (`PERM_RX_MANAGE`)

## Импорт из JSON в SQL

```sql
SELECT rx_import_medicines('[{"name":"…","series":"…","expiry":"01/06/26"}]'::jsonb);
```

Документация и промпт для ИИ: **`scripts/internal/data/README.md`**.
