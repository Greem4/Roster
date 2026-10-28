/**
 * Переключатель года для годового календаря RosterCA. compact — в строке месяцев на телефоне.
 */
export default function YearPicker({ year, onChange, compact = false }) {
  return (
    <div
      className={compact ? 'ca-year-picker ca-year-picker--compact' : 'ca-year-picker roster-page-toolbar__action'}
      aria-label="Год"
    >
      <button
        type="button"
        className="ca-year-picker__btn"
        onClick={() => onChange(-1)}
        aria-label="Предыдущий год"
      >
        ‹
      </button>
      <span className="ca-year-picker__value">{year}</span>
      <button
        type="button"
        className="ca-year-picker__btn"
        onClick={() => onChange(1)}
        aria-label="Следующий год"
      >
        ›
      </button>
    </div>
  )
}
