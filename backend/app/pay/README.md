# RosterPay (backend)

Учёт зарплаты по месяцам: несколько сумм на календарный месяц (итог — сумма строк).

- API: `app/api/pay.py` — `GET /pay/monthly?year=`, `PUT /pay/monthly`
- Модель: `app/models/pay.py` → `pay_monthly_entries`
- Права: `app/pay/permissions.py` — `pay:view`, `pay:manage`
