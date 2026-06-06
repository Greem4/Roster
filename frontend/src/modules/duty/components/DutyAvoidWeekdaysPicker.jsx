import { WEEKDAY_LABELS } from '../constants/months'
import { normalizeAvoidWeekdays } from '../utils/monthPreferences'

/**
 * Выбор дней недели, когда не ставить — только для текущего месяца графика.
 */
export default function DutyAvoidWeekdaysPicker({ value, onChange }) {
  const selected = normalizeAvoidWeekdays(value)

  const toggleWeekday = (weekday) => {
    const set = new Set(selected)
    if (set.has(weekday)) set.delete(weekday)
    else set.add(weekday)
    onChange(normalizeAvoidWeekdays([...set]))
  }

  return (
    <div className="duty-avoid-weekdays">
      <span className="duty-avoid-weekdays__label">Дни недели</span>
      <div className="duty-avoid-weekdays__row" role="group" aria-label="Дни недели, когда не ставить">
        {WEEKDAY_LABELS.map((label, weekday) => (
          <button
            key={label}
            type="button"
            className={[
              'duty-avoid-weekdays__day',
              selected.includes(weekday) && 'duty-avoid-weekdays__day--active',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-pressed={selected.includes(weekday)}
            onClick={() => toggleWeekday(weekday)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
