import { useState } from 'react'
import { AuthContext } from './authContextInstance'
import { getSavedUser, saveUser, removeSavedUser } from './authStorage'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getSavedUser())

  function login(userData) {
    setUser(userData)
    saveUser(userData)
  }

  function logout() {
    setUser(null)
    removeSavedUser()
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
