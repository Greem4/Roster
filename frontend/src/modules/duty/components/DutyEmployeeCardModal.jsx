import { useEffect, useState } from 'react'
import Modal from '../../../components/Modal'
import { DUTY_ROLE_LABELS } from '../constants'
import { emptyPreferences, emptyVacation } from '../utils/employeeStorage'

/**
 * Карточка сотрудника ОСМП: пол, роль, два отпуска, пожелания по сменам.
 */
export default function DutyEmployeeCardModal({ employee, onClose, onSave }) {
  const [gender, setGender] = useState('')
  const [vacations, setVacations] = useState([emptyVacation(), emptyVacation()])
  const [preferences, setPreferences] = useState(emptyPreferences())

  useEffect(() => {
    if (!employee) return
    setGender(employee.gender || '')
    setVacations([
      { ...employee.vacations[0] },
      { ...employee.vacations[1] },
    ])
    setPreferences({ ...employee.preferences })
  }, [employee])

  if (!employee) return null

  const handleVacationChange = (index, field, value) => {
    setVacations((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onSave(employee.id, { gender, vacations, preferences })
    onClose()
  }

  return (
    <Modal title={employee.name} onClose={onClose} size="wide">
      <form className="duty-employee-card" onSubmit={handleSubmit}>
        <div className="duty-employee-card__meta">
          <span className="duty-employee-card__role">{DUTY_ROLE_LABELS[employee.role]}</span>
        </div>

        <fieldset className="duty-employee-card__fieldset">
          <legend>Пол</legend>
          <div className="duty-employee-card__radios">
            <label className="duty-employee-card__radio">
              <input
                type="radio"
                name="gender"
                value="M"
                checked={gender === 'M'}
                onChange={() => setGender('M')}
              />
              М
            </label>
            <label className="duty-employee-card__radio">
              <input
                type="radio"
                name="gender"
                value="F"
                checked={gender === 'F'}
                onChange={() => setGender('F')}
              />
              Ж
            </label>
          </div>
        </fieldset>

        <fieldset className="duty-employee-card__fieldset">
          <legend>Отпуска</legend>
          <p className="muted duty-employee-card__hint">
            Дни отпуска в графике перечёркиваются красной линией.
          </p>
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
        </fieldset>

        <fieldset className="duty-employee-card__fieldset">
          <legend>Пожелания</legend>
          <label>
            Когда могу работать
            <textarea
              rows={2}
              value={preferences.canWork}
              placeholder="Например: только дневные смены по будням"
              onChange={(e) => setPreferences((prev) => ({ ...prev, canWork: e.target.value }))}
            />
          </label>
          <label>
            Когда не ставить
            <textarea
              rows={2}
              value={preferences.avoid}
              placeholder="Например: не ставить в выходные и праздники"
              onChange={(e) => setPreferences((prev) => ({ ...prev, avoid: e.target.value }))}
            />
          </label>
        </fieldset>

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            Сохранить
          </button>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Отмена
          </button>
        </div>
      </form>
    </Modal>
  )
}
