import { useEffect, useState } from 'react'
import { WEEKDAY_LABELS } from '../constants/months'
import { daysInMonth, isNonWorkingDay, weekdayIndex } from '../utils/scheduleDays'
import {
  formatAvoidDaysLabel,
  normalizeAvoidDays,
  normalizeAvoidWeekdays,
  parseAvoidDaysFromText,
} from '../utils/monthPreferences'

/**
 * Выбор чисел месяца, когда сотрудника не ставить: сетка + быстрый ввод «3, 5, 10-12».
 */
export default function DutyAvoidDaysPicker({
  year,
  month,
  value,
  avoidWeekdays = [],
  onChange,
}) {
  const dayCount = daysInMonth(year, month)
  const [textDraft, setTextDraft] = useState('')
  const [textError, setTextError] = useState('')

  const selected = normalizeAvoidDays(value, dayCount)
  const blockedWeekdays = normalizeAvoidWeekdays(avoidWeekdays)
  const summary = formatAvoidDaysLabel(selected)
  const leadingBlanks = weekdayIndex(year, month, 1)

  useEffect(() => {
    setTextDraft(summary)
    setTextError('')
  }, [summary, year, month])

  const toggleDay = (day) => {
    const set = new Set(selected)
    if (set.has(day)) set.delete(day)
    else set.add(day)
    onChange(normalizeAvoidDays([...set], dayCount))
  }

  const commitText = () => {
    const trimmed = textDraft.trim()
    if (!trimmed) {
      onChange([])
      setTextError('')
      return
    }

    const parsed = parseAvoidDaysFromText(trimmed, dayCount)
    if (!parsed.length) {
      setTextError('Пример: 3, 5, 10-12')
      return
    }

    onChange(parsed)
    setTextError('')
  }

  return (
    <div className="duty-avoid-days">
      <span className="duty-avoid-days__section-label">Числа месяца</span>
      <div className="duty-avoid-days__weekdays" aria-hidden>
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className="duty-avoid-days__weekday">
            {label}
          </span>
        ))}
      </div>
      <div className="duty-avoid-days__grid" role="group" aria-label="Числа месяца, когда не ставить">
        {Array.from({ length: leadingBlanks }, (_, index) => (
          <span key={`blank-${index}`} className="duty-avoid-days__spacer" aria-hidden />
        ))}
        {Array.from({ length: dayCount }, (_, index) => {
          const day = index + 1
          const active = selected.includes(day)
          const byWeekday = blockedWeekdays.includes(weekdayIndex(year, month, day))
          const off = isNonWorkingDay(year, month, day)
          return (
            <button
              key={day}
              type="button"
              className={[
                'duty-avoid-days__day',
                active && 'duty-avoid-days__day--active',
                byWeekday && !active && 'duty-avoid-days__day--weekday',
                off && 'duty-avoid-days__day--off',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-pressed={active}
              onClick={() => toggleDay(day)}
            >
              {day}
            </button>
          )
        })}
      </div>

      <label className="duty-avoid-days__quick">
        Быстрый ввод
        <input
          type="text"
          className="duty-avoid-days__quick-input"
          value={textDraft}
          placeholder="3, 5, 10-12"
          onChange={(e) => {
            setTextDraft(e.target.value)
            setTextError('')
          }}
          onBlur={commitText}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commitText()
            }
          }}
        />
      </label>
      {textError && <p className="duty-avoid-days__error">{textError}</p>}
    </div>
  )
}
