import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

function UserAvatar({ username }) {
  return (
    <div className="avatar-placeholder" aria-hidden="true">
      {username[0].toUpperCase()}
    </div>
  )
}

function UserDropdown({ user, onClose, onLogout }) {
  return (
    <div className="dropdown" role="menu">
      <Link to={`/profile/${user.username}`} onClick={onClose}>Profile</Link>
      <Link to="/settings" onClick={onClose}>Settings</Link>
      {(user.role === 'admin' || user.role === 'superuser') && (
        <>
          <div className="dropdown-divider" />
          <Link to="/admin" onClick={onClose}>Admin Dashboard</Link>
        </>
      )}
      <div className="dropdown-divider" />
      <button onClick={onLogout}>Sign Out</button>
    </div>
  )
}

function UserMenu({ user }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  const navigate = useNavigate()
  const { logout } = useAuth()

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false)
      }
    }

    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        className="user-trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <UserAvatar username={user.username} />
        <span>{user.username}</span>
        <span className="chevron">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <UserDropdown
          user={user}
          onClose={() => setOpen(false)}
          onLogout={handleLogout}
        />
      )}
    </div>
  )
}

export default function Navbar() {
  const { user } = useAuth()

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/home" className="navbar-brand">MyGameList</Link>
        <Link to="/home" className="nav-link">Home</Link>
        <Link to="/search" className="nav-link">Browse</Link>
        <Link to="/library" className="nav-link">My Library</Link>
      </div>

      <div className="navbar-right">
        {user ? (
          <UserMenu user={user} />
        ) : (
          <Link
            to="/"
            className="neon-btn"
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          >
            Sign In
          </Link>
        )}
      </div>
    </nav>
  )
}