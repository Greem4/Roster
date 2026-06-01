/**
 * Срок годности в виде ДД.ММ.ГГ (например 01.01.26).
 * @param {string} iso — дата ISO (YYYY-MM-DD)
 */
export function formatDate(iso) {
  const d = new Date(iso + 'T12:00:00')
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = String(d.getFullYear() % 100).padStart(2, '0')
  return `${day}.${month}.${year}`
}
