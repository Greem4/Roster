import { apiRequest } from '../../api/client'

/**
 * HTTP-клиент только для /pay. Не добавлять в общий api.client — изоляция модулей.
 */
export const payApi = {
  listMonthly: (year) => apiRequest(`/pay/monthly?year=${encodeURIComponent(year)}`),
  upsertMonthly: (body) =>
    apiRequest('/pay/monthly', { method: 'PUT', body: JSON.stringify(body) }),
}
