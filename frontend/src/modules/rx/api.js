import { apiRequest } from '../../api/client'

/**
 * HTTP-клиент RosterRX: лекарства и предупреждения по срокам.
 * Не добавлять в общий api.client — изоляция модулей.
 */
export const rxApi = {
  medicines: {
    list: (params = {}) => {
      const q = new URLSearchParams(params).toString()
      return apiRequest(`/medicines${q ? `?${q}` : ''}`)
    },
    get: (id) => apiRequest(`/medicines/${id}`),
    create: (body) =>
      apiRequest('/medicines', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) =>
      apiRequest(`/medicines/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id) => apiRequest(`/medicines/${id}`, { method: 'DELETE' }),
  },
  alerts: {
    expiring: (days) => {
      const q = days != null ? `?days=${days}` : ''
      return apiRequest(`/alerts/expiring${q}`)
    },
  },
}
