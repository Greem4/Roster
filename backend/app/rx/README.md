# RosterRX (backend)

Реестр лекарств и предупреждения по срокам годности.

- API: `app/api/medicines.py` — `GET/POST/PATCH/DELETE /medicines`
- API: `app/api/alerts.py` — `GET /alerts/expiring`
- Модель: `app/models/medicine.py` → таблица `medicines`
- Схемы: `app/schemas/medicine.py`, `app/schemas/alert.py`
- Права: `app/rx/permissions.py` — CRUD через `users:manage` (`PERM_RX_MANAGE`)
