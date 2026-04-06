import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Button from '../components/Button'
import { apiFetch, API_BASE } from '../api/apiFetch'
import { useAuth } from '../context/useAuth'
import { ALL_PLATFORMS, DEFAULT_AVATAR } from '../constants'
import './SettingsPage.css'

function SectionCard({ title, description, children, danger = false, wide = false }) {
  return (
    <section className={`card settings-card${danger ? ' danger' : ''}${wide ? ' wide' : ''}`}>
      <div className="settings-card-header">
        <h2>{title}</h2>
        {description && <p className="muted settings-description">{description}</p>}
      </div>
      <div className="settings-card-body">{children}</div>
    </section>
  )
}

function StatusMsg({ msg }) {
  if (!msg) return null
  const isErr = msg.startsWith('Error')
  return (
    <p className={`settings-status ${isErr ? 'settings-status-err' : 'settings-status-ok'}`}>
      {msg}
    </p>
  )
}

export default function SettingsPage() {
  const { user, login, logout } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername]         = useState(user?.username || '')
  const [usernameStatus, setUsernameStatus] = useState('')

  const [newPassword, setNewPassword]       = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordStatus, setPasswordStatus] = useState('')

  const [bio, setBio]           = useState('')
  const [bioStatus, setBioStatus] = useState('')

  const [avatarUrl, setAvatarUrl]       = useState('')
  const [avatarFile, setAvatarFile]     = useState(null)
  const [previewImage, setPreviewImage] = useState(DEFAULT_AVATAR)
  const [avatarStatus, setAvatarStatus] = useState('')

  const [platforms, setPlatforms]   = useState([])
  const [pcSpecs, setPcSpecs]       = useState({ cpu: '', gpu: '', ram: '', storage: '' })
  const [setupStatus, setSetupStatus] = useState('')

  const [deleteCheck, setDeleteCheck] = useState('')

  useEffect(() => {
    if (!user?.username) return
    apiFetch(`/users/find/${user.username}`)
      .then(r => r.json())
      .then(data => {
        setBio(data.bio || '')
        setAvatarUrl(data.avatarUrl || '')
        setPreviewImage(data.avatarUrl || DEFAULT_AVATAR)
        setPlatforms(data.platforms || [])
        setPcSpecs(data.pcSpecs || { cpu: '', gpu: '', ram: '', storage: '' })
      })
      .catch(() => {})
  }, [user?.username])

  function togglePlatform(name) {
    setPlatforms(prev =>
      prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]
    )
  }

  async function saveField(fields, setStatus) {
    try {
      const res = await apiFetch(`/users/update/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify(fields),
      })
      const data = await res.json()
      if (!res.ok) { setStatus(`Error: ${data.error}`); return false }
      setStatus('Saved successfully')
      return true
    } catch {
      setStatus('Error: request failed')
      return false
    }
  }

  async function handleSaveUsername(e) {
    e.preventDefault()
    if (!username.trim()) return setUsernameStatus('Error: username cannot be empty')
    const ok = await saveField({ username }, setUsernameStatus)
    if (ok) login({ ...user, username })
  }

  async function handleSavePassword(e) {
    e.preventDefault()
    if (!newPassword) return setPasswordStatus('Error: password cannot be empty')
    if (newPassword !== confirmPassword) return setPasswordStatus('Error: passwords do not match')
    const ok = await saveField({ password: newPassword }, setPasswordStatus)
    if (ok) { setNewPassword(''); setConfirmPassword('') }
  }

  async function handleSaveBio(e) {
    e.preventDefault()
    await saveField({ bio }, setBioStatus)
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarUrl('')
    setPreviewImage(URL.createObjectURL(file))
  }

  async function handleSaveAvatar(e) {
    e.preventDefault()
    if (avatarFile) {
      try {
        const formData = new FormData()
        formData.append('avatar', avatarFile)
        const res = await fetch(`${API_BASE}/upload/avatar`, {
          method: 'POST',
          headers: { 'X-User-Id': user.id },
          body: formData,
        })
        const data = await res.json()
        if (!res.ok) return setAvatarStatus(`Error: ${data.error}`)
        const ok = await saveField({ avatarUrl: data.url }, setAvatarStatus)
        if (ok) {
          setAvatarUrl(data.url)
          setAvatarFile(null)
          setPreviewImage(data.url)
          login({ ...user, avatarUrl: data.url })
        }
      } catch {
        setAvatarStatus('Error: upload failed')
      }
    } else {
      const ok = await saveField({ avatarUrl }, setAvatarStatus)
      if (ok) login({ ...user, avatarUrl })
    }
  }

  async function handleSaveSetup(e) {
    e.preventDefault()
    const hasPc = platforms.includes('PC')
    await saveField({ platforms, pcSpecs: hasPc ? pcSpecs : null }, setSetupStatus)
  }

  async function handleDeleteAccount() {
    try {
      const res = await apiFetch(`/users/delete/${user.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        alert(`Error: ${data.error}`)
        return
      }
      logout()
      navigate('/')
    } catch {
      alert('Error: failed to delete account')
    }
  }

  const hasPc = platforms.includes('PC')

  return (
    <div className="settings-page">
      <Navbar />
      <div className="container settings-container">
        <header className="settings-header">
          <p className="settings-kicker">Account center</p>
          <h1>Settings</h1>
        </header>

        <div className="settings-grid">

          {/* ── Username ── */}
          <SectionCard title="Change Username" description="Choose the name shown on your profile and reviews.">
            <form onSubmit={handleSaveUsername} style={{ display: 'contents' }}>
              <StatusMsg msg={usernameStatus} />
              <label className="settings-label" htmlFor="username">New username</label>
              <input
                id="username"
                className="field-input"
                type="text"
                placeholder="Enter a new username"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
              <div className="settings-actions">
                <Button type="submit">Save Username</Button>
              </div>
            </form>
          </SectionCard>

          {/* ── Password ── */}
          <SectionCard title="Change Password" description="Use a strong password with a mix of letters, numbers, and symbols.">
            <form onSubmit={handleSavePassword} style={{ display: 'contents' }}>
              <StatusMsg msg={passwordStatus} />
              <label className="settings-label" htmlFor="new-password">New password</label>
              <input
                id="new-password"
                className="field-input"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
              <label className="settings-label" htmlFor="confirm-password">Confirm new password</label>
              <input
                id="confirm-password"
                className="field-input"
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
              <div className="settings-actions">
                <Button type="submit">Update Password</Button>
              </div>
            </form>
          </SectionCard>

          {/* ── Bio ── */}
          <SectionCard title="Edit Bio" description="Tell others a bit about yourself.">
            <form onSubmit={handleSaveBio} style={{ display: 'contents' }}>
              <StatusMsg msg={bioStatus} />
              <label className="settings-label" htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                className="field-input settings-bio-textarea"
                placeholder="A short bio about yourself…"
                value={bio}
                onChange={e => setBio(e.target.value)}
                maxLength={300}
              />
              <div className="settings-actions">
                <Button type="submit">Save Bio</Button>
              </div>
            </form>
          </SectionCard>

          {/* ── Profile Picture ── */}
          <SectionCard title="Edit Profile Picture" description="Upload a file or paste an image URL.">
            <form onSubmit={handleSaveAvatar} style={{ display: 'contents' }}>
              <StatusMsg msg={avatarStatus} />
              <div className="avatar-editor">
                <img
                  src={previewImage}
                  alt="Profile preview"
                  className="settings-avatar-preview"
                  onError={() => setPreviewImage(DEFAULT_AVATAR)}
                />
                <div className="avatar-fields">
                  <label className="settings-label">Upload image</label>
                  <label className="avatar-upload-btn">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                    />
                    Choose File
                  </label>
                  {avatarFile && (
                    <p className="avatar-file-name">{avatarFile.name}</p>
                  )}

                  <label className="settings-label" style={{ marginTop: 6 }}>Or paste a URL</label>
                  <input
                    className="field-input"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={avatarUrl}
                    onChange={e => {
                      setAvatarUrl(e.target.value)
                      setAvatarFile(null)
                      setPreviewImage(e.target.value || DEFAULT_AVATAR)
                    }}
                  />
                  <div className="settings-actions">
                    <Button type="submit">Save Picture</Button>
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => { setAvatarFile(null); setAvatarUrl(''); setPreviewImage(DEFAULT_AVATAR) }}
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </SectionCard>

          {/* ── Gaming Setup ── */}
          <SectionCard
            title="Gaming Setup"
            description="Select the platforms you own. PC owners can also list their specs."
            wide
          >
            <form onSubmit={handleSaveSetup} style={{ display: 'contents' }}>
              <StatusMsg msg={setupStatus} />
              <div>
                <p className="settings-label" style={{ marginBottom: 10 }}>Platforms</p>
                <div className="platform-toggles">
                  {ALL_PLATFORMS.map(name => (
                    <button
                      key={name}
                      type="button"
                      className={`platform-toggle-btn${platforms.includes(name) ? ' active' : ''}`}
                      onClick={() => togglePlatform(name)}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              {hasPc && (
                <div className="specs-grid">
                  {[
                    { key: 'cpu',     label: 'CPU',     placeholder: 'e.g. AMD Ryzen 7 5800X' },
                    { key: 'gpu',     label: 'GPU',     placeholder: 'e.g. NVIDIA RTX 3080' },
                    { key: 'ram',     label: 'RAM',     placeholder: 'e.g. 32 GB DDR4' },
                    { key: 'storage', label: 'Storage', placeholder: 'e.g. 2 TB NVMe SSD' },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="settings-label" htmlFor={`spec-${key}`}>{label}</label>
                      <input
                        id={`spec-${key}`}
                        className="field-input"
                        type="text"
                        placeholder={placeholder}
                        value={pcSpecs[key]}
                        onChange={e => setPcSpecs(p => ({ ...p, [key]: e.target.value }))}
                        style={{ marginTop: 6 }}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="settings-actions">
                <Button type="submit">Save Setup</Button>
              </div>
            </form>
          </SectionCard>

          {/* ── Delete Account ── */}
          <SectionCard
            title="Delete Account"
            description="This action is irreversible. Type DELETE to unlock the button."
            danger
            wide
          >
            <label className="settings-label" htmlFor="delete-confirm">Type DELETE to confirm</label>
            <input
              id="delete-confirm"
              className="field-input"
              type="text"
              placeholder="DELETE"
              value={deleteCheck}
              onChange={e => setDeleteCheck(e.target.value)}
            />
            <div className="settings-actions">
              <button
                type="button"
                className="danger-action-btn"
                disabled={deleteCheck !== 'DELETE'}
                onClick={handleDeleteAccount}
              >
                Delete Account
              </button>
            </div>
          </SectionCard>

        </div>
      </div>
    </div>
  )
}
