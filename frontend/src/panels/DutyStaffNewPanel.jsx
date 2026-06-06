import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DUTY_ROLE_LABELS } from '../modules/duty/constants'
import { useDutyEmployees } from '../modules/duty/hooks/useDutyEmployees'

/** Добавление сотрудника в справочник графика ОСМП. */
export default function DutyStaffNewPanel() {
  const navigate = useNavigate()
  const { addEmployee } = useDutyEmployees()
  const [name, setName] = useState('')
  const [role, setRole] = useState('nurse')
  const [gender, setGender] = useState('')
  const [error, setError] = useState('')

  const handleAdd = (event) => {
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
    addEmployee({ name: trimmed, role, gender })
    navigate('/cabinet/duty-staff')
  }

  return (
    <div className="cabinet-panel duty-staff-page">
      <section className="cabinet-section">
        <h2 className="cabinet-section__title">Новый сотрудник</h2>
        <p className="muted cabinet-section__lead">
          Добавление в справочник — редкая операция. После сохранения вернётесь в справочник.
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
          <label>
            Должность
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="doctor">{DUTY_ROLE_LABELS.doctor}</option>
              <option value="nurse">{DUTY_ROLE_LABELS.nurse}</option>
              <option value="paramedic">{DUTY_ROLE_LABELS.paramedic}</option>
            </select>
          </label>
          <fieldset className="duty-staff-form__gender">
            <legend>Пол</legend>
            <label>
              <input
                type="radio"
                name="staff-gender"
                value="M"
                checked={gender === 'M'}
                onChange={() => setGender('M')}
              />
              М
            </label>
            <label>
              <input
                type="radio"
                name="staff-gender"
                value="F"
                checked={gender === 'F'}
                onChange={() => setGender('F')}
              />
              Ж
            </label>
          </fieldset>
          {error && <p className="error">{error}</p>}
          <div className="form-actions">
            <button type="submit" className="btn-primary">
              Добавить
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
