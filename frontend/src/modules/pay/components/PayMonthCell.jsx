import { formatMoney } from '../utils/formatMoney'

/**
 * Ячейка месяца: несколько сумм и итог под полями.
 * @param {object} props
 * @param {string} props.label — подпись месяца
 * @param {string[]} props.amounts — строковые значения полей
 * @param {boolean} props.canManage — можно редактировать
 * @param {string} props.currency
 * @param {(amounts: string[]) => void} props.onChange
 * @param {() => void} props.onAddLine
 * @param {(index: number) => void} props.onRemoveLine
 */
export default function PayMonthCell({
  label,
  amounts,
  canManage,
  currency,
  onChange,
  onAddLine,
  onRemoveLine,
}) {
  const total = amounts.reduce((sum, raw) => {
    const n = Number(raw)
    return sum + (Number.isNaN(n) ? 0 : n)
  }, 0)
  const showTotal = total > 0 || amounts.length > 1
  const filledAmounts = amounts
    .map((s) => Number(s))
    .filter((n) => !Number.isNaN(n) && n > 0)

  const updateLine = (index, value) => {
    const next = amounts.map((a, i) => (i === index ? value : a))
    onChange(next)
  }

  if (!canManage) {
    return (
      <div className="pay-month-cell pay-month-cell--readonly">
        <span className="pay-month-cell__label">{label}</span>
        {total > 0 ? (
          <>
            <span className="pay-month-cell__total">{formatMoney(total, currency)}</span>
            {filledAmounts.length > 1 && (
              <ul className="pay-month-cell__breakdown muted" aria-label="Состав суммы">
                {filledAmounts.map((n, i) => (
                  <li key={i}>{formatMoney(n, currency)}</li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <span className="pay-month-cell__empty muted">—</span>
        )}
      </div>
    )
  }

  return (
    <div className="pay-month-cell">
      <span className="pay-month-cell__label">{label}</span>
      <div className="pay-month-cell__lines">
        {amounts.map((value, index) => (
          <div key={index} className="pay-month-cell__line">
            <input
              className="input pay-month-cell__input"
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              value={value}
              onChange={(e) => updateLine(index, e.target.value)}
              aria-label={`${label}, сумма ${index + 1}`}
            />
            {amounts.length > 1 && (
              <button
                type="button"
                className="pay-month-cell__remove"
                onClick={() => onRemoveLine(index)}
                aria-label={`Убрать строку ${index + 1}`}
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          className="pay-month-cell__add"
          onClick={onAddLine}
          aria-label={`Добавить сумму, ${label}`}
        >
          +
        </button>
      </div>
      {showTotal && (
        <p className="pay-month-cell__sum muted">
          Σ {formatMoney(total, currency)}
        </p>
      )}
    </div>
  )
}
