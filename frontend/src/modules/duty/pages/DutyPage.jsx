import { useCallback, useState } from 'react'
import RosterModuleTitle from '../../../components/RosterModuleTitle'
import DutyScheduleGrid from '../components/DutyScheduleGrid'
import MonthYearPicker from '../components/MonthYearPicker'
import { nextMark } from '../utils/scheduleDays'
import '../duty.css'

const currentYear = () => new Date().getFullYear()
const currentMonth = () => new Date().getMonth() + 1

/**
 * RosterDuty: шаблон графика выхода на работу (сетка сотрудники × дни).
 * Данные пока только в памяти браузера.
 */
export default function DutyPage() {
  const [year, setYear] = useState(currentYear)
  const [month, setMonth] = useState(currentMonth)
  const [marks, setMarks] = useState({})

  const onYearChange = (delta) => {
    setYear((value) => value + delta)
  }

  const onMonthChange = (value) => {
    setMonth(value)
  }

  const onToggleCell = useCallback((key) => {
    setMarks((prev) => {
      const next = { ...prev }
      const mark = nextMark(next[key] || '')
      if (mark) {
        next[key] = mark
      } else {
        delete next[key]
      }
      return next
    })
  }, [])

  return (
    <div className="duty-page">
      <header className="duty-page__header">
        <div className="duty-page__intro">
          <RosterModuleTitle moduleKey="duty" as="h1" className="duty-page__title" />
          <p className="duty-page__subtitle muted">График выхода · ОСМП</p>
        </div>
        <MonthYearPicker
          year={year}
          month={month}
          onYearChange={onYearChange}
          onMonthChange={onMonthChange}
        />
      </header>

      <div className="duty-page__body">
        <DutyScheduleGrid
          year={year}
          month={month}
          marks={marks}
          onToggleCell={onToggleCell}
        />
      </div>
    </div>
  )
}
