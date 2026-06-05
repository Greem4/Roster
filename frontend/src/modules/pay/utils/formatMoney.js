/**
 * Форматирование суммы для интерфейса Pay (рубли по умолчанию).
 * @param {number|string} amount
 * @param {string} [currency='RUB']
 */
export function formatMoney(amount, currency = 'RUB') {
  const value = Number(amount)
  if (Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency }).format(value)
}
