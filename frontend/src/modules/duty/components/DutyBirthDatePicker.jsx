import { useEffect, useRef, useState } from 'react'
import { formatDate } from '../../../utils/formatDate'
import { useDutyInlinePicker } from '../hooks/useDutyInlinePicker'
import {
  isoToDisplayDate,
  parseDisplayDate,
  validateDutyBirthDate,
} from '../utils/employeeStorage'

/**
 * Дата рождения: pill с датой, по клику — поле для ввода с клавиатуры (дд.мм.гггг).
 */
export default function DutyBirthDatePicker({
  value,
  onChange,
  ageLabel = null,
  disabled = false,
}) {
  const { open, rootRef, close, toggle } = useDutyInlinePicker()
  const inputRef = useRef(null)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')

  const closedLabel = value
    ? `${formatDate(value)}${ageLabel ? ` · ${ageLabel}` : ''}`
    : '—'

  useEffect(() => {
    if (!open) return undefined
    setError('')
    setDraft(value ? isoToDisplayDate(value) : '')
    const timer = window.setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }, 30)
    return () => window.clearTimeout(timer)
  }, [open, value])

  const commit = () => {
    const trimmed = draft.trim()
    if (!trimmed) {
      if (!value) {
        close()
        return
      }
      onChange(null)
      close()
      return
    }

    const iso = parseDisplayDate(trimmed)
    if (!iso) {
      setError('Формат: дд.мм.гггг')
      return
    }

    const message = validateDutyBirthDate(iso)
    if (message) {
      setError(message)
      return
    }

    if (iso === value) {
      close()
      return
    }

    onChange(iso)
    close()
  }

  if (disabled) {
    return (
      <span className="duty-inline-pill duty-inline-pill--readonly duty-inline-pill--wide">
        {closedLabel}
      </span>
    )
  }

  return (
    <div className={`duty-inline-picker${open ? ' duty-inline-picker--open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className={`duty-inline-pill duty-inline-pill--wide${value ? '' : ' duty-inline-pill--empty'}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={toggle}
      >
        {closedLabel}
      </button>
      {open && (
        <div
          className="duty-inline-picker__popover duty-inline-picker__popover--date"
          role="dialog"
          aria-label="Дата рождения"
        >
          <label className="duty-inline-picker__field">
            Дата рождения
            <input
              ref={inputRef}
              type="text"
              className="duty-inline-picker__date-text"
              inputMode="numeric"
              autoComplete="bday"
              placeholder="дд.мм.гггг"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value)
                setError('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  commit()
                }
                if (e.key === 'Escape') {
                  e.preventDefault()
                  close()
                }
              }}
              onBlur={(e) => {
                if (rootRef.current?.contains(e.relatedTarget)) return
                const current = value ? isoToDisplayDate(value) : ''
                if (draft.trim() === current) {
                  close()
                  return
                }
                commit()
              }}
            />
          </label>
          <p className="muted duty-inline-picker__hint">Не раньше 01.01.1940</p>
          {error && <p className="error duty-inline-picker__error">{error}</p>}
        </div>
      )}
    </div>
  )
}
