import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Modal from '../../../components/Modal'
import { MONTH_NAMES } from '../../../constants/calendar'
import { formatDate } from '../../../utils/formatDate'
import { getDutyTitleLabel } from '../constants'
import { emptyVacation } from '../utils/employeeStorage'
import {
  emptyMonthPreferences,
  formatAvoidRulesSummary,
  getMonthPreferences,
  monthKey,
  patchMonthPreferences,
} from '../utils/monthPreferences'
import { daysInMonth } from '../utils/scheduleDays'
import DutyAvoidDaysPicker from './DutyAvoidDaysPicker'
import DutyAvoidWeekdaysPicker from './DutyAvoidWeekdaysPicker'
import DutyVacationDateInput from './DutyVacationDateInput'

/** Краткая подпись интервала для свёрнутого блока отпусков. */
function formatVacationRange(vacation) {
  if (!vacation.start && !vacation.end) return null
  const start = vacation.start ? formatDate(vacation.start) : '…'
  const end = vacation.end ? formatDate(vacation.end) : '…'
  return `${start}–${end}`
}

/**
 * Карточка сотрудника на графике: пожелания на выбранный месяц и отпуска.
 * Закрытие с несохранёнными правками автоматически сохраняет данные.
 */
export default function DutyEmployeeCardModal({
  employee,
  year,
  month,
  onClose,
  onSave,
}) {
  const canWorkRef = useRef(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [vacations, setVacations] = useState([emptyVacation(), emptyVacation()])
  const [monthPrefs, setMonthPrefs] = useState(emptyMonthPreferences())

  const periodKey = monthKey(year, month)
  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`
  const maxDay = daysInMonth(year, month)

  const initialSnapshot = useMemo(() => {
    if (!employee) return null
    return {
      vacations: [
        { ...employee.vacations[0] },
        { ...employee.vacations[1] },
      ],
      monthPrefs: getMonthPreferences(employee.preferences, year, month, maxDay),
    }
  }, [employee, year, month, maxDay])

  useEffect(() => {
    if (!initialSnapshot) return
    setVacations(initialSnapshot.vacations)
    setMonthPrefs(initialSnapshot.monthPrefs)
    setError('')
  }, [initialSnapshot])

  useEffect(() => {
    if (!employee) return
    const timer = window.setTimeout(() => canWorkRef.current?.focus(), 50)
    return () => window.clearTimeout(timer)
  }, [employee, periodKey])

  const isDirty = useMemo(() => {
    if (!initialSnapshot) return false
    return JSON.stringify({ vacations, monthPrefs }) !== JSON.stringify(initialSnapshot)
  }, [initialSnapshot, vacations, monthPrefs])

  const persist = useCallback(async () => {
    if (!employee) return
    const preferences = patchMonthPreferences(
      employee.preferences,
      year,
      month,
      monthPrefs,
      maxDay,
    )
    await onSave(employee.id, { vacations, preferences })
  }, [employee, maxDay, month, monthPrefs, onSave, vacations, year])

  const saveAndClose = useCallback(async () => {
    if (!employee || saving) return
    if (!isDirty) {
      onClose()
      return
    }
    setSaving(true)
    setError('')
    try {
      await persist()
      onClose()
    } catch (err) {
      setError(err.message || 'Не удалось сохранить')
    } finally {
      setSaving(false)
    }
  }, [employee, isDirty, onClose, persist, saving])

  const handleSubmit = async (event) => {
    event.preventDefault()
    await saveAndClose()
  }

  const handleVacationChange = (index, field, value) => {
    setVacations((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  if (!employee) return null

  const vacationSummary = vacations
    .map((vacation, index) => {
      const range = formatVacationRange(vacation)
      return range ? `отп. ${index + 1}: ${range}` : null
    })
    .filter(Boolean)
    .join(' · ')

  return (
    <Modal title={employee.name} onClose={saveAndClose} size="medium">
      <form
        className="duty-employee-card"
        onSubmit={handleSubmit}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
            event.preventDefault()
            saveAndClose()
          }
        }}
      >
        <div className="duty-employee-card__scroll">
        <div className="duty-employee-card__profile-bar">
          <span className="duty-employee-card__role duty-employee-card__role--active">
            {getDutyTitleLabel(employee.title)}
          </span>
          <span className="duty-employee-card__period">{monthLabel}</span>
        </div>

        <section className="duty-employee-card__section duty-employee-card__section--primary">
          <h3 className="duty-employee-card__section-title">Пожелания на {monthLabel.toLowerCase()}</h3>

          <label className="duty-employee-card__field">
            Когда могу работать
            <input
              ref={canWorkRef}
              type="text"
              className="duty-employee-card__input"
              value={monthPrefs.canWork}
              placeholder="Например: только дневные по будням"
              onChange={(e) => setMonthPrefs((prev) => ({ ...prev, canWork: e.target.value }))}
            />
          </label>

          <div className="duty-employee-card__field">
            <span>Когда не ставить</span>
            <DutyAvoidWeekdaysPicker
              value={monthPrefs.avoidWeekdays}
              onChange={(avoidWeekdays) => setMonthPrefs((prev) => ({ ...prev, avoidWeekdays }))}
            />
            <DutyAvoidDaysPicker
              year={year}
              month={month}
              value={monthPrefs.avoidDays}
              avoidWeekdays={monthPrefs.avoidWeekdays}
              onChange={(avoidDays) => setMonthPrefs((prev) => ({ ...prev, avoidDays }))}
            />
            {formatAvoidRulesSummary(monthPrefs.avoidDays, monthPrefs.avoidWeekdays) && (
              <p className="muted duty-employee-card__avoid-summary">
                Не ставить: {formatAvoidRulesSummary(monthPrefs.avoidDays, monthPrefs.avoidWeekdays)}
              </p>
            )}
          </div>
        </section>

        <details className="duty-employee-card__details">
          <summary className="duty-employee-card__details-summary">
            <span className="duty-employee-card__details-title">Отпуска</span>
            <span className="muted duty-employee-card__details-meta">
              {vacationSummary || 'не указаны'}
            </span>
          </summary>
          <div className="duty-employee-card__details-body">
            {vacations.map((vacation, index) => (
              <div key={index} className="duty-employee-card__vacation-row">
                <span className="duty-employee-card__vacation-label">№{index + 1}</span>
                <DutyVacationDateInput
                  label="с"
                  value={vacation.start}
                  onChange={(iso) => handleVacationChange(index, 'start', iso)}
                />
                <DutyVacationDateInput
                  label="по"
                  value={vacation.end}
                  minIso={vacation.start || null}
                  onChange={(iso) => handleVacationChange(index, 'end', iso)}
                />
              </div>
            ))}
          </div>
        </details>
        </div>

        <div className="form-actions duty-employee-card__actions">
          {error && <p className="error duty-employee-card__save-error">{error}</p>}
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Сохранение…' : 'Сохранить'}
          </button>
          <button
            type="button"
            className="btn-secondary duty-employee-card__discard"
            disabled={saving}
            onClick={onClose}
          >
            Без сохранения
          </button>
        </div>
      </form>
    </Modal>
  )
}
