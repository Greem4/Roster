import { useEffect, useRef, useState } from 'react'
import Modal from '../../../components/Modal'
import { formatDate } from '../../../utils/formatDate'
import { getDutyTitleLabel } from '../constants'
import { emptyPreferences, emptyVacation, formatAgeLabel } from '../utils/employeeStorage'

/** Есть хотя бы один указанный интервал отпуска. */
function hasVacationDates(vacations) {
  return vacations.some((v) => v.start || v.end)
}

/** Краткая подпись интервала для свёрнутого блока отпусков. */
function formatVacationRange(vacation) {
  if (!vacation.start && !vacation.end) return null
  const start = vacation.start ? formatDate(vacation.start) : '…'
  const end = vacation.end ? formatDate(vacation.end) : '…'
  return `${start}–${end}`
}

/**
 * Карточка сотрудника на графике: краткий профиль (только просмотр),
 * пожелания на месяц и отпуска.
 */
export default function DutyEmployeeCardModal({ employee, onClose, onSave }) {
  const canWorkRef = useRef(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [vacations, setVacations] = useState([emptyVacation(), emptyVacation()])
  const [preferences, setPreferences] = useState(emptyPreferences())

  useEffect(() => {
    if (!employee) return
    setVacations([
      { ...employee.vacations[0] },
      { ...employee.vacations[1] },
    ])
    setPreferences({ ...employee.preferences })
  }, [employee])

  useEffect(() => {
    if (!employee) return
    const timer = window.setTimeout(() => canWorkRef.current?.focus(), 50)
    return () => window.clearTimeout(timer)
  }, [employee])

  if (!employee) return null

  const handleVacationChange = (index, field, value) => {
    setVacations((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await onSave(employee.id, { vacations, preferences })
      onClose()
    } catch (err) {
      setError(err.message || 'Не удалось сохранить')
    } finally {
      setSaving(false)
    }
  }

  const vacationSummary = vacations
    .map((vacation, index) => {
      const range = formatVacationRange(vacation)
      return range ? `отп. ${index + 1}: ${range}` : null
    })
    .filter(Boolean)
    .join(' · ')

  const genderLabel = employee.gender === 'M' ? 'М' : employee.gender === 'F' ? 'Ж' : null
  const ageLabel = formatAgeLabel(employee.age)

  return (
    <Modal title={employee.name} onClose={onClose} size="wide">
      <form className="duty-employee-card" onSubmit={handleSubmit}>
        <div className="duty-employee-card__profile-bar">
          <span className="duty-employee-card__role duty-employee-card__role--active">
            {getDutyTitleLabel(employee.title)}
          </span>
          {genderLabel && (
            <>
              <span className="duty-employee-card__profile-sep" aria-hidden>
                ·
              </span>
              <span className="duty-employee-card__profile-gender">{genderLabel}</span>
            </>
          )}
          {employee.birthDate && (
            <>
              <span className="duty-employee-card__profile-sep" aria-hidden>
                ·
              </span>
              <span className="duty-employee-card__profile-gender">
                {formatDate(employee.birthDate)}
                {ageLabel ? ` (${ageLabel})` : ''}
              </span>
            </>
          )}
        </div>

        <section className="duty-employee-card__section duty-employee-card__section--primary">
          <h3 className="duty-employee-card__section-title">Пожелания на месяц</h3>
          <p className="muted duty-employee-card__hint">
            Обновляйте перед составлением графика — это главное в этой карточке.
          </p>
          <label>
            Когда могу работать
            <textarea
              ref={canWorkRef}
              rows={3}
              value={preferences.canWork}
              placeholder="Например: только дневные смены по будням"
              onChange={(e) => setPreferences((prev) => ({ ...prev, canWork: e.target.value }))}
            />
          </label>
          <label>
            Когда не ставить
            <textarea
              rows={3}
              value={preferences.avoid}
              placeholder="Например: не ставить в выходные и праздники"
              onChange={(e) => setPreferences((prev) => ({ ...prev, avoid: e.target.value }))}
            />
          </label>
        </section>

        <details
          className="duty-employee-card__details"
          open={!hasVacationDates(vacations)}
        >
          <summary className="duty-employee-card__details-summary">
            <span className="duty-employee-card__details-title">Отпуска</span>
            <span className="muted duty-employee-card__details-meta">
              {vacationSummary || 'не указаны — дни перечёркиваются красной линией'}
            </span>
          </summary>
          <div className="duty-employee-card__details-body">
            {vacations.map((vacation, index) => (
              <div key={index} className="duty-employee-card__vacation-row">
                <span className="duty-employee-card__vacation-label">Отпуск {index + 1}</span>
                <label>
                  с
                  <input
                    type="date"
                    value={vacation.start}
                    onChange={(e) => handleVacationChange(index, 'start', e.target.value)}
                  />
                </label>
                <label>
                  по
                  <input
                    type="date"
                    value={vacation.end}
                    min={vacation.start || undefined}
                    onChange={(e) => handleVacationChange(index, 'end', e.target.value)}
                  />
                </label>
              </div>
            ))}
          </div>
        </details>

        <div className="form-actions">
          {error && <p className="error duty-employee-card__save-error">{error}</p>}
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Сохранение…' : 'Сохранить'}
          </button>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Отмена
          </button>
        </div>
      </form>
    </Modal>
  )
}
