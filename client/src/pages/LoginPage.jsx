import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { loginApi } from '../api/auth'
import Input from '../components/Input'
import Button from '../components/Button'

function LoginForm({ onSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (!username.trim() || !password) {
      setError('Please enter your username and password.')
      return
    }
    setLoading(true)
    try {
      const data = await loginApi(username, password)
      onSuccess(data.user)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <Input
        label="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Enter your username"
        autoFocus
      />
      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter your password"
        error={error}
      />
      <div className="actions">
        <Button type="submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
        <Button variant="ghost" type="button" onClick={() => navigate('/register')}>
          Register
        </Button>
      </div>
    </form>
  )
}

function LoginLeftPanel() {
  return (
    <div className="login-left">
      <div className="neon-title">MyGameList</div>
      <p className="neon-sub">Your ultimate game tracking companion</p>
      <ul className="login-features">
        <li>Track games across all platforms</li>
        <li>Write and read community reviews</li>
        <li>Build and manage your library</li>
        <li>Showcase your gaming setup</li>
      </ul>
      <div className="floating-orb" aria-hidden="true" />
      <div className="floating-orb-2" aria-hidden="true" />
      <div className="floating-squares" aria-hidden="true">
        <span /><span /><span /><span />
      </div>
    </div>
  )
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  function handleSuccess(user) {
    login(user)
    navigate((user.role === 'admin' || user.role === 'superuser') ? '/admin' : '/home')
  }

  function handleBypass() {
    login({ id: 'dev', username: 'devuser', role: 'user' })
    navigate('/home')
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <LoginLeftPanel />
        <div className="login-right">
          <h2>Sign in</h2>
          <p className="muted">Welcome back</p>
          <LoginForm onSuccess={handleSuccess} />
          <button type="button" className="bypass-btn" onClick={handleBypass}>
            Skip login (dev only)
          </button>
        </div>
      </div>
    </div>
  )
}
