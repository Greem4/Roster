import { useCallback, useMemo, useState } from 'react'
import RosterModuleTitle from '../../../components/RosterModuleTitle'
import DutyEmployeeCardModal from '../components/DutyEmployeeCardModal'
import DutyScheduleGrid from '../components/DutyScheduleGrid'
import MonthYearPicker from '../components/MonthYearPicker'
import { useDutyEmployees } from '../hooks/useDutyEmployees'
import { nextMark } from '../utils/scheduleDays'
import '../duty.css'

const currentYear = () => new Date().getFullYear()
const currentMonth = () => new Date().getMonth() + 1

/**
 * RosterDuty: шаблон графика выхода на работу (сетка сотрудники × дни).
 * Метки смен — в памяти; профили сотрудников — API /duty.
 */
export default function DutyPage() {
  const { employees, loading, error, updateEmployee } = useDutyEmployees()
  const [period, setPeriod] = useState(() => ({
    year: currentYear(),
    month: currentMonth(),
  }))
  const { year, month } = period
  const [marks, setMarks] = useState({})
  const [cardEmployeeId, setCardEmployeeId] = useState(null)

  const cardEmployee = useMemo(
    () => employees.find((employee) => employee.id === cardEmployeeId) || null,
    [employees, cardEmployeeId],
  )

  const onMonthStep = (delta) => {
    setPeriod(({ year, month }) => {
      let nextMonth = month + delta
      let nextYear = year
      if (nextMonth < 1) {
        nextMonth = 12
        nextYear -= 1
      } else if (nextMonth > 12) {
        nextMonth = 1
        nextYear += 1
      }
      return { year: nextYear, month: nextMonth }
    })
  }

  const onYearChange = (value) => {
    setPeriod((prev) => ({ ...prev, year: value }))
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

  const onSaveEmployee = useCallback(async (id, patch) => {
    await updateEmployee(id, patch)
  }, [updateEmployee])

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
          onMonthStep={onMonthStep}
          onYearChange={onYearChange}
        />
      </header>

      <div className="duty-page__body">
        {loading && <p className="muted duty-page__status">Загрузка справочника…</p>}
        {error && <p className="error duty-page__status">{error}</p>}
        {!loading && !error && (
        <DutyScheduleGrid
          year={year}
          month={month}
          marks={marks}
          employees={employees}
          onToggleCell={onToggleCell}
          onOpenEmployee={setCardEmployeeId}
        />
        )}
      </div>

      {cardEmployee && (
        <DutyEmployeeCardModal
          employee={cardEmployee}
          onClose={() => setCardEmployeeId(null)}
          onSave={onSaveEmployee}
        />
      )}
    </div>
  )
}
