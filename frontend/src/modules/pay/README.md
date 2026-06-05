# RosterPay (frontend)

Учёт зарплаты: несколько сумм за месяц (автосумма), итог за год. **Не импортировать** компоненты Pay из RX и наоборот.

## Структура

| Путь | Назначение |
|------|------------|
| `PayRoutes.jsx` | Маршрут `/pay` |
| `pages/PayPage.jsx` | Сетка 12 месяцев, переключатель года, итог |
| `components/PayMonthCell.jsx` | Ячейка месяца: несколько полей суммы |
| `api.js` | `GET/PUT /pay/monthly` |
| `constants.js` | Права `pay:view`, `pay:manage` |
| `pay.css` | Стили с префиксом `.pay-` |

## Backend

- API: `backend/app/api/pay.py`
- Таблица: `pay_monthly_entries`
