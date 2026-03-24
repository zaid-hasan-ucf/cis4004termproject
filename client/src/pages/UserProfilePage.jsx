import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import Navbar from '../components/Navbar'
import Button from '../components/Button'
import ReviewCard from '../components/ReviewCard'

// TODO: replace with API calls once backend is wired
const MOCK_USER = {
  username: 'player1',
  bio: 'Just a gamer who loves open-world RPGs and indie gems.',
  joinedAt: '2025-11-01',
  platforms: ['PC', 'Steam Deck', 'PlayStation 5', 'Nintendo Switch'],
  pcSpecs: {
    cpu: 'AMD Ryzen 7 5800X',
    gpu: 'NVIDIA RTX 3080',
    ram: '32 GB DDR4',
    storage: '2 TB NVMe SSD',
  },
}

const MOCK_LIBRARY = {
  playing: [
    { _id: 'l1', gameId: 'g1', gameTitle: 'Elden Ring', coverUrl: null, score: 10, hours: 120, platform: 'PC' },
    { _id: 'l2', gameId: 'g2', gameTitle: 'Hades II', coverUrl: null, score: null, hours: 22, platform: 'Steam Deck' },
  ],
  completed: [
    { _id: 'l3', gameId: 'g3', gameTitle: 'Hollow Knight', coverUrl: null, score: 9, hours: 45, platform: 'PC' },
    { _id: 'l4', gameId: 'g4', gameTitle: 'God of War', coverUrl: null, score: 10, hours: 30, platform: 'PlayStation 5' },
    { _id: 'l5', gameId: 'g5', gameTitle: 'Celeste', coverUrl: null, score: 8, hours: 12, platform: 'Nintendo Switch' },
  ],
  dropped: [
    { _id: 'l6', gameId: 'g6', gameTitle: 'Outriders', coverUrl: null, score: 4, hours: 8, platform: 'PC' },
  ],
  planned: [
    { _id: 'l7', gameId: 'g7', gameTitle: 'Baldur\'s Gate 3', coverUrl: null, score: null, hours: 0, platform: 'PC' },
    { _id: 'l8', gameId: 'g8', gameTitle: 'Lies of P', coverUrl: null, score: null, hours: 0, platform: 'PlayStation 5' },
  ],
}

const MOCK_REVIEWS = [
  {
    _id: 'r1', userId: 'u1', username: 'player1', gameTitle: 'Elden Ring', rating: 10,
    body: 'One of the greatest games ever made. The open world design is absolutely masterful.',
    createdAt: '2026-02-15',
  },
  {
    _id: 'r2', userId: 'u1', username: 'player1', gameTitle: 'Hollow Knight', rating: 9,
    body: 'Gorgeous hand-drawn art, tight controls, and a hauntingly beautiful world.',
    createdAt: '2026-01-10',
  },
]

const TABS = [
  { key: 'playing',   label: 'Playing' },
  { key: 'completed', label: 'Completed' },
  { key: 'dropped',   label: 'Dropped' },
  { key: 'planned',   label: 'Plan to Play' },
]

const ALL_PLATFORMS = [
  'PC', 'Steam Deck', 'PlayStation 5', 'PlayStation 4',
  'Xbox Series X|S', 'Xbox One', 'Nintendo Switch',
]

function getRatingClass(rating) {
  if (rating >= 8) return 'rating-great'
  if (rating >= 6) return 'rating-good'
  if (rating >= 4) return 'rating-average'
  return 'rating-poor'
}

function ProfileHeader({ profileUser, isOwn }) {
  const year = new Date(profileUser.joinedAt).getFullYear()
  return (
    <div className="card profile-header">
      <div className="avatar-large">{profileUser.username[0].toUpperCase()}</div>
      <div className="profile-info">
        <h1 className="profile-username">{profileUser.username}</h1>
        <p className="muted small">Joined {year}</p>
        <p className="profile-bio">{profileUser.bio || 'No bio yet.'}</p>
      </div>
      {isOwn && (
        <Button variant="ghost" className="profile-edit-btn">Edit Profile</Button>
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
  const total = Object.values(library).reduce((acc, arr) => acc + arr.length, 0)
  const hours = Object.values(library).flat().reduce((acc, e) => acc + (e.hours || 0), 0)
  return (
    <div className="stats-bar">
      <StatItem value={total} label="Total" />
      <StatItem value={`${hours}h`} label="Hours" />
      <StatItem value={library.playing.length}   label="Playing"   colorClass="stat-playing" />
      <StatItem value={library.completed.length} label="Completed" colorClass="stat-completed" />
      <StatItem value={library.dropped.length}   label="Dropped"   colorClass="stat-dropped" />
      <StatItem value={library.planned.length}   label="Planned"   colorClass="stat-planned" />
    </div>
  )
}

function LibraryRow({ entry, isOwn }) {
  return (
    <tr className="library-row">
      <td className="library-cover-cell">
        <div className="cover-sm" />
      </td>
      <td className="library-title">{entry.gameTitle}</td>
      <td className="library-platform">{entry.platform}</td>
      <td className="library-score">
        {entry.score != null
          ? <span className={`score-badge ${getRatingClass(entry.score)}`}>{entry.score}</span>
          : <span className="muted small">—</span>
        }
      </td>
      <td className="library-hours muted small">{entry.hours > 0 ? `${entry.hours}h` : '—'}</td>
      {isOwn && (
        <td className="library-actions">
          <button className="row-action-btn ghost-btn">Edit</button>
          <button className="row-action-btn ghost-btn danger-btn">Remove</button>
        </td>
      )}
    </tr>
  )
}

function LibrarySection({ library, isOwn }) {
  const [activeTab, setActiveTab] = useState('playing')
  const entries = library[activeTab] ?? []

  return (
    <section className="home-section">
      <div className="section-header">
        <h2 className="section-heading">Library</h2>
        {isOwn && <Button variant="ghost">+ Add Game</Button>}
      </div>

      <div className="library-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`library-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            <span className="tab-count">{library[tab.key].length}</span>
          </button>
        ))}
      </div>

      {entries.length === 0 ? (
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
                <th>Hours</th>
                {isOwn && <th />}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <LibraryRow key={entry._id} entry={entry} isOwn={isOwn} />
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
  const ownedSet = new Set(profileUser.platforms)
  const hasPC = ownedSet.has('PC')

  return (
    <section className="home-section">
      <div className="section-header">
        <h2 className="section-heading">Gaming Setup</h2>
        {isOwn && <Button variant="ghost">Edit Setup</Button>}
      </div>
      <div className="card">
        <div className="platform-pills-row">
          {ALL_PLATFORMS.map((p) => (
            <PlatformPill key={p} name={p} owned={ownedSet.has(p)} />
          ))}
        </div>

        {hasPC && profileUser.pcSpecs && (
          <div className="specs-grid">
            <div className="spec-item">
              <span className="spec-label">CPU</span>
              <span className="spec-value">{profileUser.pcSpecs.cpu}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">GPU</span>
              <span className="spec-value">{profileUser.pcSpecs.gpu}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">RAM</span>
              <span className="spec-value">{profileUser.pcSpecs.ram}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Storage</span>
              <span className="spec-value">{profileUser.pcSpecs.storage}</span>
            </div>
          </div>
        )}

        {hasPC && !profileUser.pcSpecs && isOwn && (
          <p className="muted small" style={{ marginTop: 12 }}>
            Add your PC specs to show them off.
          </p>
        )}
      </div>
    </section>
  )
}

export default function UserProfilePage() {
  const { username } = useParams()
  const { user } = useAuth()
  const isOwn = user?.username === username

  // TODO: fetch profile, library, and reviews by username from API
  const profileUser = { ...MOCK_USER, username }
  const library = MOCK_LIBRARY
  const reviews = MOCK_REVIEWS

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop: 32, paddingBottom: 48 }}>
        <ProfileHeader profileUser={profileUser} isOwn={isOwn} />
        <StatsBar library={library} />
        <LibrarySection library={library} isOwn={isOwn} />
        <ReviewsSection reviews={reviews} />
        <GamingSetup profileUser={profileUser} isOwn={isOwn} />
      </div>
    </div>
  )
}
