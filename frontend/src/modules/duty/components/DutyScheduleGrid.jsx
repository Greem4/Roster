import { DUTY_EMPLOYEES, DUTY_MARK_BRIGADE, DUTY_MARK_PHONE, DUTY_ROLE_LABELS } from '../constants'
import { MONTH_NAMES } from '../constants/months'
import { cellKey, daysInMonth, isWeekend, weekdayLabel } from '../utils/scheduleDays'
import DutyDayCell from './DutyDayCell'

/**
 * Таблица графика: строки — сотрудники, столбцы — дни месяца.
 */
export default function DutyScheduleGrid({ year, month, marks, onToggleCell }) {
  const dayCount = daysInMonth(year, month)
  const days = Array.from({ length: dayCount }, (_, index) => index + 1)
  const monthLabel = MONTH_NAMES[month - 1]

  return (
    <div className="duty-schedule-wrap">
      <table className="duty-schedule" aria-label={`График за ${monthLabel} ${year}`}>
        <thead>
          <tr>
            <th className="duty-schedule__sticky duty-schedule__head-num" scope="col">
              №
            </th>
            <th className="duty-schedule__sticky duty-schedule__head-name" scope="col">
              Фамилия, И. О.
            </th>
            <th className="duty-schedule__sticky duty-schedule__head-role" scope="col">
              Должность
            </th>
            {days.map((day) => (
              <th
                key={day}
                className={[
                  'duty-schedule__head-day',
                  isWeekend(year, month, day) && 'duty-schedule__head-day--weekend',
                ]
                  .filter(Boolean)
                  .join(' ')}
                scope="col"
              >
                <span className="duty-schedule__day-num">{day}</span>
                <span className="duty-schedule__day-week muted">
                  {weekdayLabel(year, month, day)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DUTY_EMPLOYEES.map((employee, index) => (
            <tr
              key={employee.id}
              className={[
                'duty-schedule__row',
                employee.isSelf && 'duty-schedule__row--self',
                employee.role === 'doctor' && index === 0 && 'duty-schedule__row--group-start',
                employee.role === 'nurse' && employee.id === 6 && 'duty-schedule__row--group-start',
                employee.role === 'paramedic' && 'duty-schedule__row--group-start',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <td className="duty-schedule__sticky duty-schedule__num">{index + 1}</td>
              <td className="duty-schedule__sticky duty-schedule__name">{employee.name}</td>
              <td className="duty-schedule__sticky duty-schedule__role muted">
                {DUTY_ROLE_LABELS[employee.role]}
              </td>
              {days.map((day) => {
                const key = cellKey(employee.id, year, month, day)
                const mark = marks[key] || ''
                return (
                  <td
                    key={day}
                    className={[
                      'duty-schedule__cell',
                      isWeekend(year, month, day) && 'duty-schedule__cell--weekend',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <DutyDayCell
                      day={day}
                      mark={mark}
                      isWeekend={isWeekend(year, month, day)}
                      monthLabel={monthLabel}
                      employeeName={employee.name}
                      onToggle={() => onToggleCell(key)}
                    />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="duty-legend" aria-label="Обозначения">
        <span className="duty-legend__item">
          <span className="duty-legend__sample duty-legend__sample--brigade">{DUTY_MARK_BRIGADE}</span>
          бригада
        </span>
        <span className="duty-legend__item">
          <span className="duty-legend__sample duty-legend__sample--phone">{DUTY_MARK_PHONE}</span>
          телефоны
        </span>
        <span className="duty-legend__item muted">
          клик по ячейке: пусто → Б → О → пусто
        </span>
      </div>
    </div>
  )
}
