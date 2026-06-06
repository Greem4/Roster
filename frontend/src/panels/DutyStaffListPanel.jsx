import { useCallback, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { dutyApi } from '../modules/duty/api'
import DutyBirthDatePicker from '../modules/duty/components/DutyBirthDatePicker'
import DutyGenderPicker from '../modules/duty/components/DutyGenderPicker'
import DutyTitlePicker from '../modules/duty/components/DutyTitlePicker'
import { getDutyTitleLabel } from '../modules/duty/constants'
import { useDutyEmployees } from '../modules/duty/hooks/useDutyEmployees'
import { formatAgeLabel } from '../modules/duty/utils/employeeStorage'
import '../modules/duty/duty.css'

/**
 * Справочник сотрудников графика ОСМП: компактные pill-поля, правка по клику.
 */
export default function DutyStaffListPanel() {
  const { user, isFounder, refresh } = useAuth()
  const { employees, loading, error, updateEmployee } = useDutyEmployees()
  const [rowErrors, setRowErrors] = useState({})
  const [savingId, setSavingId] = useState(null)

  const canEditRow = useCallback((employeeId) => {
    if (isFounder) return true
    if (!user?.duty_employee_id) return true
    return user.duty_employee_id === employeeId
  }, [isFounder, user?.duty_employee_id])

  const saveProfile = useCallback(async (employeeId, patch) => {
    setRowErrors((prev) => ({ ...prev, [employeeId]: '' }))
    setSavingId(employeeId)
    try {
      if (!isFounder && !user?.duty_employee_id) {
        await dutyApi.linkMe(employeeId)
        await refresh()
      }
      await updateEmployee(employeeId, patch)
    } catch (err) {
      setRowErrors((prev) => ({
        ...prev,
        [employeeId]: err.message || 'Не удалось сохранить',
      }))
    } finally {
      setSavingId(null)
    }
  }, [isFounder, user?.duty_employee_id, refresh, updateEmployee])

  return (
    <div className="cabinet-panel duty-staff-page">
      <section className="cabinet-section">
        <h2 className="cabinet-section__title">Справочник</h2>
        <p className="muted cabinet-section__lead">
          Нажмите на значение в строке — откроется выбор. Отпуска и пожелания — на странице графика.
        </p>
        {loading && <p className="muted">Загрузка…</p>}
        {error && <p className="error">{error}</p>}
        <div className="duty-staff-table-wrap">
          <table className="users-table duty-staff-table" aria-label="Сотрудники ОСМП">
            <thead>
              <tr>
                <th>ФИО</th>
                <th>Должность</th>
                <th>Пол</th>
                <th>Дата рождения</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => {
                const editable = canEditRow(employee.id)
                const saving = savingId === employee.id
                const isMine = user?.duty_employee_id === employee.id
                const ageLabel = formatAgeLabel(employee.age)

                return (
                  <tr
                    key={employee.id}
                    className={[
                      saving ? 'duty-staff-table__row--saving' : '',
                      isMine ? 'duty-staff-table__row--mine' : '',
                    ].filter(Boolean).join(' ') || undefined}
                  >
                    <td className="duty-staff-table__name">{employee.name}</td>
                    <td className="duty-staff-table__cell duty-staff-table__cell--picker">
                      {editable ? (
                        <DutyTitlePicker
                          value={employee.title}
                          disabled={saving}
                          onChange={(title) => saveProfile(employee.id, { title })}
                          id={`duty-staff-title-${employee.id}`}
                        />
                      ) : (
                        getDutyTitleLabel(employee.title)
                      )}
                    </td>
                    <td className="duty-staff-table__cell duty-staff-table__cell--picker">
                      <DutyGenderPicker
                        value={employee.gender}
                        disabled={!editable || saving}
                        onChange={(gender) => saveProfile(employee.id, { gender })}
                      />
                    </td>
                    <td className="duty-staff-table__cell duty-staff-table__cell--picker">
                      <DutyBirthDatePicker
                        value={employee.birthDate}
                        ageLabel={ageLabel}
                        disabled={!editable || saving}
                        onChange={(birthDate) => saveProfile(employee.id, { birth_date: birthDate })}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {Object.entries(rowErrors).map(([id, message]) => (
          message ? (
            <p key={id} className="error duty-staff-table__error">
              {employees.find((e) => String(e.id) === id)?.name}: {message}
            </p>
          ) : null
        ))}
      </section>
    </div>
  )
}
