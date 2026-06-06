const MONTH_DAYS = 30
const TWO_MONTHS_DAYS = 60

/** Цвет строки списка: ok / warn / danger по остатку срока годности. */
export function expiryTier(days) {
  if (days < MONTH_DAYS) return 'danger'
  if (days <= TWO_MONTHS_DAYS) return 'warn'
  return 'ok'
}
