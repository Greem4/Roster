import MonthCalendar from './MonthCalendar'

/**
 * Годовой календарь: сетка из 12 мини-календарей по месяцам.
 */
export default function YearCalendar({ year }) {
  const months = Array.from({ length: 12 }, (_, index) => index + 1)

  return (
    <section className="ca-year-calendar" aria-label={`Календарь ${year} года`}>
      <div className="ca-year-calendar__grid">
        {months.map((month) => (
          <MonthCalendar key={month} year={year} month={month} />
        ))}
      </div>
    </section>
  )
}
