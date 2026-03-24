import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerApi } from '../api/auth'
import Input from '../components/Input'
import Button from '../components/Button'

function RegisterForm({ onSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (!username.trim() || !password) {
      setError('Please enter a username and password.')
      return
    }
    setLoading(true)
    try {
      await registerApi(username, password)
      onSuccess(username)
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
        placeholder="Choose a username"
        autoFocus
      />
      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Choose a password"
        error={error}
      />
      <div className="actions">
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating…' : 'Create account'}
        </Button>
        <Button variant="ghost" type="button" onClick={() => navigate('/')}>
          Sign in
        </Button>
      </div>
    </form>
  )
}

function RegisterLeftPanel() {
  return (
    <div className="login-left">
      <div className="neon-title">Create Account</div>
      <p className="neon-sub">Join the community and start tracking</p>
      <ul className="login-features">
        <li>Free to create an account</li>
        <li>Track games across all platforms</li>
        <li>Write and read community reviews</li>
        <li>Build and manage your library</li>
      </ul>
      <div className="floating-orb" aria-hidden="true" />
      <div className="floating-orb-2" aria-hidden="true" />
      <div className="floating-squares" aria-hidden="true">
        <span /><span /><span /><span />
      </div>
    </div>
  )
}

export default function RegisterPage() {
  const navigate = useNavigate()

  // After register, send them to login to sign in with their new account
  function handleSuccess() {
    navigate('/')
  }

  function handleBypass() {
    navigate('/home')
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <RegisterLeftPanel />
        <div className="login-right">
          <h2>Register</h2>
          <p className="muted">Create a new account</p>
          <RegisterForm onSuccess={handleSuccess} />
          <button type="button" className="bypass-btn" onClick={handleBypass}>
            Skip registration (dev only)
          </button>
        </div>
      </div>
    </div>
  )
}
