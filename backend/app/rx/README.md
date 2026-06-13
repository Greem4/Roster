# RosterRX (backend)

Реестр лекарств и предупреждения по срокам годности.

- API: `app/api/medicines.py` — `GET/POST/PATCH/DELETE /medicines`
- API: `app/api/alerts.py` — `GET /alerts/expiring`
- Модель: `app/models/medicine.py` → таблица `medicines`
- Схемы: `app/schemas/medicine.py`, `app/schemas/alert.py`
- Права: `app/rx/permissions.py` — CRUD через `users:manage` (`PERM_RX_MANAGE`)

## Добавление из фото накладной

Фото → ИИ → JSON → в консоли SQL (только новые строки, удаления в БД не откатывает):

```sql
SELECT rx_import_medicines('[{"name":"…","series":"…","expiry":"01/06/26"}]'::jsonb);
```

Шаблон: **`scripts/internal/data/rx-import.sql`**, промпт: **`scripts/internal/data/README.md`**. Не использовать `import.sh` / `medicines-invoices.json` — архив, вернёт удалённые позиции.
