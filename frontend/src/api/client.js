const API_BASE = import.meta.env.VITE_API_URL || '/api'

function getToken() {
  return localStorage.getItem('token')
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('token', token)
  } else {
    localStorage.removeItem('token')
  }
}

export async function apiRequest(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  const token = getToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  if (response.status === 204) {
    return null
  }

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = data.detail || data.message || 'Request failed'
    const err = new Error(typeof message === 'string' ? message : JSON.stringify(message))
    err.status = response.status
    throw err
  }
  return data
}

export const api = {
  login: (username, password) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  register: (body) =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  me: () => apiRequest('/auth/me'),
  auth: {
    changePassword: (body) =>
      apiRequest('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },
  users: {
    list: () => apiRequest('/users'),
    update: (id, body) =>
      apiRequest(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    makeFounder: (id) => apiRequest(`/users/${id}/founder`, { method: 'POST' }),
    delete: (id) => apiRequest(`/users/${id}`, { method: 'DELETE' }),
  },
}
