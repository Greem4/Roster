import { useEffect, useState } from 'react'
import { formatDate } from '../../../utils/formatDate'
import { parseDisplayDate } from '../utils/employeeStorage'

/**
 * Поле даты отпуска: подпись «с»/«по» в одной строке с вводом дд.мм.гг.
 */
export default function DutyVacationDateInput({ value, onChange, label, minIso = null }) {
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setDraft(value ? formatDate(value) : '')
    setError('')
  }, [value])

  const commit = () => {
    const trimmed = draft.trim()
    if (!trimmed) {
      onChange('')
      setError('')
      return
    }

    const iso = parseDisplayDate(trimmed)
    if (!iso) {
      setError('дд.мм.гг')
      return
    }

    if (minIso && iso < minIso) {
      setError('раньше начала')
      return
    }

    onChange(iso)
    setDraft(formatDate(iso))
    setError('')
  }

  return (
    <div className="duty-vacation-date">
      <span className="duty-vacation-date__label">{label}</span>
      <input
        type="text"
        className="duty-vacation-date__input"
        inputMode="text"
        autoComplete="off"
        placeholder="дд.мм.гг"
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value)
          setError('')
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commit()
          }
        }}
      />
      {error && <span className="duty-vacation-date__error">{error}</span>}
    </div>
  )
}
