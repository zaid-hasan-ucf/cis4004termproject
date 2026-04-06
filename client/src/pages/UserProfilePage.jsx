// DISCLAIMER: Parts of this file were generated/modified using AI to simplify development due to the project's large scale. 

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import Navbar from '../components/Navbar'
import ReviewCard from '../components/ReviewCard'
import LibraryEditModal from '../components/LibraryEditModal'
import { apiFetch } from '../api/apiFetch'
import { ALL_PLATFORMS, DEFAULT_AVATAR } from '../constants'

function getSteamThumb(appid) {
  return `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appid}/capsule_sm_120.jpg`
}

function getRatingClass(rating) {
  if (rating >= 8) return 'rating-great'
  if (rating >= 6) return 'rating-good'
  if (rating >= 4) return 'rating-average'
  return 'rating-poor'
}

function ProfileHeader({ profileUser, isOwn }) {
  const year = new Date(profileUser.createdAt).getFullYear()
  return (
    <div className="card profile-header">
      <img
        src={profileUser.avatarUrl || DEFAULT_AVATAR}
        alt={profileUser.username}
        className="avatar-large"
        style={{ objectFit: 'cover' }}
        onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = DEFAULT_AVATAR }}
      />
      <div className="profile-info">
        <h1 className="profile-username">{profileUser.username}</h1>
        <p className="muted small">Joined {year}</p>
        <p className="profile-bio">{profileUser.bio || 'No bio yet.'}</p>
      </div>
      {isOwn && (
        <Link to="/settings" className="ghost-btn profile-edit-btn">Edit Profile</Link>
      )}
    </div>
  )
}

function StatItem({ value, label, colorClass }) {
  return (
    <div className={`stat ${colorClass ?? ''}`}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  )
}

function StatsBar({ library }) {
  return (
    <div className="stats-bar">
      <StatItem value={library.length} label="Total" />
      <StatItem value={library.filter(e => e.status === 'playing').length} label="Playing" colorClass="stat-playing" />
    </div>
  )
}

function LibraryRow({ entry, isOwn, onEdit, onRemove }) {
  const thumb = entry.coverUrl || (entry.appid ? getSteamThumb(entry.appid) : null)
  return (
    <tr className="library-row">
      <td className="library-cover-cell">
        {thumb
          ? <img src={thumb} alt={entry.gameTitle} className="cover-sm-img" loading="lazy" />
          : <div className="cover-sm" />
        }
      </td>
      <td className="library-title">{entry.gameTitle}</td>
      <td className="library-platform">{entry.platform || '—'}</td>
      <td className="library-score">
        {entry.score != null
          ? <span className={`score-badge ${getRatingClass(entry.score)}`}>{entry.score}</span>
          : <span className="muted small">—</span>
        }
      </td>
      {isOwn && (
        <td className="library-actions">
          <button className="row-action-btn ghost-btn" onClick={() => onEdit(entry)}>Edit</button>
          <button className="row-action-btn ghost-btn danger-btn" onClick={() => onRemove(entry._id)}>Remove</button>
        </td>
      )}
    </tr>
  )
}

function LibrarySection({ library, isOwn, onEdit, onRemove }) {
  return (
    <section className="home-section">
      <div className="section-header">
        <h2 className="section-heading">Library</h2>
      </div>
      {library.length === 0 ? (
        <div className="card">
          <p className="muted">Nothing here yet.</p>
        </div>
      ) : (
        <div className="library-table-wrap card">
          <table className="library-table">
            <thead>
              <tr>
                <th />
                <th>Title</th>
                <th>Platform</th>
                <th>Score</th>
                {isOwn && <th />}
              </tr>
            </thead>
            <tbody>
              {library.map((entry) => (
                <LibraryRow key={entry._id} entry={entry} isOwn={isOwn} onEdit={onEdit} onRemove={onRemove} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function ReviewsSection({ reviews }) {
  if (reviews.length === 0) return null
  return (
    <section className="home-section">
      <div className="section-header">
        <h2 className="section-heading">
          Reviews <span className="review-count">({reviews.length})</span>
        </h2>
      </div>
      <div className="reviews-list">
        {reviews.map((r) => (
          <ReviewCard key={r._id} review={r} showGame />
        ))}
      </div>
    </section>
  )
}

function PlatformPill({ name, owned }) {
  return (
    <span className={`platform-pill ${owned ? 'owned' : 'unowned'}`}>{name}</span>
  )
}

function GamingSetup({ profileUser, isOwn }) {
  const ownedSet = new Set(profileUser.platforms || [])
  const hasPC = ownedSet.has('PC')
  const specs = profileUser.pcSpecs || {}

  return (
    <section className="home-section">
      <div className="section-header">
        <h2 className="section-heading">Gaming Setup</h2>
        {isOwn && (
          <Link to="/settings" className="ghost-btn" style={{ fontSize: '0.875rem', padding: '0.4rem 0.9rem' }}>
            Edit Setup
          </Link>
        )}
      </div>
      <div className="card">
        {ownedSet.size === 0 ? (
          <p className="muted">{isOwn ? 'Add your gaming setup in Settings.' : 'No setup info yet.'}</p>
        ) : (
          <>
            <div className="platform-pills-row">
              {ALL_PLATFORMS.map((p) => (
                <PlatformPill key={p} name={p} owned={ownedSet.has(p)} />
              ))}
            </div>
            {hasPC && (specs.cpu || specs.gpu || specs.ram || specs.storage) && (
              <div className="specs-grid">
                {[
                  { label: 'CPU',     value: specs.cpu },
                  { label: 'GPU',     value: specs.gpu },
                  { label: 'RAM',     value: specs.ram },
                  { label: 'Storage', value: specs.storage },
                ].filter(s => s.value).map(({ label, value }) => (
                  <div key={label} className="spec-item">
                    <span className="spec-label">{label}</span>
                    <span className="spec-value">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}

export default function UserProfilePage() {
  const { username } = useParams()
  const { user } = useAuth()
  const isOwn = user?.username === username

  const [profileUser,  setProfileUser]  = useState(null)
  const [reviews,      setReviews]      = useState([])
  const [library,      setLibrary]      = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [editingEntry, setEditingEntry] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const r = await apiFetch(`/users/find/${username}`)
        if (!r.ok) { setError('User not found.'); setLoading(false); return }
        const userData = await r.json()
        setProfileUser(userData)

        const [rr, lr] = await Promise.all([
          apiFetch(`/reviews/user/${userData._id}`),
          apiFetch(`/library/user/${userData._id}`),
        ])
        if (rr.ok) setReviews(await rr.json())
        if (lr.ok) setLibrary(await lr.json())
      } catch {
        setError('Failed to load profile.')
      }
      setLoading(false)
    }
    load()
  }, [username])

  async function handleRemoveFromLibrary(entryId) {
    const res = await apiFetch(`/library/remove/${entryId}`, { method: 'DELETE' })
    if (res.ok) setLibrary(prev => prev.filter(e => e._id !== entryId))
  }

  async function handleUpdateLibraryEntry(entryId, fields) {
    const res = await apiFetch(`/library/update/${entryId}`, {
      method: 'PUT',
      body: JSON.stringify(fields),
    })
    if (res.ok) {
      setLibrary(prev => prev.map(e => e._id === entryId ? { ...e, ...fields } : e))
      setEditingEntry(null)
    }
  }

  if (loading) return (
    <div>
      <Navbar />
      <div className="container page-content">
        <div className="card"><p className="muted">Loading profile…</p></div>
      </div>
    </div>
  )

  if (error || !profileUser) return (
    <div>
      <Navbar />
      <div className="container page-content">
        <div className="card"><p className="error">{error || 'User not found.'}</p></div>
      </div>
    </div>
  )

  return (
    <>
      <div>
        <Navbar />
        <div className="container page-content">
          <ProfileHeader profileUser={profileUser} isOwn={isOwn} />
          <StatsBar library={library} />
          <LibrarySection library={library} isOwn={isOwn} onEdit={setEditingEntry} onRemove={handleRemoveFromLibrary} />
          <ReviewsSection reviews={reviews} />
          <GamingSetup profileUser={profileUser} isOwn={isOwn} />
        </div>
      </div>

      {editingEntry && (
        <LibraryEditModal
          entry={editingEntry}
          onSave={handleUpdateLibraryEntry}
          onClose={() => setEditingEntry(null)}
        />
      )}
    </>
  )
}