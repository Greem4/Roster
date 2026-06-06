import { MONTH_NAMES } from '../constants/months'

/**
 * Переключатель месяца и года для графика дежурств.
 */
export default function MonthYearPicker({ year, month, onYearChange, onMonthChange }) {
  return (
    <div className="duty-period-picker roster-page-toolbar__action" aria-label="Период графика">
      <button
        type="button"
        className="duty-period-picker__btn"
        onClick={() => onYearChange(-1)}
        aria-label="Предыдущий год"
      >
        ‹
      </button>
      <select
        className="duty-period-picker__month"
        value={month}
        onChange={(event) => onMonthChange(Number(event.target.value))}
        aria-label="Месяц"
      >
        {MONTH_NAMES.map((name, index) => (
          <option key={name} value={index + 1}>
            {name}
          </option>
        ))}
      </select>
      <span className="duty-period-picker__year">{year}</span>
      <button
        type="button"
        className="duty-period-picker__btn"
        onClick={() => onYearChange(1)}
        aria-label="Следующий год"
      >
        ›
      </button>
    </div>
  )
}
