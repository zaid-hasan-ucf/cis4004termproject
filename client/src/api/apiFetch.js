import { getSavedUser } from '../context/authStorage'

export const API_BASE     = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
export const SERVER_ORIGIN = API_BASE.replace(/\/api$/, '')

export function apiFetch(path, options = {}) {
  const user = getSavedUser()
  const authHeaders = user
    ? { 'X-User-Id': user.id }
    : {}

  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
  })
}
