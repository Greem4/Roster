import { useCallback, useState } from 'react'
import RosterModuleTitle from '../../../components/RosterModuleTitle'
import YearCalendar from '../components/YearCalendar'
import YearPicker from '../components/YearPicker'
import {
  buildAllShiftWeekdayKeys,
  buildMonthShiftKeys,
  dateKey,
  withoutMonthKeys,
} from '../utils/calendarDays'
import '../ca.css'

const currentYear = () => new Date().getFullYear()

/** Ключ заполненного месяца: YYYY-M. */
function filledMonthKey(year, month) {
  return `${year}-${month}`
}

/**
 * RosterCA: годовой календарь с быстрым графиком 7 смен на каждом месяце.
 */
export default function CaPage() {
  const [year, setYear] = useState(currentYear)
  const [selectedDates, setSelectedDates] = useState([])
  const [filledMonths, setFilledMonths] = useState([])

  const onYearChange = (delta) => {
    setYear((value) => value + delta)
  }

  const onToggleDay = useCallback((y, month, day) => {
    const key = dateKey(y, month, day)
    setSelectedDates((prev) => (
      prev.includes(key)
        ? prev.filter((item) => item !== key)
        : [...prev, key]
    ))
    setFilledMonths((prev) => prev.filter((item) => item !== filledMonthKey(y, month)))
  }, [])

  /** Заполняет 7 смен в месяце по пн/ср/сб с учётом соседних месяцев. */
  const onFillMonth = useCallback((y, month) => {
    const monthKey = filledMonthKey(y, month)

    setSelectedDates((prev) => {
      const shiftKeys = buildMonthShiftKeys(y, month, prev)
      return [...withoutMonthKeys(prev, y, month), ...shiftKeys]
    })
    setFilledMonths((prev) => (
      prev.includes(monthKey) ? prev : [...prev, monthKey]
    ))
  }, [])

  /** Выделяет все пн/ср/сб месяца с учётом соседних месяцев. */
  const onFillAllShiftDays = useCallback((y, month) => {
    const monthKey = filledMonthKey(y, month)

    setSelectedDates((prev) => {
      const shiftKeys = buildAllShiftWeekdayKeys(y, month, prev)
      return [...withoutMonthKeys(prev, y, month), ...shiftKeys]
    })
    setFilledMonths((prev) => prev.filter((item) => item !== monthKey))
  }, [])

  /** Сброс смен только в выбранном месяце. */
  const onResetMonth = useCallback((y, month) => {
    const monthKey = filledMonthKey(y, month)

    setSelectedDates((prev) => withoutMonthKeys(prev, y, month))
    setFilledMonths((prev) => prev.filter((item) => item !== monthKey))
  }, [])

  return (
    <div className="ca-page">
      <header className="ca-page__header roster-page-toolbar">
        <div className="ca-page__intro">
          <RosterModuleTitle moduleKey="ca" as="h1" className="ca-page__title" />
          <p className="ca-page__subtitle muted">
            Сутки — пн, ср, сб. 7 смен в месяце, между сменами 2–5 выходных
          </p>
        </div>
        <YearPicker year={year} onChange={onYearChange} />
      </header>

      <YearCalendar
        year={year}
        selectedDates={selectedDates}
        filledMonths={filledMonths}
        onToggleDay={onToggleDay}
        onFillMonth={onFillMonth}
        onFillAllShiftDays={onFillAllShiftDays}
        onResetMonth={onResetMonth}
      />
    </div>
  )
}
