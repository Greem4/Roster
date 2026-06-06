import { DUTY_TITLES, getDutyTitleLabel } from '../constants'
import { useDutyInlinePicker } from '../hooks/useDutyInlinePicker'

/**
 * Выбор должности: pill с текущей, по клику — четыре варианта во всплывающей панели.
 */
export default function DutyTitlePicker({ value, onChange, id = 'duty-title', disabled = false }) {
  const { open, rootRef, close, toggle } = useDutyInlinePicker()
  const label = getDutyTitleLabel(value)

  if (disabled) {
    return (
      <span className="duty-inline-pill duty-inline-pill--readonly">
        {label !== '—' ? label : '—'}
      </span>
    )
  }

  return (
    <div className={`duty-inline-picker${open ? ' duty-inline-picker--open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className={`duty-inline-pill${value ? '' : ' duty-inline-pill--empty'}`}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={toggle}
      >
        {label !== '—' ? label : '—'}
      </button>
      {open && (
        <div
          className="duty-inline-picker__popover duty-inline-picker__popover--titles"
          role="listbox"
          aria-label="Должность"
          id={id}
        >
          {DUTY_TITLES.map((item) => (
            <button
              key={item.value}
              type="button"
              role="option"
              aria-selected={value === item.value}
              className={`duty-inline-pill${value === item.value ? ' duty-inline-pill--active' : ''}`}
              onClick={() => {
                onChange(item.value)
                close()
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
