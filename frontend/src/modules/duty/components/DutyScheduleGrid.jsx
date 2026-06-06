import { DUTY_EMPLOYEES, DUTY_MARK_BRIGADE, DUTY_MARK_PHONE } from '../constants'
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
      <table
        className="duty-schedule"
        style={{ '--duty-days': dayCount }}
        aria-label={`График за ${monthLabel} ${year}`}
      >
        <colgroup>
          <col className="duty-schedule__col-name" />
          {days.map((day) => (
            <col key={day} className="duty-schedule__col-day" />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th className="duty-schedule__sticky duty-schedule__head-name" scope="col">
              ФИО
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
                index === 5 && 'duty-schedule__row--group-start',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <td className="duty-schedule__sticky duty-schedule__name">
                <span className="duty-schedule__num">{index + 1}</span>
                {employee.name}
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
