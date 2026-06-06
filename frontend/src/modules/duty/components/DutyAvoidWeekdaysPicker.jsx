import { WEEKDAY_LABELS } from '../constants/months'
import { normalizeAvoidWeekdays } from '../utils/monthPreferences'

/**
 * Выбор дней недели для правил месяца (ставить или не ставить смены).
 * @param {'can'|'avoid'} [variant='avoid']
 */
export default function DutyAvoidWeekdaysPicker({ value, onChange, variant = 'avoid' }) {
  const selected = normalizeAvoidWeekdays(value)
  const groupLabel = variant === 'can'
    ? 'Дни недели, когда ставить смены'
    : 'Дни недели, когда не ставить смены'

  const toggleWeekday = (weekday) => {
    const set = new Set(selected)
    if (set.has(weekday)) set.delete(weekday)
    else set.add(weekday)
    onChange(normalizeAvoidWeekdays([...set]))
  }

  return (
    <div className="duty-avoid-weekdays">
      <span className="duty-avoid-weekdays__label">Дни недели</span>
      <div className="duty-avoid-weekdays__row" role="group" aria-label={groupLabel}>
        {WEEKDAY_LABELS.map((label, weekday) => (
          <button
            key={label}
            type="button"
            className={[
              'duty-avoid-weekdays__day',
              weekday >= 5 && !selected.includes(weekday) && 'duty-avoid-weekdays__day--weekend',
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
