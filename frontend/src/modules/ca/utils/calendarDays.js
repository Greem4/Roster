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
