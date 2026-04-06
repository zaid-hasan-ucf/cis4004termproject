import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/useAuth'

export default function NotFoundPage() {
  const { user } = useAuth()
  return (
    <div>
      <Navbar />
      <div style={{ minHeight: 'calc(100vh - 56px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '5rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1, marginBottom: '0.5rem' }}>404</p>
          <h1 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Page not found</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            The page you're looking for doesn't exist.
          </p>
          <Link to={user ? '/home' : '/'} className="neon-btn" style={{ textDecoration: 'none', display: 'inline-block' }}>
            {user ? 'Go to Home' : 'Go to Login'}
          </Link>
        </div>
      </div>
    </div>
  )
}
