import { apiRequest } from '../../api/client'

/**
 * HTTP-клиент модуля RosterDuty (/duty). Не добавлять в общий api object.
 */
export const dutyApi = {
  listEmployees: () => apiRequest('/duty/employees'),
  createEmployee: (body) =>
    apiRequest('/duty/employees', { method: 'POST', body: JSON.stringify(body) }),
  patchEmployee: (id, body) =>
    apiRequest(`/duty/employees/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteEmployee: (id) =>
    apiRequest(`/duty/employees/${id}`, { method: 'DELETE' }),
  getMe: () => apiRequest('/duty/me'),
  linkMe: (employeeId) =>
    apiRequest('/duty/me/link', {
      method: 'PUT',
      body: JSON.stringify({ employee_id: employeeId }),
    }),
}
