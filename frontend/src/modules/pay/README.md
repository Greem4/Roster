# RosterPay (frontend)

Модуль финансового учёта в общем SPA. **Не импортировать** компоненты Pay из `pages/MedicinesPage`, `panels/*` RX и наоборот.

## Структура

| Путь | Назначение |
|------|------------|
| `PayRoutes.jsx` | Маршруты `/pay/*`, guards |
| `pages/` | Страницы модуля |
| `api.js` | Запросы к `/pay/*` (не в `api/client.js`) |
| `constants.js` | Коды прав `pay:view`, `pay:manage` |
| `pay.css` | Стили с префиксом `.pay-` |

## Backend

- API: `backend/app/api/pay.py` (`prefix=/pay`)
- Модель: `backend/app/models/pay.py`
- Права: `backend/app/pay/permissions.py`

## Правила для агентов

См. `.cursor/rules/roster-modules.mdc` — при задачах Pay не менять RX/Duty без явной связи.
