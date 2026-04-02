import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { apiFetch } from '../api/apiFetch'
import { useAuth } from '../context/useAuth'

// ─── tiny helpers ────────────────────────────────────────────────────────────

function Badge({ children, color = '#6b7280' }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 12,
      fontSize: '0.75rem', fontWeight: 600, background: color, color: '#fff',
    }}>
      {children}
    </span>
  )
}

function ActionBtn({ onClick, children, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 10px', borderRadius: 6, fontSize: '0.8rem', cursor: 'pointer',
        border: 'none', fontWeight: 600,
        background: danger ? '#dc2626' : '#2563eb',
        color: '#fff', marginRight: 4,
      }}
    >
      {children}
    </button>
  )
}

function StatusMsg({ msg }) {
  if (!msg) return null
  const isErr = msg.startsWith('Error')
  return (
    <p style={{
      padding: '0.5rem 0.75rem', borderRadius: 6, marginBottom: '0.75rem',
      background: isErr ? '#fef2f2' : '#f0fdf4',
      color: isErr ? '#dc2626' : '#16a34a',
      border: `1px solid ${isErr ? '#fecaca' : '#bbf7d0'}`,
      fontSize: '0.875rem',
    }}>
      {msg}
    </p>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        background: '#1e1e2e', border: '1px solid #374151', borderRadius: 10,
        padding: '1.5rem', width: '100%', maxWidth: 480,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, color: '#f9fafb' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

const PAGE_SIZE = 50

function Pagination({ page, total, pageSize, onChange }) {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return null
  return (
    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginTop: '0.75rem', justifyContent: 'flex-end' }}>
      <button onClick={() => onChange(page - 1)} disabled={page === 1} style={pageBtnStyle(page === 1)}>‹ Prev</button>
      <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>Page {page} of {totalPages}</span>
      <button onClick={() => onChange(page + 1)} disabled={page === totalPages} style={pageBtnStyle(page === totalPages)}>Next ›</button>
    </div>
  )
}

// ─── GAMES TAB ────────────────────────────────────────────────────────────────

function GamesTab() {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  // create form
  const [createForm, setCreateForm] = useState({ title: '', appid: '' })
  const [creating, setCreating] = useState(false)

  // edit modal
  const [editTarget, setEditTarget] = useState(null)
  const [editForm, setEditForm] = useState({ title: '', appid: '' })

  async function load() {
    setLoading(true)
    try {
      const res = await apiFetch(`/games/all`)
      setGames(await res.json())
    } catch {
      setStatus('Error: failed to load games')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // Reset to page 1 when search changes
  useEffect(() => { setPage(1) }, [search])

  async function handleCreate(e) {
    e.preventDefault()
    if (!createForm.title.trim()) return setStatus('Error: title is required')
    setCreating(true)
    try {
      const res = await apiFetch(`/games/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: createForm.title, appid: Number(createForm.appid) || undefined }),
      })
      const data = await res.json()
      if (!res.ok) return setStatus(`Error: ${data.error}`)
      setStatus('Game created successfully')
      setCreateForm({ title: '', appid: '' })
      load()
    } catch {
      setStatus('Error: failed to create game')
    } finally {
      setCreating(false)
    }
  }

  function openEdit(game) {
    setEditTarget(game)
    setEditForm({ title: game.title, appid: game.appid || '' })
  }

  async function handleEdit(e) {
    e.preventDefault()
    try {
      const res = await apiFetch(`/games/update/${editTarget._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editForm.title, appid: Number(editForm.appid) || undefined }),
      })
      const data = await res.json()
      if (!res.ok) return setStatus(`Error: ${data.error}`)
      setStatus('Game updated successfully')
      setEditTarget(null)
      load()
    } catch {
      setStatus('Error: failed to update game')
    }
  }

  async function handleDelete(game) {
    if (!confirm(`Delete "${game.title}"? This cannot be undone.`)) return
    try {
      const res = await apiFetch(`/games/delete/${game._id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) return setStatus(`Error: ${data.error}`)
      setStatus(`Deleted "${game.title}"`)
      load()
    } catch {
      setStatus('Error: failed to delete game')
    }
  }

  const filtered = games.filter(g => g.title.toLowerCase().includes(search.toLowerCase()))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div>
      <StatusMsg msg={status} />

      {/* Create form */}
      <div style={cardStyle}>
        <h3 style={cardHead}>Add New Game</h3>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input
            style={inputStyle} placeholder="Game title *"
            value={createForm.title} onChange={e => setCreateForm(p => ({ ...p, title: e.target.value }))}
          />
          <input
            style={{ ...inputStyle, width: 140 }} placeholder="Steam AppID"
            value={createForm.appid} onChange={e => setCreateForm(p => ({ ...p, appid: e.target.value }))}
          />
          <button type="submit" disabled={creating} style={submitBtnStyle}>
            {creating ? 'Adding…' : '+ Add Game'}
          </button>
        </form>
      </div>

      {/* Game list */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ margin: 0, color: '#f9fafb' }}>
            All Games <Badge color="#4b5563">{games.length}</Badge>
            {search && filtered.length !== games.length && (
              <span style={{ ...mutedText, marginLeft: 8 }}>({filtered.length} matching)</span>
            )}
          </h3>
          <input
            style={{ ...inputStyle, width: 260 }} placeholder="Search by title…"
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        {loading ? <p style={mutedText}>Loading…</p> : (
          <>
            <table style={tableStyle}>
              <thead>
                <tr>
                  {['Title', 'AppID', 'Added', 'Actions'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={4} style={{ ...tdStyle, color: '#9ca3af' }}>No games found</td></tr>
                ) : paginated.map(game => (
                  <tr key={game._id} style={{ borderBottom: '1px solid #374151' }}>
                    <td style={tdStyle}>{game.title}</td>
                    <td style={tdStyle}>{game.appid ? <Badge color="#7c3aed">{game.appid}</Badge> : <span style={mutedText}>—</span>}</td>
                    <td style={tdStyle}>{game.createdAt ? new Date(game.createdAt).toLocaleDateString() : '—'}</td>
                    <td style={tdStyle}>
                      <ActionBtn onClick={() => openEdit(game)}>Edit</ActionBtn>
                      <ActionBtn danger onClick={() => handleDelete(game)}>Delete</ActionBtn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
          </>
        )}
      </div>

      {/* Edit modal */}
      {editTarget && (
        <Modal title={`Edit: ${editTarget.title}`} onClose={() => setEditTarget(null)}>
          <form onSubmit={handleEdit} style={{ display: 'grid', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>Title</label>
              <input style={inputStyle} value={editForm.title}
                onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Steam AppID</label>
              <input style={inputStyle} value={editForm.appid}
                onChange={e => setEditForm(p => ({ ...p, appid: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setEditTarget(null)} style={cancelBtnStyle}>Cancel</button>
              <button type="submit" style={submitBtnStyle}>Save Changes</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

// ─── USERS TAB ────────────────────────────────────────────────────────────────

function UsersTab() {
  const { user: caller } = useAuth()
  const isSuperuser = caller?.role === 'superuser'
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')

  // create form
  const [createForm, setCreateForm] = useState({ username: '', password: '', role: 'user' })
  const [creating, setCreating] = useState(false)

  // edit modal
  const [editTarget, setEditTarget] = useState(null)
  const [editForm, setEditForm] = useState({ username: '', role: 'user', bio: '', newPassword: '' })

  async function load() {
    setLoading(true)
    try {
      const res = await apiFetch(`/users/all`)
      setUsers(await res.json())
    } catch {
      setStatus('Error: failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e) {
    e.preventDefault()
    if (!createForm.username.trim() || !createForm.password.trim())
      return setStatus('Error: username and password are required')
    setCreating(true)
    try {
      const res = await apiFetch(`/users/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      })
      const data = await res.json()
      if (!res.ok) return setStatus(`Error: ${data.error}`)
      setStatus('User created successfully')
      setCreateForm({ username: '', password: '', role: 'user' })
      load()
    } catch {
      setStatus('Error: failed to create user')
    } finally {
      setCreating(false)
    }
  }

  function openEdit(user) {
    setEditTarget(user)
    setEditForm({ username: user.username, role: user.role || 'user', bio: user.bio || '', newPassword: '' })
  }

  async function handleEdit(e) {
    e.preventDefault()
    try {
      const payload = { username: editForm.username, bio: editForm.bio }
      // only include role if it actually changed — backend blocks non-superusers from changing roles
      if (editForm.role !== editTarget.role) payload.role = editForm.role
      if (editForm.newPassword.trim()) payload.password = editForm.newPassword
      const res = await apiFetch(`/users/update/${editTarget._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) return setStatus(`Error: ${data.error}`)
      setStatus('User updated successfully')
      setEditTarget(null)
      load()
    } catch {
      setStatus('Error: failed to update user')
    }
  }

  async function handleDelete(user) {
    if (!confirm(`Delete user "${user.username}"? This cannot be undone.`)) return
    try {
      const res = await apiFetch(`/users/delete/${user._id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) return setStatus(`Error: ${data.error}`)
      setStatus(`Deleted user "${user.username}"`)
      load()
    } catch {
      setStatus('Error: failed to delete user')
    }
  }

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <StatusMsg msg={status} />

      {/* Create form */}
      <div style={cardStyle}>
        <h3 style={cardHead}>Create New User</h3>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input
            style={inputStyle} placeholder="Username *"
            value={createForm.username} onChange={e => setCreateForm(p => ({ ...p, username: e.target.value }))}
          />
          <input
            style={inputStyle} type="password" placeholder="Password *"
            value={createForm.password} onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))}
          />
          <select
            style={{ ...inputStyle, width: 120 }}
            value={createForm.role} onChange={e => setCreateForm(p => ({ ...p, role: e.target.value }))}
          >
            <option value="user">User</option>
            {isSuperuser && <option value="admin">Admin</option>}
            {isSuperuser && <option value="superuser">Superuser</option>}
          </select>
          <button type="submit" disabled={creating} style={submitBtnStyle}>
            {creating ? 'Creating…' : '+ Create User'}
          </button>
        </form>
      </div>

      {/* User list */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h3 style={{ margin: 0, color: '#f9fafb' }}>All Users <Badge color="#4b5563">{users.length}</Badge></h3>
          <input
            style={{ ...inputStyle, width: 220 }} placeholder="Search users…"
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        {loading ? <p style={mutedText}>Loading…</p> : (
          <table style={tableStyle}>
            <thead>
              <tr>
                {['Username', 'Role', 'Joined', 'Actions'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={4} style={{ ...tdStyle, color: '#9ca3af' }}>No users found</td></tr>
              ) : filtered.map(user => (
                <tr key={user._id} style={{ borderBottom: '1px solid #374151' }}>
                  <td style={tdStyle}>{user.username}</td>
                  <td style={tdStyle}>
                    <Badge color={(user.role === 'admin' || user.role === 'superuser') ? '#dc2626' : '#2563eb'}>
                      {user.role || 'user'}
                    </Badge>
                  </td>
                  <td style={tdStyle}>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</td>
                  <td style={tdStyle}>
                    {(isSuperuser || user.role === 'user') && (
                      <ActionBtn onClick={() => openEdit(user)}>Edit</ActionBtn>
                    )}
                    {(isSuperuser || user.role === 'user') && (
                      <ActionBtn danger onClick={() => handleDelete(user)}>Delete</ActionBtn>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit modal */}
      {editTarget && (
        <Modal title={`Edit: ${editTarget.username}`} onClose={() => setEditTarget(null)}>
          <form onSubmit={handleEdit} style={{ display: 'grid', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>Username</label>
              <input style={inputStyle} value={editForm.username}
                onChange={e => setEditForm(p => ({ ...p, username: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Role</label>
              <select style={inputStyle} value={editForm.role}
                onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))}
                disabled={!isSuperuser}
              >
                <option value="user">User</option>
                {isSuperuser && <option value="admin">Admin</option>}
                {isSuperuser && <option value="superuser">Superuser</option>}
              </select>
              {!isSuperuser && (
                <span style={{ ...labelStyle, marginTop: 4 }}>Only superusers can change roles</span>
              )}
            </div>
            <div>
              <label style={labelStyle}>Bio</label>
              <textarea style={{ ...inputStyle, height: 80, resize: 'vertical' }} value={editForm.bio}
                onChange={e => setEditForm(p => ({ ...p, bio: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Reset Password <span style={{ color: '#6b7280' }}>(leave blank to keep current)</span></label>
              <input style={inputStyle} type="password" placeholder="New password…"
                value={editForm.newPassword}
                onChange={e => setEditForm(p => ({ ...p, newPassword: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setEditTarget(null)} style={cancelBtnStyle}>Cancel</button>
              <button type="submit" style={submitBtnStyle}>Save Changes</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

// ─── REVIEWS TAB ─────────────────────────────────────────────────────────────

function ReviewsTab() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')

  async function load() {
    setLoading(true)
    try {
      const res = await apiFetch(`/reviews/all`)
      setReviews(await res.json())
    } catch {
      setStatus('Error: failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleDelete(review) {
    if (!confirm('Delete this review? This cannot be undone.')) return
    try {
      const res = await apiFetch(`/reviews/delete/${review._id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) return setStatus(`Error: ${data.error}`)
      setStatus('Review deleted')
      load()
    } catch {
      setStatus('Error: failed to delete review')
    }
  }

  const filtered = reviews.filter(r =>
    (r.body || '').toLowerCase().includes(search.toLowerCase())
  )

  function ratingColor(r) {
    if (r >= 8) return '#16a34a'
    if (r >= 5) return '#d97706'
    return '#dc2626'
  }

  return (
    <div>
      <StatusMsg msg={status} />

      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h3 style={{ margin: 0, color: '#f9fafb' }}>All Reviews <Badge color="#4b5563">{reviews.length}</Badge></h3>
          <input
            style={{ ...inputStyle, width: 260 }} placeholder="Search review text…"
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        {loading ? <p style={mutedText}>Loading…</p> : (
          <table style={tableStyle}>
            <thead>
              <tr>
                {['User', 'Game', 'Rating', 'Review', 'Posted', 'Actions'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ ...tdStyle, color: '#9ca3af' }}>No reviews found</td></tr>
              ) : filtered.map(review => (
                <tr key={review._id} style={{ borderBottom: '1px solid #374151' }}>
                  <td style={tdStyle}>{review.username}</td>
                  <td style={tdStyle}>{review.gameTitle}</td>
                  <td style={tdStyle}>
                    <Badge color={ratingColor(review.rating)}>{review.rating}/10</Badge>
                  </td>
                  <td style={{ ...tdStyle, maxWidth: 280 }}>
                    <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {review.body}
                    </span>
                  </td>
                  <td style={tdStyle}>{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : '—'}</td>
                  <td style={tdStyle}>
                    <ActionBtn danger onClick={() => handleDelete(review)}>Delete</ActionBtn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ─── STATS OVERVIEW ──────────────────────────────────────────────────────────

function StatsOverview({ stats }) {
  const cards = [
    { label: 'Total Games', value: stats.games, color: '#7c3aed' },
    { label: 'Total Users', value: stats.users, color: '#2563eb' },
    { label: 'Total Reviews', value: stats.reviews, color: '#16a34a' },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
      {cards.map(c => (
        <div key={c.label} style={{
          background: '#1e1e2e', border: `1px solid ${c.color}44`,
          borderRadius: 10, padding: '1.25rem', textAlign: 'center',
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: c.color }}>{stats.loading ? '…' : c.value}</div>
          <div style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: 4 }}>{c.label}</div>
        </div>
      ))}
    </div>
  )
}

// ─── SHARED STYLES ───────────────────────────────────────────────────────────

const cardStyle = {
  background: '#1e1e2e', border: '1px solid #374151',
  borderRadius: 10, padding: '1.25rem', marginBottom: '1rem',
}

const cardHead = { margin: '0 0 0.75rem 0', color: '#f9fafb', fontSize: '1rem' }

const inputStyle = {
  padding: '0.4rem 0.65rem', borderRadius: 6, fontSize: '0.875rem',
  border: '1px solid #374151', background: '#111827', color: '#f9fafb',
  outline: 'none', width: '100%', boxSizing: 'border-box',
}

const submitBtnStyle = {
  padding: '0.4rem 1rem', borderRadius: 6, fontSize: '0.875rem',
  background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600,
  whiteSpace: 'nowrap',
}

const cancelBtnStyle = {
  padding: '0.4rem 1rem', borderRadius: 6, fontSize: '0.875rem',
  background: '#374151', color: '#f9fafb', border: 'none', cursor: 'pointer', fontWeight: 600,
}

const pageBtnStyle = (disabled) => ({
  padding: '4px 10px', borderRadius: 6, fontSize: '0.8rem', cursor: disabled ? 'default' : 'pointer',
  border: '1px solid #374151', background: disabled ? '#1e1e2e' : '#374151',
  color: disabled ? '#4b5563' : '#f9fafb', fontWeight: 600,
})

const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }
const thStyle = { textAlign: 'left', padding: '0.5rem 0.75rem', color: '#9ca3af', fontWeight: 600, borderBottom: '1px solid #374151' }
const tdStyle = { padding: '0.6rem 0.75rem', color: '#e5e7eb', verticalAlign: 'middle' }
const mutedText = { color: '#9ca3af', fontSize: '0.875rem' }
const labelStyle = { display: 'block', color: '#9ca3af', fontSize: '0.8rem', marginBottom: 4 }

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────

const TABS = ['Overview', 'Games', 'Users', 'Reviews']

export default function AdminPage() {
  const [tab, setTab] = useState('Overview')
  const [stats, setStats] = useState({ games: 0, users: 0, reviews: 0, loading: true })

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await apiFetch(`/stats`)
        const data = await res.json()
        setStats({ games: data.games, users: data.users, reviews: data.reviews, loading: false })
      } catch {
        setStats(s => ({ ...s, loading: false }))
      }
    }
    loadStats()
  }, [])

  return (
    <>
      <Navbar />
      <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ margin: 0, color: '#f9fafb' }}>Admin Dashboard</h1>
          <p style={{ color: '#9ca3af', marginTop: 4 }}>Manage games, users, and reviews</p>
        </div>

        <StatsOverview stats={stats} />

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.25rem', borderBottom: '1px solid #374151', paddingBottom: '0' }}>
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '0.5rem 1.1rem', border: 'none', cursor: 'pointer',
                borderRadius: '6px 6px 0 0', fontWeight: 600, fontSize: '0.875rem',
                background: tab === t ? '#2563eb' : 'transparent',
                color: tab === t ? '#fff' : '#9ca3af',
                borderBottom: tab === t ? '2px solid #2563eb' : '2px solid transparent',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'Overview' && (
          <div style={cardStyle}>
            <h3 style={cardHead}>What admins can do</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <p style={{ color: '#7c3aed', fontWeight: 700, margin: '0 0 0.5rem' }}>Games</p>
                <ul style={{ color: '#d1d5db', margin: 0, paddingLeft: '1.25rem', lineHeight: 1.8 }}>
                  <li>Add new games to the catalog</li>
                  <li>Edit game titles and Steam AppIDs</li>
                  <li>Delete games from the catalog</li>
                </ul>
              </div>
              <div>
                <p style={{ color: '#2563eb', fontWeight: 700, margin: '0 0 0.5rem' }}>Users</p>
                <ul style={{ color: '#d1d5db', margin: 0, paddingLeft: '1.25rem', lineHeight: 1.8 }}>
                  <li>Create new user accounts</li>
                  <li>Edit usernames and bios</li>
                  <li>Reset user passwords</li>
                  <li>Delete standard user accounts</li>
                </ul>
              </div>
              <div>
                <p style={{ color: '#16a34a', fontWeight: 700, margin: '0 0 0.5rem' }}>Reviews</p>
                <ul style={{ color: '#d1d5db', margin: 0, paddingLeft: '1.25rem', lineHeight: 1.8 }}>
                  <li>View all reviews across all users</li>
                  <li>Delete inappropriate reviews</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        {tab === 'Games'   && <GamesTab />}
        {tab === 'Users'   && <UsersTab />}
        {tab === 'Reviews' && <ReviewsTab />}
      </div>
    </>
  )
}
