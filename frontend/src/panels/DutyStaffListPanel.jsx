import { getDutyTitleLabel } from '../modules/duty/constants'
import { useDutyEmployees } from '../modules/duty/hooks/useDutyEmployees'

/** Справочник сотрудников графика ОСМП — только просмотр (данные с сервера). */
export default function DutyStaffListPanel() {
  const { employees, loading, error } = useDutyEmployees()

  return (
    <div className="cabinet-panel duty-staff-page">
      <section className="cabinet-section">
        <h2 className="cabinet-section__title">Справочник</h2>
        <p className="muted cabinet-section__lead">
          Сотрудники графика на сервере. Должность и пол — в настройках у каждого. Отпуска и пожелания — на странице графика.
        </p>
        {loading && <p className="muted">Загрузка…</p>}
        {error && <p className="error">{error}</p>}
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
                <td>{getDutyTitleLabel(employee.title)}</td>
                <td>{employee.gender === 'M' ? 'М' : employee.gender === 'F' ? 'Ж' : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
