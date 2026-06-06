import { useState } from 'react'
import { getDutyTitleLabel } from '../modules/duty/constants'
import { useDutyEmployees } from '../modules/duty/hooks/useDutyEmployees'

/**
 * Исключение из справочника — отдельная вкладка, вне повседневной работы с графиком.
 */
export default function DutyStaffRemovePanel() {
  const { employees, loading, error, removeEmployee } = useDutyEmployees()
  const [busyId, setBusyId] = useState(null)

  const handleRemove = async (employee) => {
    if (!window.confirm(`Исключить «${employee.name}» из справочника графика?`)) return
    setBusyId(employee.id)
    try {
      await removeEmployee(employee.id)
    } catch (err) {
      window.alert(err.message || 'Не удалось исключить')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="cabinet-panel duty-staff-page">
      <section className="cabinet-section cabinet-section--warn">
        <h2 className="cabinet-section__title">Исключить из справочника</h2>
        <p className="muted cabinet-section__lead">
          Состав коллектива меняется редко. Удаление убирает человека из графика на сервере.
        </p>
        {loading && <p className="muted">Загрузка…</p>}
        {error && <p className="error">{error}</p>}
        <table className="users-table duty-staff-table" aria-label="Исключение из справочника ОСМП">
          <thead>
            <tr>
              <th>ФИО</th>
              <th>Должность</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id}>
                <td>{employee.name}</td>
                <td>{getDutyTitleLabel(employee.title)}</td>
                <td>
                  <button
                    type="button"
                    className="btn-secondary btn-secondary--danger duty-staff-remove-btn"
                    disabled={busyId === employee.id}
                    onClick={() => handleRemove(employee)}
                  >
                    {busyId === employee.id ? '…' : 'Исключить'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
