import { useCallback, useState } from 'react'
import RosterModuleTitle from '../../../components/RosterModuleTitle'
import YearCalendar from '../components/YearCalendar'
import YearPicker from '../components/YearPicker'
import { dateKey } from '../utils/calendarDays'
import '../ca.css'

const currentYear = () => new Date().getFullYear()

/**
 * RosterCA: годовой календарь с выбором года, выделением дней и сеткой из 12 месяцев.
 */
export default function CaPage() {
  const [year, setYear] = useState(currentYear)
  const [selectedDates, setSelectedDates] = useState(() => new Set())

  const onYearChange = (delta) => {
    setYear((value) => value + delta)
  }

  const onToggleDay = useCallback((y, month, day) => {
    const key = dateKey(y, month, day)
    setSelectedDates((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }, [])

  return (
    <div className="ca-page">
      <header className="ca-page__header roster-page-toolbar">
        <div className="ca-page__intro">
          <RosterModuleTitle moduleKey="ca" as="h1" className="ca-page__title" />
          <p className="ca-page__subtitle muted">Календарь на год — все месяцы на одном экране</p>
        </div>
        <YearPicker year={year} onChange={onYearChange} />
      </header>

      <YearCalendar year={year} selectedDates={selectedDates} onToggleDay={onToggleDay} />
    </div>
  )
}
