# Лекарства: фото → JSON → БД roster_rx

**RosterRX хранит лекарства в отдельной БД `roster_rx`** (тот же Postgres в Docker, не отдельный контейнер).  
Общая БД `roster` — users, pay, duty.

## Первичная настройка (локально)

```bash
# 1. Снимок с Pi (B3) → JSON
python3 scripts/internal/export-medicines-from-pi.py

# 2. БД roster_rx + схема + заливка
./scripts/internal/setup-rx-db.sh

# 3. Разработка
./scripts/dev.sh
```

Актуальный снимок: **`medicines-live.json`**. Архив первой заливки: `medicines-invoices.json` (не импортировать).

**Не запускай** `./scripts/internal/import.sh` — архив, вернёт удалённые позиции.

## Добавление накладной — SQL в консоли

Подключение к **roster_rx** (DataGrip: БД `roster_rx`, не `roster`):

```sql
SELECT rx_import_medicines('[
  {"name": "Глицин таб. 100мг №100", "series": "480723", "expiry": "01/06/26"}
]'::jsonb);
```

Ответ: `Добавлено: N, пропущено (серия уже есть): M, всего: K`.  
Серия **уникальна** (`uq_medicines_series`).

Шаблон: **`rx-import.sql`**. Установка функций вручную: **`rx-import-install.sql`**.

### Поля

| Поле | Пример |
|------|--------|
| `name` | `"Фуросемид р-р … 2мл №5"` |
| `series` | `"6/820524"` — **уникальна** |
| `expiry` | `"01/05/26"` — **DD/MM/YY** |

Срок **30/31** → пиши **01** того же месяца.

## Промпт для ИИ (фото накладной)

```
Из приложенных фото накладной/упаковок извлеки список лекарств.

Верни ТОЛЬКО JSON-массив объектов без markdown. Каждый объект:
- "name" — полное наименование
- "series" — серия (партия), уникальная
- "expiry" — срок DD/MM/YY

Правила: одна позиция на серию; 30/31 → 01 того же месяца; не выдумывай то, чего нет на фото.

Пример: {"name": "Глицин таб. 100мг №100", "series": "480723", "expiry": "01/06/26"}
```

JSON → `SELECT rx_import_medicines('…'::jsonb)` в **roster_rx**.
