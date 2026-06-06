import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DUTY_ROLE_STAFF_HINT } from '../modules/duty/constants'
import DutyTitlePicker from '../modules/duty/components/DutyTitlePicker'
import { useDutyEmployees } from '../modules/duty/hooks/useDutyEmployees'
import '../modules/duty/duty.css'

/** Добавление сотрудника в справочник графика ОСМП (основатель, API). */
export default function DutyStaffNewPanel() {
  const navigate = useNavigate()
  const { addEmployee } = useDutyEmployees()
  const [name, setName] = useState('')
  const [title, setTitle] = useState('nurse')
  const [gender, setGender] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleAdd = async (event) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Укажите ФИО')
      return
    }
    if (!gender) {
      setError('Выберите пол')
      return
    }
    setSaving(true)
    setError('')
    try {
      await addEmployee({ name: trimmed, title, gender })
      navigate('/cabinet/duty-staff')
    } catch (err) {
      setError(err.message || 'Не удалось добавить')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="cabinet-panel duty-staff-page">
      <section className="cabinet-section">
        <h2 className="cabinet-section__title">Новый сотрудник</h2>
        <p className="muted cabinet-section__lead">
          Добавление в справочник на сервере — редкая операция. Должность сотрудник может уточнить в настройках.
        </p>
        <form className="cabinet-form" onSubmit={handleAdd}>
          <label>
            ФИО
            <input
              type="text"
              value={name}
              placeholder="Иванова Е.С."
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <div className="duty-osmp-settings__field">
            <span className="duty-osmp-settings__label">Должность</span>
            <DutyTitlePicker value={title} onChange={setTitle} id="duty-staff-title" />
            <p className="muted duty-osmp-settings__hint">{DUTY_ROLE_STAFF_HINT}</p>
          </div>
          <fieldset className="duty-staff-form__gender">
            <legend>Пол</legend>
            <div className="duty-employee-card__roles">
              <button
                type="button"
                className={
                  gender === 'M'
                    ? 'duty-employee-card__role duty-employee-card__role--active'
                    : 'duty-employee-card__role'
                }
                aria-pressed={gender === 'M'}
                onClick={() => setGender('M')}
              >
                М
              </button>
              <button
                type="button"
                className={
                  gender === 'F'
                    ? 'duty-employee-card__role duty-employee-card__role--active'
                    : 'duty-employee-card__role'
                }
                aria-pressed={gender === 'F'}
                onClick={() => setGender('F')}
              >
                Ж
              </button>
            </div>
          </fieldset>
          {error && <p className="error">{error}</p>}
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Добавление…' : 'Добавить'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/cabinet/duty-staff')}
            >
              Отмена
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
