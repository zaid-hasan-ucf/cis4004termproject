import { getSavedUser } from '../context/authStorage'

const BASE = 'http://localhost:5000/api'

export function apiFetch(path, options = {}) {
  const user = getSavedUser()
  const authHeaders = user
    ? { 'X-User-Id': user.id, 'X-User-Role': user.role }
    : {}

  return fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
  })
}
