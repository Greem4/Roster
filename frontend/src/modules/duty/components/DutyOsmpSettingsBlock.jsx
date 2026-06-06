import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { dutyApi } from '../api'
import { DUTY_ROLE_STAFF_HINT, getDutyTitleLabel } from '../constants'
import { useDutyEmployees } from '../hooks/useDutyEmployees'
import DutyTitlePicker from './DutyTitlePicker'

/**
 * Блок «График ОСМП» в настройках: привязка к строке, должность (4 варианта) и пол.
 * Данные сохраняются на сервере (/duty).
 */
export default function DutyOsmpSettingsBlock() {
  const { refresh } = useAuth()
  const { employees, loading, error: listError, updateEmployee } = useDutyEmployees()
  const [employeeId, setEmployeeId] = useState(null)
  const [title, setTitle] = useState('nurse')
  const [gender, setGender] = useState('')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [linkLoading, setLinkLoading] = useState(true)

  const employee = employees.find((item) => item.id === employeeId) || null

  useEffect(() => {
    let cancelled = false
    setLinkLoading(true)
    dutyApi.getMe()
      .then((me) => {
        if (!cancelled) setEmployeeId(me.duty_employee_id)
      })
      .catch(() => {
        if (!cancelled) setError('Не удалось загрузить привязку к графику')
      })
      .finally(() => {
        if (!cancelled) setLinkLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!employee) return
    setTitle(employee.title || 'nurse')
    setGender(employee.gender || '')
    setSaved(false)
  }, [employee])

  const handleSave = async (event) => {
    event.preventDefault()
    setSaved(false)
    setError('')
    if (!employeeId) {
      setError('Выберите свою строку в графике')
      return
    }
    if (!gender) {
      setError('Выберите пол')
      return
    }
    setSaving(true)
    try {
      await dutyApi.linkMe(employeeId)
      await updateEmployee(employeeId, { title, gender })
      await refresh()
      setSaved(true)
    } catch (err) {
      setError(err.message || 'Не удалось сохранить')
    } finally {
      setSaving(false)
    }
  }

  if (linkLoading || loading) {
    return (
      <section className="cabinet-section duty-osmp-settings">
        <h2 className="cabinet-section__title">График ОСМП</h2>
        <p className="muted">Загрузка…</p>
      </section>
    )
  }

  return (
    <section className="cabinet-section duty-osmp-settings">
      <h2 className="cabinet-section__title">График ОСМП</h2>
      <p className="muted cabinet-section__lead">
        Здесь один раз выбираете свою строку, должность и пол — всё сохраняется на сервере.
        Пожелания и отпуска — в карточке на странице графика.
      </p>

      {listError && <p className="error">{listError}</p>}

      <form className="cabinet-form duty-osmp-settings__form" onSubmit={handleSave}>
        <label>
          Моя строка в графике
          <select
            value={employeeId ?? ''}
            onChange={(e) => {
              const next = e.target.value ? Number(e.target.value) : null
              setEmployeeId(next)
              setError('')
              setSaved(false)
            }}
          >
            <option value="">— выберите ФИО —</option>
            {employees.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        {employeeId && (
          <>
            <div className="duty-osmp-settings__field">
              <span className="duty-osmp-settings__label">Должность</span>
              <p className="muted duty-osmp-settings__picker-hint">Нажмите на текущую — откроются все четыре варианта.</p>
              <DutyTitlePicker value={title} onChange={setTitle} />
              <p className="muted duty-osmp-settings__hint">{DUTY_ROLE_STAFF_HINT}</p>
            </div>

            <div className="duty-osmp-settings__field">
              <span className="duty-osmp-settings__label">Пол</span>
              <div className="duty-employee-card__roles" role="group" aria-label="Пол">
                <button
                  type="button"
                  className={
                    gender === 'M'
                      ? 'duty-employee-card__role duty-employee-card__role--active'
                      : 'duty-employee-card__role'
                  }
                  aria-pressed={gender === 'M'}
                  onClick={() => {
                    setGender('M')
                    setSaved(false)
                  }}
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
                  onClick={() => {
                    setGender('F')
                    setSaved(false)
                  }}
                >
                  Ж
                </button>
              </div>
            </div>
          </>
        )}

        {error && <p className="error">{error}</p>}
        {saved && (
          <p className="duty-osmp-settings__saved muted">
            Сохранено на сервере: {getDutyTitleLabel(title)}
            {gender === 'M' ? ' · М' : gender === 'F' ? ' · Ж' : ''}
          </p>
        )}

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={!employeeId || saving}>
            {saving ? 'Сохранение…' : 'Сохранить'}
          </button>
          <Link to="/duty" className="btn-secondary">
            К графику
          </Link>
        </div>
      </form>
    </section>
  )
}
