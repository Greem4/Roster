import { MONTH_NAMES, WEEKDAY_LABELS } from '../constants/months'
import { buildMonthGrid, isToday, isWeekendCell, isWeekendColumn } from '../utils/calendarDays'

/**
 * Мини-календарь одного месяца: заголовок, дни недели и сетка дат.
 */
export default function MonthCalendar({ year, month }) {
  const cells = buildMonthGrid(year, month)
  const monthLabel = MONTH_NAMES[month - 1]

  return (
    <article className="ca-month" aria-label={`${monthLabel} ${year}`}>
      <h3 className="ca-month__title">{monthLabel}</h3>
      <div className="ca-month__weekdays" aria-hidden="true">
        {WEEKDAY_LABELS.map((label, index) => (
          <span
            key={label}
            className={[
              'ca-month__weekday',
              isWeekendColumn(index) && 'ca-month__weekday--weekend',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {label}
          </span>
        ))}
      </div>
      <div className="ca-month__grid" role="grid" aria-label={monthLabel}>
        {cells.map((day, index) => {
          if (day == null) {
            return (
              <span
                key={`empty-${index}`}
                className="ca-month__day ca-month__day--empty"
                role="gridcell"
                aria-hidden="true"
              />
            )
          }

          const today = isToday(year, month, day)
          const weekend = isWeekendCell(index)
          const className = [
            'ca-month__day',
            weekend && 'ca-month__day--weekend',
            today && 'ca-month__day--today',
          ]
            .filter(Boolean)
            .join(' ')

          return (
            <span
              key={day}
              className={className}
              role="gridcell"
              aria-current={today ? 'date' : undefined}
              aria-label={`${day} ${monthLabel}`}
            >
              {day}
            </span>
          )
        })}
      </div>
    </article>
  )
}
