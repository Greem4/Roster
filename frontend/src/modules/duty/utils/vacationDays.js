/**
 * Проверяет, попадает ли календарный день в интервал отпуска (включительно).
 * @param {string} start — YYYY-MM-DD
 * @param {string} end — YYYY-MM-DD
 */
function parseIsoDate(iso) {
  if (!iso) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null
  }
  return date
}

/**
 * День месяца графика входит хотя бы в один из двух отпусков сотрудника.
 * @param {object[]} vacations — два интервала { start, end }
 */
export function isDayInVacation(vacations, year, month, day) {
  const target = new Date(year, month - 1, day).getTime()
  for (const vacation of vacations) {
    const start = parseIsoDate(vacation?.start)
    const end = parseIsoDate(vacation?.end)
    if (!start || !end) continue
    const from = Math.min(start.getTime(), end.getTime())
    const to = Math.max(start.getTime(), end.getTime())
    if (target >= from && target <= to) return true
  }
  return false
}
