/**
 * Сумма из поля ввода: запятая как десятичный разделитель (русская клавиатура телефона).
 * @param {string} raw
 * @returns {number} NaN, если не число
 */
export function parseAmount(raw) {
  return Number(String(raw).trim().replace(/\s/g, '').replace(',', '.'))
}
