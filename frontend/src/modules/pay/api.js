import { apiRequest } from '../../api/client'

/**
 * HTTP-клиент только для /pay. Не добавлять в общий api.client — изоляция модулей.
 */
export const payApi = {
  summary: () => apiRequest('/pay/summary'),
  listAccounts: () => apiRequest('/pay/accounts'),
  createAccount: (body) =>
    apiRequest('/pay/accounts', { method: 'POST', body: JSON.stringify(body) }),
}
