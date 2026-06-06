import { useDutyInlinePicker } from '../hooks/useDutyInlinePicker'

const GENDER_OPTIONS = [
  { value: 'M', label: 'М' },
  { value: 'F', label: 'Ж' },
]

/**
 * Выбор пола: pill с текущим значением, по клику — два варианта во всплывающей панели.
 */
export default function DutyGenderPicker({ value, onChange, disabled = false }) {
  const { open, rootRef, close, toggle } = useDutyInlinePicker()
  const label = value === 'M' ? 'М' : value === 'F' ? 'Ж' : null

  if (disabled) {
    return (
      <span className="duty-inline-pill duty-inline-pill--readonly">
        {label || '—'}
      </span>
    )
  }

  return (
    <div className={`duty-inline-picker${open ? ' duty-inline-picker--open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className={`duty-inline-pill${label ? '' : ' duty-inline-pill--empty'}`}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={toggle}
      >
        {label || '—'}
      </button>
      {open && (
        <div className="duty-inline-picker__popover" role="listbox" aria-label="Пол">
          {GENDER_OPTIONS.map((item) => (
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
