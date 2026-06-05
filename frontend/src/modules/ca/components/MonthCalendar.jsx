import { MONTH_NAMES, WEEKDAY_LABELS } from '../constants/months'
import {
  MONTHLY_SHIFT_COUNT,
  buildMonthGrid,
  countSelectedInMonth,
  dateKey,
  isToday,
  isWeekendCell,
  isWeekendColumn,
} from '../utils/calendarDays'

/**
 * Мини-календарь месяца: быстрый график 7 смен, автозаполнение и сброс.
 */
export default function MonthCalendar({
  year,
  month,
  selectedDates,
  isFilled,
  onToggleDay,
  onFillMonth,
  onFillAllShiftDays,
  onResetMonth,
}) {
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

      <div className="ca-month__schedule" aria-label={`График ${monthLabel}`}>
        <div className="ca-month__schedule-fill">
          <button
            type="button"
            className={[
              'ca-month__fill-btn',
              isFilled && 'ca-month__fill-btn--active',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-pressed={isFilled}
            aria-label={`${MONTHLY_SHIFT_COUNT} смен в месяце`}
            onClick={() => onFillMonth(year, month)}
          >
            {MONTHLY_SHIFT_COUNT}
          </button>
          <button
            type="button"
            className="ca-month__fill-btn ca-month__fill-btn--all"
            aria-label="Все сменные дни: пн, ср, сб"
            onClick={() => onFillAllShiftDays(year, month)}
          >
            Все
          </button>
        </div>
        <button
          type="button"
          className="ca-month__reset-btn"
          onClick={() => onResetMonth(year, month)}
        >
          Сброс
        </button>
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
          const selected = selectedDates.includes(dateKey(year, month, day))
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
