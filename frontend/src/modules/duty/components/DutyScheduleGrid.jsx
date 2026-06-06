import { Fragment } from 'react'
import { DUTY_MARK_BRIGADE, DUTY_MARK_PHONE } from '../constants'
import { MONTH_NAMES } from '../constants/months'
import { cellKey, daysInMonth, isNonWorkingDay, weekdayLabel } from '../utils/scheduleDays'
import { isDayInVacation } from '../utils/vacationDays'
import DutyDayCell from './DutyDayCell'

/**
 * Индекс первой строки после блока врачей (разделитель в таблице).
 */
function firstNonDoctorIndex(employees) {
  const index = employees.findIndex((employee) => employee.role !== 'doctor')
  return index === -1 ? employees.length : index
}

/**
 * Таблица графика: строки — сотрудники, столбцы — дни месяца.
 */
export default function DutyScheduleGrid({
  year,
  month,
  marks,
  employees,
  onToggleCell,
  onOpenEmployee,
}) {
  const dayCount = daysInMonth(year, month)
  const days = Array.from({ length: dayCount }, (_, index) => index + 1)
  const monthLabel = MONTH_NAMES[month - 1]
  const groupStartIndex = firstNonDoctorIndex(employees)

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
                  isNonWorkingDay(year, month, day) && 'duty-schedule__head-day--weekend',
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
          {employees.map((employee, index) => {
            const showGroupDivider = index === groupStartIndex && groupStartIndex > 0

            return (
              <Fragment key={employee.id}>
                {showGroupDivider && (
                  <tr className="duty-schedule__group-divider" aria-hidden="true">
                    <td colSpan={dayCount + 1} />
                  </tr>
                )}
                <tr className="duty-schedule__row">
                  <td className="duty-schedule__sticky duty-schedule__name">
                    <span className="duty-schedule__num">{index + 1}</span>
                    <button
                      type="button"
                      className="duty-schedule__name-btn"
                      onClick={() => onOpenEmployee(employee.id)}
                      title="Карточка сотрудника"
                    >
                      {employee.name}
                    </button>
                  </td>
                  {days.map((day) => {
                    const key = cellKey(employee.id, year, month, day)
                    const mark = marks[key] || ''
                    const onVacation = isDayInVacation(employee.vacations, year, month, day)
                    return (
                      <td
                        key={day}
                        className={[
                          'duty-schedule__cell',
                          isNonWorkingDay(year, month, day) && 'duty-schedule__cell--weekend',
                          onVacation && 'duty-schedule__cell--vacation',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        <DutyDayCell
                          day={day}
                          mark={mark}
                          isWeekend={isNonWorkingDay(year, month, day)}
                          onVacation={onVacation}
                          monthLabel={monthLabel}
                          employeeName={employee.name}
                          onToggle={() => onToggleCell(key)}
                        />
                      </td>
                    )
                  })}
                </tr>
              </Fragment>
            )
          })}
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
        <span className="duty-legend__item">
          <span className="duty-legend__sample duty-legend__sample--vacation" aria-hidden />
          отпуск
        </span>
        <span className="duty-legend__item muted">
          клик по ячейке: пусто → Б → О → пусто · по ФИО — карточка
        </span>
      </div>
    </div>
  )
}
