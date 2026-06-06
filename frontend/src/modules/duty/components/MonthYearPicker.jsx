import { MONTH_NAMES } from '../constants/months'

const YEAR_RANGE = 5

/** Годы вокруг текущего для компактного выбора. */
function yearOptions(centerYear) {
  const center = Number(centerYear)
  const start = center - YEAR_RANGE
  return Array.from({ length: YEAR_RANGE * 2 + 1 }, (_, index) => start + index)
}

/**
 * Переключатель периода графика: стрелки по месяцам, год — второстепенный select.
 */
export default function MonthYearPicker({ year, month, onMonthStep, onYearChange }) {
  const monthLabel = MONTH_NAMES[month - 1]

  return (
    <div className="duty-period-picker roster-page-toolbar__action" aria-label="Период графика">
      <div className="duty-period-picker__month-nav">
        <button
          type="button"
          className="duty-period-picker__btn"
          onClick={() => onMonthStep(-1)}
          aria-label="Предыдущий месяц"
        >
          ‹
        </button>
        <span className="duty-period-picker__month">{monthLabel}</span>
        <button
          type="button"
          className="duty-period-picker__btn"
          onClick={() => onMonthStep(1)}
          aria-label="Следующий месяц"
        >
          ›
        </button>
      </div>
      <select
        className="duty-period-picker__year"
        value={Number(year)}
        onChange={(event) => onYearChange(Number(event.target.value))}
        aria-label="Год"
      >
        {yearOptions(year).map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
    </div>
  )
}
