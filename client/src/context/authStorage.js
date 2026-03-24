export function getSavedUser() {
  try {
    const saved = localStorage.getItem('mgl_user')
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

export function saveUser(userData) {
  try {
    localStorage.setItem('mgl_user', JSON.stringify(userData))
  } catch {
    // ignore storage errors in dev
  }
}

export function removeSavedUser() {
  try {
    localStorage.removeItem('mgl_user')
  } catch {
    // ignore
  }
}
