import { useState } from 'react'
import { formatMoney } from '../utils/formatMoney'
import { parseAmount } from '../utils/parseAmount'

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
 * @param {boolean} [props.defaultOpen] — на телефоне месяц раскрыт сразу (текущий)
 */
export default function PayMonthCell({
  label,
  amounts,
  canManage,
  currency,
  onChange,
  onAddLine,
  onRemoveLine,
  defaultOpen = false,
}) {
  // Телефон: месяц — строка «название · сумма», поля раскрываются по нажатию. На десктопе всегда открыто (CSS).
  const [open, setOpen] = useState(defaultOpen)
  const total = amounts.reduce((sum, raw) => {
    const n = parseAmount(raw)
    return sum + (Number.isNaN(n) ? 0 : n)
  }, 0)
  const showTotal = total > 0 || amounts.length > 1
  const filledAmounts = amounts
    .map((s) => parseAmount(s))
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
    <div className={`pay-month-cell${open ? ' pay-month-cell--open' : ''}`}>
      <button
        type="button"
        className="pay-month-cell__head"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="pay-month-cell__label">{label}</span>
        <span className={`pay-month-cell__head-total${total > 0 ? '' : ' muted'}`}>
          {total > 0 ? formatMoney(total, currency) : '—'}
        </span>
        <svg className="pay-month-cell__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div className="pay-month-cell__lines">
        {amounts.map((value, index) => (
          <div key={index} className="pay-month-cell__line">
            <input
              className="input pay-month-cell__input"
              type="text"
              inputMode="decimal"
              enterKeyHint="done"
              autoComplete="off"
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
          +<span className="pay-month-cell__add-text"> сумма</span>
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
