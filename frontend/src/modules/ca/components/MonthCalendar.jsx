import { MONTH_NAMES, WEEKDAY_LABELS } from '../constants/months'
import {
  buildMonthGrid,
  countSelectedInMonth,
  dateKey,
  isToday,
  isWeekendCell,
  isWeekendColumn,
} from '../utils/calendarDays'

/**
 * Мини-календарь одного месяца: заголовок со счётчиком, дни недели и сетка дат с выделением.
 */
export default function MonthCalendar({ year, month, selectedDates, onToggleDay }) {
  const cells = buildMonthGrid(year, month)
  const monthLabel = MONTH_NAMES[month - 1]
  const selectedCount = countSelectedInMonth(selectedDates, year, month)

  return (
    <article className="ca-month" aria-label={`${monthLabel} ${year}`}>
      <div className="ca-month__header">
        <h3 className="ca-month__title">{monthLabel}</h3>
        <span
          className="ca-month__counter"
          aria-label={`Выделено дней: ${selectedCount}`}
        >
          {selectedCount}
        </span>
      </div>
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
          const selected = selectedDates.has(dateKey(year, month, day))
          const className = [
            'ca-month__day',
            weekend && 'ca-month__day--weekend',
            today && 'ca-month__day--today',
            selected && 'ca-month__day--selected',
          ]
            .filter(Boolean)
            .join(' ')

          return (
            <button
              key={day}
              type="button"
              className={className}
              role="gridcell"
              aria-current={today ? 'date' : undefined}
              aria-pressed={selected}
              aria-label={`${day} ${monthLabel}${selected ? ', выделено' : ''}`}
              onClick={() => onToggleDay(year, month, day)}
            >
              {day}
            </button>
          )
        })}
      </div>
    </article>
  )
}
