import { useEffect, useRef, useState } from 'react'
import { MONTH_NAMES } from '../constants/months'
import { countSelectedInMonth } from '../utils/calendarDays'
import MonthCalendar from './MonthCalendar'

const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1)

/** Месяц, с которого открывается год: текущий для текущего года, иначе январь. */
function startMonth(year) {
  const now = new Date()
  return now.getFullYear() === year ? now.getMonth() + 1 : 1
}

/**
 * Годовой календарь: на десктопе сетка из 12 мини-календарей.
 * На телефоне — лента месяцев сверху и один месяц на экран, листается свайпом (scroll-snap).
 */
export default function YearCalendar({
  year,
  yearControl,
  onGoToCurrentYear,
  selectedDates,
  filledMonths,
  onToggleDay,
  onFillMonth,
  onFillAllShiftDays,
  onResetMonth,
}) {
  const gridRef = useRef(null)
  const stripRef = useRef(null)
  const [activeMonth, setActiveMonth] = useState(() => startMonth(year))
  const [shownYear, setShownYear] = useState(year)

  // Смена года — сразу на стартовый месяц (подстройка состояния во время рендера, без эффекта).
  if (shownYear !== year) {
    setShownYear(year)
    setActiveMonth(startMonth(year))
  }

  const scrollToMonth = (month, behavior = 'smooth') => {
    const grid = gridRef.current
    if (!grid) return
    grid.scrollTo({ left: (month - 1) * grid.clientWidth, behavior })
  }

  // Лента свайпа встаёт на стартовый месяц года без анимации.
  useEffect(() => {
    scrollToMonth(startMonth(year), 'instant')
  }, [year])

  // Активный чип ленты всегда в зоне видимости.
  useEffect(() => {
    const chip = stripRef.current?.querySelector(`[data-month="${activeMonth}"]`)
    chip?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [activeMonth])

  const now = new Date()
  const todayYear = now.getFullYear()
  const todayMonth = now.getMonth() + 1
  const awayFromToday = year !== todayYear || activeMonth !== todayMonth

  // «Сегодня»: другой год — переключаем год (эффект выше сам встанет на текущий месяц).
  const goToToday = () => {
    if (year !== todayYear) onGoToCurrentYear()
    else scrollToMonth(todayMonth)
  }

  const onGridScroll = () => {
    const grid = gridRef.current
    if (!grid || grid.clientWidth === 0) return
    const month = Math.round(grid.scrollLeft / grid.clientWidth) + 1
    if (month !== activeMonth && month >= 1 && month <= 12) setActiveMonth(month)
  }

  return (
    <section className="ca-year-calendar" aria-label={`Календарь ${year} года`}>
      <div className="ca-mobile-bar">
        {yearControl}
        <nav ref={stripRef} className="ca-month-strip" aria-label="Месяцы">
          {MONTHS.map((month) => {
            const count = countSelectedInMonth(selectedDates, year, month)
            return (
              <button
                key={month}
                type="button"
                data-month={month}
                className={[
                'ca-month-strip__chip',
                month === activeMonth && 'ca-month-strip__chip--active',
                year === todayYear && month === todayMonth && 'ca-month-strip__chip--today',
              ]
                .filter(Boolean)
                .join(' ')}
                aria-current={month === activeMonth ? 'true' : undefined}
                onClick={() => scrollToMonth(month)}
              >
                {MONTH_NAMES[month - 1].slice(0, 3)}
                {count > 0 && <span className="ca-month-strip__count">{count}</span>}
              </button>
            )
          })}
        </nav>
        {awayFromToday && (
          <button type="button" className="ca-today-btn" onClick={goToToday}>
            Сегодня
          </button>
        )}
      </div>

      <div ref={gridRef} className="ca-year-calendar__grid" onScroll={onGridScroll}>
        {MONTHS.map((month) => (
          <MonthCalendar
            key={month}
            year={year}
            month={month}
            selectedDates={selectedDates}
            isFilled={filledMonths.includes(`${year}-${month}`)}
            onToggleDay={onToggleDay}
            onFillMonth={onFillMonth}
            onFillAllShiftDays={onFillAllShiftDays}
            onResetMonth={onResetMonth}
          />
        ))}
      </div>
    </section>
  )
}
