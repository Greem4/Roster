import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import RosterModuleTitle from '../../../components/RosterModuleTitle'
import { payApi } from '../api'
import PayMonthlyChart from '../components/PayMonthlyChart'
import PayNav from '../components/PayNav'
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
    amount: '',
  }))
}

/**
 * Аналитика RosterPay: ввод суммы за каждый месяц года и график столбцы + линия.
 */
export default function PayAnalyticsPage() {
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
          return {
            year: y,
            month: slot.month,
            amount: String(Number(saved.amount)),
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

  const chartData = useMemo(() => {
    return months.map((m, index) => {
      const amount = Number(m.amount) || 0
      const bump = amount > 0 ? Math.max(amount * 0.04, amount * 0.01 + 1) : 0
      return {
        label: MONTH_LABELS[index],
        amount,
        lineAmount: amount > 0 ? amount + bump : 0,
      }
    })
  }, [months])

  const yearTotal = useMemo(
    () => chartData.reduce((sum, row) => sum + row.amount, 0),
    [chartData],
  )

  const onYearChange = (delta) => {
    setYear((y) => y + delta)
    setSavedHint('')
  }

  const onAmountChange = (month, value) => {
    setMonths((prev) =>
      prev.map((row) => (row.month === month ? { ...row, amount: value } : row)),
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
        .filter((m) => m.amount !== '' && !Number.isNaN(Number(m.amount)))
        .map((m) =>
          payApi.upsertMonthly({
            year,
            month: m.month,
            amount: Number(m.amount) || 0,
            currency,
          }),
        )
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
    <div className="pay-page pay-page--wide">
      <header className="pay-page__header">
        <div>
          <RosterModuleTitle moduleKey="pay" as="h1" className="pay-page__title" />
          <p className="pay-page__subtitle muted">Суммы по месяцам и наглядный график</p>
        </div>
        <div className="pay-year-picker" aria-label="Год">
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

      <PayNav />

      {error && <p className="pay-error">{error}</p>}

      <section className="pay-analytics" aria-label="Ввод по месяцам">
        <div className="pay-analytics__toolbar">
          <div>
            <h2 className="pay-analytics__heading">Суммы за {year} год</h2>
            <p className="pay-analytics__total muted">
              Итого за год:{' '}
              <strong className="pay-analytics__total-value">
                {formatMoney(yearTotal, currency)}
              </strong>
            </p>
          </div>
          {canManage && (
            <div className="pay-analytics__actions">
              {savedHint && <span className="pay-analytics__saved muted">{savedHint}</span>}
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

        <div className="pay-analytics__grid">
          {months.map((row, index) => (
            <label key={row.month} className="pay-analytics__cell">
              <span className="pay-analytics__cell-label">{MONTH_NAMES[index]}</span>
              {canManage ? (
                <input
                  className="input pay-analytics__input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={row.amount}
                  onChange={(e) => onAmountChange(row.month, e.target.value)}
                />
              ) : (
                <span className="pay-analytics__readonly">
                  {row.amount ? formatMoney(row.amount, currency) : '—'}
                </span>
              )}
            </label>
          ))}
        </div>
      </section>

      <section className="pay-analytics__chart-section" aria-label="График по месяцам">
        <h2 className="pay-analytics__heading">Динамика по месяцам</h2>
        <PayMonthlyChart data={chartData} currency={currency} />
      </section>
    </div>
  )
}
