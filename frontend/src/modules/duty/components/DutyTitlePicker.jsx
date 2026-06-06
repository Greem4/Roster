import { useEffect, useRef, useState } from 'react'
import { DUTY_TITLES, getDutyTitleLabel } from '../constants'

/**
 * Выбор должности: текущая — pill-кнопка, по клику раскрываются все четыре варианта.
 */
export default function DutyTitlePicker({ value, onChange, id = 'duty-title' }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const pick = (next) => {
    onChange(next)
    setOpen(false)
  }

  if (!open) {
    return (
      <div className="duty-title-picker" ref={rootRef}>
        <button
          type="button"
          className="duty-title-picker__current duty-employee-card__role duty-employee-card__role--active"
          aria-expanded="false"
          aria-haspopup="listbox"
          onClick={() => setOpen(true)}
        >
          {getDutyTitleLabel(value) || 'Выберите должность'}
        </button>
      </div>
    )
  }

  return (
    <div className="duty-title-picker duty-title-picker--open" ref={rootRef}>
      <div
        className="duty-title-picker__options duty-employee-card__roles"
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
            className={
              value === item.value
                ? 'duty-employee-card__role duty-employee-card__role--active'
                : 'duty-employee-card__role'
            }
            onClick={() => pick(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
