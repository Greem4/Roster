/**
 * Переключатель года для годового календаря RosterCA.
 */
export default function YearPicker({ year, onChange }) {
  return (
    <div className="ca-year-picker roster-page-toolbar__action" aria-label="Год">
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
