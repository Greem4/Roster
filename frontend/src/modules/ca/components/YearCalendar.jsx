import MonthCalendar from './MonthCalendar'

/**
 * Годовой календарь: сетка из 12 мини-календарей по месяцам.
 */
export default function YearCalendar({
  year,
  selectedDates,
  filledMonths,
  onToggleDay,
  onFillMonth,
  onResetMonth,
}) {
  const months = Array.from({ length: 12 }, (_, index) => index + 1)

  return (
    <section className="ca-year-calendar" aria-label={`Календарь ${year} года`}>
      <div className="ca-year-calendar__grid">
        {months.map((month) => (
          <MonthCalendar
            key={month}
            year={year}
            month={month}
            selectedDates={selectedDates}
            isFilled={filledMonths.includes(`${year}-${month}`)}
            onToggleDay={onToggleDay}
            onFillMonth={onFillMonth}
            onResetMonth={onResetMonth}
          />
        ))}
      </div>
    </section>
  )
}
