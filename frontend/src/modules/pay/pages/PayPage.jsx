import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import RosterModuleTitle from '../../../components/RosterModuleTitle'
import { payApi } from '../api'
import PayMonthCell from '../components/PayMonthCell'
import PayMonthlyChart from '../components/PayMonthlyChart'
import { PERM_PAY_MANAGE } from '../constants'
import { MONTH_LABELS, MONTH_NAMES } from '../constants/months'
import { formatMoney } from '../utils/formatMoney'
import '../pay.css'

const currentYear = () => new Date().getFullYear()

/** Пустая сетка из 12 месяцев для выбранного года. */
function emptyMonths(year) {
  return Array.from({ length: 12 }, (_, i) => ({
    year,
    month: i + 1,
    amounts: [''],
    hadData: false,
  }))
}

/** Сумма по строковым полям месяца. */
function monthTotal(amounts) {
  return amounts.reduce((sum, raw) => {
    const n = Number(raw)
    return sum + (Number.isNaN(n) ? 0 : n)
  }, 0)
}

/** Числа для API из полей ввода (без пустых и отрицательных). */
function amountsForApi(amounts) {
  return amounts
    .map((s) => s.trim())
    .filter((s) => s !== '')
    .map((s) => Number(s))
    .filter((n) => !Number.isNaN(n) && n >= 0)
}

/**
 * RosterPay: учёт зарплаты — несколько сумм за месяц, итог за месяц и за год.
 */
export default function PayPage() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission(PERM_PAY_MANAGE)

  const [year, setYear] = useState(currentYear)
  const [months, setMonths] = useState(() => emptyMonths(currentYear()))
  const [currency, setCurrency] = useState('RUB')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedHint, setSavedHint] = useState('')

  const load = useCallback(async (y) => {
    setError('')
    setLoading(true)
    try {
      const rows = await payApi.listMonthly(y)
      const byMonth = Object.fromEntries(rows.map((r) => [r.month, r]))
      setMonths(
        emptyMonths(y).map((slot) => {
          const saved = byMonth[slot.month]
          if (!saved) return slot
          const list =
            saved.amounts?.length > 0
              ? saved.amounts.map((a) => String(Number(a)))
              : saved.amount != null && Number(saved.amount) > 0
                ? [String(Number(saved.amount))]
                : ['']
          return {
            year: y,
            month: slot.month,
            amounts: list.length ? list : [''],
            hadData: true,
          }
        }),
      )
      if (rows[0]?.currency) setCurrency(rows[0].currency)
    } catch (e) {
      setError(e.message || 'Не удалось загрузить данные')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(year)
  }, [year, load])

  const yearTotal = useMemo(
    () => months.reduce((sum, row) => sum + monthTotal(row.amounts), 0),
    [months],
  )

  const chartData = useMemo(() => {
    return months.map((m, index) => {
      const amount = monthTotal(m.amounts)
      return {
        label: MONTH_LABELS[index],
        amount,
        // Чуть выше столбца (~8%), чтобы линия не слипалась с вершиной.
        lineAmount: amount > 0 ? amount * 1.08 : 0,
      }
    })
  }, [months])

  const onYearChange = (delta) => {
    setYear((y) => y + delta)
    setSavedHint('')
  }

  const onAmountsChange = (month, amounts) => {
    setMonths((prev) =>
      prev.map((row) => (row.month === month ? { ...row, amounts } : row)),
    )
    setSavedHint('')
  }

  const onAddLine = (month) => {
    setMonths((prev) =>
      prev.map((row) =>
        row.month === month ? { ...row, amounts: [...row.amounts, ''] } : row,
      ),
    )
    setSavedHint('')
  }

  const onRemoveLine = (month, index) => {
    setMonths((prev) =>
      prev.map((row) => {
        if (row.month !== month || row.amounts.length <= 1) return row
        return { ...row, amounts: row.amounts.filter((_, i) => i !== index) }
      }),
    )
    setSavedHint('')
  }

  const onSave = async () => {
    if (!canManage) return
    setSaving(true)
    setError('')
    setSavedHint('')
    try {
      const tasks = months
        .map((m) => {
          const parsed = amountsForApi(m.amounts)
          const hasFilled = m.amounts.some((s) => s.trim() !== '')
          if (hasFilled) {
            return payApi.upsertMonthly({
              year,
              month: m.month,
              amounts: parsed,
              currency,
            })
          }
          if (m.hadData) {
            return payApi.upsertMonthly({
              year,
              month: m.month,
              amounts: [],
              currency,
            })
          }
          return null
        })
        .filter(Boolean)
      await Promise.all(tasks)
      setSavedHint('Сохранено')
      await load(year)
    } catch (e) {
      setError(e.message || 'Не удалось сохранить')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="pay-loading muted">Загрузка…</p>
  }

  return (
    <div className="pay-page">
      <header className="pay-page__header roster-page-toolbar">
        <div className="pay-page__intro">
          <RosterModuleTitle moduleKey="pay" as="h1" className="pay-page__title" />
          <p className="pay-page__subtitle muted">
            Зарплата по месяцам — несколько сумм в месяце, итог за год
          </p>
        </div>
        <div className="pay-year-picker roster-page-toolbar__action" aria-label="Год">
          <button
            type="button"
            className="pay-year-picker__btn"
            onClick={() => onYearChange(-1)}
            aria-label="Предыдущий год"
          >
            ‹
          </button>
          <span className="pay-year-picker__value">{year}</span>
          <button
            type="button"
            className="pay-year-picker__btn"
            onClick={() => onYearChange(1)}
            aria-label="Следующий год"
          >
            ›
          </button>
        </div>
      </header>

      {error && <p className="pay-error">{error}</p>}

      <section className="pay-salary" aria-label="Зарплата по месяцам">
        <div className="pay-salary__toolbar">
          <div>
            <h2 className="pay-salary__heading">{year} год</h2>
            <p className="pay-salary__total muted">
              Итого за год:{' '}
              <strong className="pay-salary__total-value">
                {formatMoney(yearTotal, currency)}
              </strong>
            </p>
          </div>
          {canManage && (
            <div className="pay-salary__actions">
              {savedHint && <span className="pay-salary__saved muted">{savedHint}</span>}
              <button
                type="button"
                className="btn-primary"
                disabled={saving}
                onClick={onSave}
              >
                {saving ? 'Сохранение…' : 'Сохранить'}
              </button>
            </div>
          )}
        </div>

        <div className="pay-salary__grid">
          {months.map((row, index) => (
            <PayMonthCell
              key={row.month}
              label={MONTH_NAMES[index]}
              amounts={row.amounts}
              canManage={canManage}
              currency={currency}
              onChange={(amounts) => onAmountsChange(row.month, amounts)}
              onAddLine={() => onAddLine(row.month)}
              onRemoveLine={(lineIndex) => onRemoveLine(row.month, lineIndex)}
            />
          ))}
        </div>
      </section>

      <section className="pay-chart" aria-label="График зарплаты по месяцам">
        <h2 className="pay-chart__heading">Динамика по месяцам</h2>
        <PayMonthlyChart data={chartData} currency={currency} />
      </section>
    </div>
  )
}
