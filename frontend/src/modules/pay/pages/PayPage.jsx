import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { payApi } from '../api'
import { PERM_PAY_MANAGE } from '../constants'
import { formatMoney } from '../utils/formatMoney'
import RosterModuleTitle from '../../../components/RosterModuleTitle'
import PayNav from '../components/PayNav'
import '../pay.css'

const EMPTY_FORM = { name: '', note: '', balance: '0' }

/**
 * Главная страница RosterPay: сводка и список счетов кабинета.
 */
export default function PayPage() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission(PERM_PAY_MANAGE)

  const [summary, setSummary] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const [summaryData, accountRows] = await Promise.all([
        payApi.summary(),
        payApi.listAccounts(),
      ])
      setSummary(summaryData)
      setAccounts(accountRows)
    } catch (e) {
      setError(e.message || 'Не удалось загрузить данные')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const onSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await payApi.createAccount({
        name: form.name.trim(),
        note: form.note.trim() || null,
        balance: Number(form.balance) || 0,
      })
      setForm(EMPTY_FORM)
      setShowForm(false)
      await load()
    } catch (err) {
      setError(err.message || 'Не удалось создать счёт')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="pay-loading muted">Загрузка…</p>
  }

  const currency = summary?.currency || 'RUB'

  return (
    <div className="pay-page">
      <header className="pay-page__header">
        <div>
          <RosterModuleTitle moduleKey="pay" as="h1" className="pay-page__title" />
          <p className="pay-page__subtitle muted">Учёт счетов и остатков в кабинете</p>
        </div>
        {canManage && !showForm && (
          <button type="button" className="btn-primary" onClick={() => setShowForm(true)}>
            Добавить счёт
          </button>
        )}
      </header>

      <PayNav />

      {error && <p className="pay-error">{error}</p>}

      {summary && (
        <section className="pay-summary" aria-label="Сводка">
          <div className="pay-summary__card">
            <p className="pay-summary__label">Счетов</p>
            <p className="pay-summary__value">{summary.account_count}</p>
          </div>
          <div className="pay-summary__card">
            <p className="pay-summary__label">Суммарный остаток</p>
            <p className="pay-summary__value">
              {formatMoney(summary.total_balance, currency)}
            </p>
          </div>
        </section>
      )}

      <section className="pay-accounts" aria-label="Счета">
        <div className="pay-accounts__toolbar">
          <h2 className="pay-accounts__heading">Счета</h2>
        </div>

        {accounts.length === 0 ? (
          <div className="pay-empty">
            <p className="pay-empty__text muted">
              Пока нет счетов. {canManage ? 'Добавьте первый — касса, резерв или личный учёт.' : ''}
            </p>
            {canManage && !showForm && (
              <button type="button" className="btn-primary" onClick={() => setShowForm(true)}>
                Добавить счёт
              </button>
            )}
          </div>
        ) : (
          <table className="pay-table">
            <thead>
              <tr>
                <th scope="col">Название</th>
                <th scope="col">Примечание</th>
                <th scope="col">Остаток</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td className="muted">{row.note || '—'}</td>
                  <td className="pay-table__balance">
                    {formatMoney(row.balance, row.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {canManage && showForm && (
          <form className="pay-form" onSubmit={onSubmit}>
            <div className="pay-form__row">
              <label htmlFor="pay-account-name">Название</label>
              <input
                id="pay-account-name"
                className="input"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                maxLength={128}
                autoFocus
              />
            </div>
            <div className="pay-form__row">
              <label htmlFor="pay-account-note">Примечание</label>
              <input
                id="pay-account-note"
                className="input"
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                maxLength={500}
              />
            </div>
            <div className="pay-form__row">
              <label htmlFor="pay-account-balance">Начальный остаток</label>
              <input
                id="pay-account-balance"
                className="input"
                type="number"
                min="0"
                step="0.01"
                value={form.balance}
                onChange={(e) => setForm((f) => ({ ...f, balance: e.target.value }))}
              />
            </div>
            <div className="pay-form__actions">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Сохранение…' : 'Создать'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                disabled={saving}
                onClick={() => {
                  setShowForm(false)
                  setForm(EMPTY_FORM)
                }}
              >
                Отмена
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}
