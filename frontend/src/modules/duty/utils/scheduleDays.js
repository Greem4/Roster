import { WEEKDAY_LABELS } from '../constants/months'

/**
 * Сколько дней в месяце (month — 1..12).
 */
export function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

/**
 * День недели для числа месяца: 0 — пн, 6 — вс.
 */
export function weekdayIndex(year, month, day) {
  const date = new Date(year, month - 1, day)
  return (date.getDay() + 6) % 7
}

/**
 * Короткая подпись дня недели для ячейки заголовка.
 */
export function weekdayLabel(year, month, day) {
  return WEEKDAY_LABELS[weekdayIndex(year, month, day)]
}

/** Выходной: суббота или воскресенье. */
export function isWeekend(year, month, day) {
  const index = weekdayIndex(year, month, day)
  return index >= 5
}

/**
 * Ключ ячейки графика: employeeId-year-month-day.
 */
export function cellKey(employeeId, year, month, day) {
  return `${employeeId}-${year}-${month}-${day}`
}

/** Следующая метка в цикле пусто → Б → О → пусто. */
export function nextMark(current) {
  if (!current) return 'Б'
  if (current === 'Б') return 'О'
  return ''
}
