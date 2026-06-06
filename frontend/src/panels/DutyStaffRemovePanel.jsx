import { DUTY_ROLE_LABELS } from '../modules/duty/constants'
import { useDutyEmployees } from '../modules/duty/hooks/useDutyEmployees'

/**
 * Исключение из справочника — отдельная вкладка, вне повседневной работы с графиком.
 */
export default function DutyStaffRemovePanel() {
  const { employees, removeEmployee } = useDutyEmployees()

  return (
    <div className="cabinet-panel duty-staff-page">
      <section className="cabinet-section cabinet-section--warn">
        <h2 className="cabinet-section__title">Исключить из справочника</h2>
        <p className="muted cabinet-section__lead">
          Состав коллектива меняется редко. Удаление убирает человека из графика — отпуска и метки
          смен для него пропадут. Используйте только если сотрудник больше не в команде.
        </p>
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
                <td>{DUTY_ROLE_LABELS[employee.role]}</td>
                <td>
                  <button
                    type="button"
                    className="btn-secondary btn-secondary--danger duty-staff-remove-btn"
                    onClick={() => {
                      if (window.confirm(`Исключить «${employee.name}» из справочника графика?`)) {
                        removeEmployee(employee.id)
                      }
                    }}
                  >
                    Исключить
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
