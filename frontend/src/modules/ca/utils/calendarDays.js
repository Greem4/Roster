/**
 * Сетка дней месяца для мини-календаря: null — пустая ячейка, число — день месяца.
 * Неделя начинается с понедельника.
 */
export function buildMonthGrid(year, month) {
  const daysInMonth = new Date(year, month, 0).getDate()
  const firstWeekday = (new Date(year, month - 1, 1).getDay() + 6) % 7
  const cells = Array.from({ length: firstWeekday }, () => null)

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day)
  }

  while (cells.length % 7 !== 0) {
    cells.push(null)
  }

  return cells
}

/** Является ли дата сегодняшней (локальное время). */
export function isToday(year, month, day) {
  const now = new Date()
  return (
    now.getFullYear() === year &&
    now.getMonth() + 1 === month &&
    now.getDate() === day
  )
}

/** Столбец субботы или воскресенья (0 — пн, 5–6 — выходные). */
export function isWeekendColumn(columnIndex) {
  return columnIndex % 7 >= 5
}

/** Выходной день недели по индексу ячейки в сетке месяца. */
export function isWeekendCell(cellIndex) {
  return isWeekendColumn(cellIndex)
}

/** Ключ даты для хранения выделения: YYYY-M-D. */
export function dateKey(year, month, day) {
  return `${year}-${month}-${day}`
}

/** Сколько выделенных дней в указанном месяце. */
export function countSelectedInMonth(selectedDates, year, month) {
  return getSelectedDaysInMonth(selectedDates, year, month).length
}

/** Номера выделенных дней месяца по возрастанию. */
export function getSelectedDaysInMonth(selectedDates, year, month) {
  const days = []

  for (const key of selectedDates) {
    const [y, m, d] = key.split('-').map(Number)
    if (y === year && m === month) {
      days.push(d)
    }
  }

  return days.sort((a, b) => a - b)
}

/** Строка чисел смен для копирования: «2 - 7 - 12». */
export function formatShiftDaysList(days) {
  return days.join(' - ')
}

/** Смен «сутки» в месяце по быстрому графику. */
export const MONTHLY_SHIFT_COUNT = 7

/** Дни недели смен: понедельник, среда, суббота. */
const SHIFT_WEEKDAY_INDICES = [0, 2, 5]

/** Минимум 2 выходных между сменами (разница чисел дней ≥ 3). */
const MIN_DAYS_BETWEEN_SHIFTS = 3

/** Желательно не больше 5 выходных (разница ≤ 6); при нехватке пн/ср/сб правило смягчается. */
const MAX_PREFERRED_DAYS_BETWEEN_SHIFTS = 6

function getWeekdayIndex(year, month, day) {
  return (new Date(year, month - 1, day).getDay() + 6) % 7
}

/** Смещает календарную дату на указанное число дней. */
function addCalendarDays(year, month, day, delta) {
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + delta)
  return date
}

function prevMonth(year, month) {
  if (month === 1) return { year: year - 1, month: 12 }
  return { year, month: month - 1 }
}

function nextMonth(year, month) {
  if (month === 12) return { year: year + 1, month: 1 }
  return { year, month: month + 1 }
}

/** Последний день смены в месяце среди выделенных дат, или null. */
function getLatestShiftDay(selectedDates, year, month) {
  let latest = null

  for (const key of selectedDates) {
    const [y, m, d] = key.split('-').map(Number)
    if (y === year && m === month && (latest == null || d > latest)) {
      latest = d
    }
  }

  return latest
}

/** Первый день смены в месяце среди выделенных дат, или null. */
function getEarliestShiftDay(selectedDates, year, month) {
  let earliest = null

  for (const key of selectedDates) {
    const [y, m, d] = key.split('-').map(Number)
    if (y === year && m === month && (earliest == null || d < earliest)) {
      earliest = d
    }
  }

  return earliest
}

/**
 * Минимальный номер дня месяца для смены с учётом последней смены в предыдущем месяце.
 * Например, смена 31 августа → в сентябре не раньше 3-го.
 */
function getMinFirstShiftDay(year, month, selectedDates) {
  const { year: prevYear, month: prevMonthNum } = prevMonth(year, month)
  const lastPrevDay = getLatestShiftDay(selectedDates, prevYear, prevMonthNum)
  if (lastPrevDay == null) return 1

  const earliest = addCalendarDays(prevYear, prevMonthNum, lastPrevDay, MIN_DAYS_BETWEEN_SHIFTS)
  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 0)

  if (earliest > monthEnd) return null
  if (earliest <= monthStart) return 1

  return earliest.getDate()
}

/**
 * Максимальный номер дня месяца для смены с учётом первой смены в следующем месяце.
 */
function getMaxLastShiftDay(year, month, selectedDates) {
  const { year: nextYear, month: nextMonthNum } = nextMonth(year, month)
  const firstNextDay = getEarliestShiftDay(selectedDates, nextYear, nextMonthNum)
  if (firstNextDay == null) return null

  const latest = addCalendarDays(nextYear, nextMonthNum, firstNextDay, -MIN_DAYS_BETWEEN_SHIFTS)
  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 0)

  if (latest < monthStart) return null
  if (latest >= monthEnd) return monthEnd.getDate()

  return latest.getDate()
}

/** Все пн / ср / сб месяца по порядку. */
function getAllowedShiftDays(year, month) {
  const daysInMonth = new Date(year, month, 0).getDate()
  const result = []

  for (let day = 1; day <= daysInMonth; day += 1) {
    if (SHIFT_WEEKDAY_INDICES.includes(getWeekdayIndex(year, month, day))) {
      result.push(day)
    }
  }

  return result
}

/**
 * Выбирает день смены: равномерность по targetDay, но с приоритетом перерыву ≤ 5 выходных.
 * @param {number[]} candidates допустимые дни ≥ minDay
 * @param {number} targetDay целевой день равномерной сетки
 * @param {number|null} prevDay предыдущая смена в этом месяце
 */
function pickShiftDay(candidates, targetDay, prevDay) {
  const preferred = prevDay == null
    ? candidates
    : candidates.filter((day) => day - prevDay <= MAX_PREFERRED_DAYS_BETWEEN_SHIFTS)
  const pool = preferred.length > 0 ? preferred : candidates

  let best = pool[0]
  let bestDistance = Math.abs(best - targetDay)

  for (const day of pool) {
    const distance = Math.abs(day - targetDay)
    if (distance < bestDistance) {
      best = day
      bestDistance = distance
    }
  }

  return best
}

/** Равномерно распределяет смены: минимум 2 выходных, желательно не больше 5. */
function distributeShiftDays(allowedDays, shiftCount, minFirstDay = 1) {
  const total = allowedDays.length
  if (total === 0) return []
  if (shiftCount === 1) {
    const only = allowedDays.find((day) => day >= minFirstDay)
    return only == null ? [] : [only]
  }

  const first = allowedDays[0]
  const last = allowedDays[total - 1]
  const picked = []

  for (let i = 0; i < shiftCount; i += 1) {
    const targetDay = Math.round(first + (i * (last - first)) / (shiftCount - 1))
    const prevDay = picked.length === 0 ? null : picked[picked.length - 1]
    const minDay = prevDay == null
      ? Math.max(allowedDays[0], minFirstDay)
      : prevDay + MIN_DAYS_BETWEEN_SHIFTS

    const candidates = allowedDays.filter((day) => day >= minDay)
    if (candidates.length === 0) break

    picked.push(pickShiftDay(candidates, targetDay, prevDay))
  }

  return picked
}

/**
 * Ключи дат 7 смен для быстрого графика месяца.
 * Учитывает смены соседних месяцев: после 31 августа первая смена в сентябре не раньше 3-го.
 * @param {number} year
 * @param {number} month 1–12
 * @param {string[]} [selectedDates] уже выделенные даты (для стыка месяцев)
 * @returns {string[]}
 */
export function buildMonthShiftKeys(year, month, selectedDates = []) {
  const minFirstDay = getMinFirstShiftDay(year, month, selectedDates)
  const maxLastDay = getMaxLastShiftDay(year, month, selectedDates)

  if (minFirstDay == null) return []

  let allowed = getAllowedShiftDays(year, month)
  allowed = allowed.filter((day) => (
    day >= minFirstDay && (maxLastDay == null || day <= maxLastDay)
  ))

  const days = distributeShiftDays(allowed, MONTHLY_SHIFT_COUNT, minFirstDay)

  return days.map((day) => dateKey(year, month, day))
}

/**
 * Ключи всех сменных дней месяца (пн / ср / сб) без ограничения в 7 смен.
 * Учитывает стык с соседними месяцами: после смены в конце прошлого месяца
 * ранние пн/ср/сб текущего месяца пропускаются.
 * @param {number} year
 * @param {number} month 1–12
 * @param {string[]} [selectedDates] уже выделенные даты (для стыка месяцев)
 * @returns {string[]}
 */
export function buildAllShiftWeekdayKeys(year, month, selectedDates = []) {
  const minFirstDay = getMinFirstShiftDay(year, month, selectedDates)
  const maxLastDay = getMaxLastShiftDay(year, month, selectedDates)

  if (minFirstDay == null) return []

  const days = getAllowedShiftDays(year, month).filter((day) => (
    day >= minFirstDay && (maxLastDay == null || day <= maxLastDay)
  ))

  return days.map((day) => dateKey(year, month, day))
}

/** Убирает из списка все даты указанного месяца. */
export function withoutMonthKeys(dates, year, month) {
  return dates.filter((key) => {
    const [y, m] = key.split('-').map(Number)
    return !(y === year && m === month)
  })
}
