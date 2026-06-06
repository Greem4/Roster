# RosterRX (frontend)

Учёт лекарств: список с сортировкой, сроки годности, CRUD для админов. **Не импортировать** компоненты RX из Pay/Duty/CA и наоборот.

## Структура

| Путь | Назначение |
|------|------------|
| `App.jsx` | Маршруты `/rx`, `/login`, `/register`, legacy `/medicines` → `/rx` |
| `pages/MedicinesPage.jsx` | Список лекарств, сортировка, модалки добавления/редактирования |
| `components/MedicinesLayout.jsx` | Список на фоне + `<Outlet />` для оверлеев |
| `components/MedicineForm.jsx` | Форма создания/редактирования |
| `components/MedicineEditRedirect.jsx` | Редirect `/rx/:id/edit` → query-параметр |
| `api.js` | `rxApi.medicines`, `rxApi.alerts` |
| `constants.js` | `PERM_RX_MANAGE`; `RX_HOME` — в `constants/routes.js` |
| `rx.css` | Стили `.medicines-*`, `.medicine-*`, сортировка |
| `utils/medicineName.js` | Краткое название для мобильной таблицы |
| `utils/expiryTier.js` | Цвет строки по остатку срока |

## Backend

- Домен: `backend/app/rx/`
- API: `backend/app/api/medicines.py`, `backend/app/api/alerts.py`
- Модели: `models/medicine.py`, `schemas/medicine.py`, `schemas/alert.py`
