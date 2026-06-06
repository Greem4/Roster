import { DUTY_ROLE_LABELS } from '../modules/duty/constants'
import { useDutyEmployees } from '../modules/duty/hooks/useDutyEmployees'

/** Справочник сотрудников графика ОСМП — только просмотр. */
export default function DutyStaffListPanel() {
  const { employees } = useDutyEmployees()

  return (
    <div className="cabinet-panel duty-staff-page">
      <section className="cabinet-section">
        <h2 className="cabinet-section__title">Справочник</h2>
        <p className="muted cabinet-section__lead">
          Сотрудники, которые отображаются в графике. Отпуска и пожелания — по ФИО на странице графика.
        </p>
        <table className="users-table duty-staff-table" aria-label="Сотрудники ОСМП">
          <thead>
            <tr>
              <th>ФИО</th>
              <th>Должность</th>
              <th>Пол</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id}>
                <td>{employee.name}</td>
                <td>{DUTY_ROLE_LABELS[employee.role]}</td>
                <td>{employee.gender === 'M' ? 'М' : employee.gender === 'F' ? 'Ж' : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
