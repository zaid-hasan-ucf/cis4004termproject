import { useState } from 'react'
import { AuthContext } from './authContextInstance'
import { getSavedUser, saveUser, removeSavedUser } from './authStorage'

export function OverlayModal({ show, onClose }) {
  const [expanded, setExpanded] = useState(false)

  if (!show) return null

  if (expanded) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.97)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.3s ease-out',
      }}>
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideIn {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.2); }
            50% { box-shadow: 0 0 30px rgba(255, 215, 0, 0.4); }
          }
        `}</style>
        <div style={{
          position: 'relative',
          width: '90%',
          maxWidth: 800,
          aspectRatio: '16/9',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(255, 215, 0, 0.2)',
          animation: 'slideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}>
          <button
            onClick={() => {
              setExpanded(false)
              onClose()
            }}
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: 'rgba(0,0,0,0.3)',
              border: '2px solid rgba(255,255,255,0.4)',
              color: '#fff',
              fontSize: 28,
              cursor: 'pointer',
              padding: '0 10px',
              borderRadius: 50,
              transition: 'all 0.2s ease',
              zIndex: 100000,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0,0,0,0.5)'
              e.currentTarget.style.transform = 'scale(1.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0,0,0,0.3)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            ✕
          </button>
          <iframe
            width="100%"
            height="100%"
            src="https://www.youtube.com/embed/EE-xtCF3T94?autoplay=1"
            frameBorder="0"
            allow="autoplay; encrypted-media"
            allowFullScreen
            style={{ borderRadius: 8, display: 'block' }}
          />
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setExpanded(true)}
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(147, 197, 253, 0.2), rgba(167, 139, 250, 0.2))',
        border: '2px solid rgba(147, 197, 253, 0.5)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 26,
        color: 'rgba(147, 197, 253, 0.9)',
        zIndex: 9999,
        transition: 'all 0.3s ease',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 0 20px rgba(147, 197, 253, 0.25)',
        animation: 'pulse-glow 2s ease-in-out infinite',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.15)'
        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(147, 197, 253, 0.3), rgba(167, 139, 250, 0.3))'
        e.currentTarget.style.boxShadow = '0 0 30px rgba(147, 197, 253, 0.4)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(147, 197, 253, 0.2), rgba(167, 139, 250, 0.2))'
        e.currentTarget.style.boxShadow = '0 0 20px rgba(147, 197, 253, 0.25)'
      }}
    >
      ▶
    </button>
  )
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getSavedUser())
  const [showOverlay, setShowOverlay] = useState(false)

  function login(userData) {
    setUser(userData)
    saveUser(userData)
  }

  function logout() {
    setUser(null)
    removeSavedUser()
  }

  const handleOverlayClose = () => {
    const today = new Date().toDateString()
    localStorage.setItem('overlay_last_shown', today)
    setShowOverlay(false)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, showOverlay, setShowOverlay, handleOverlayClose }}>
      {children}
    </AuthContext.Provider>
  )
}
