// DISCLAIMER: Parts of this file were generated/modified using AI to simplify development due to the project's large scale. 

import { useMemo, useState, useEffect, useCallback } from 'react'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/useAuth'
import { apiFetch } from '../api/apiFetch'
import './MyLibraryPage.css'

const STATUS_TABS = [
  { key: 'all',       label: 'All' },
  { key: 'playing',   label: 'Playing' },
  { key: 'completed', label: 'Completed' },
]

function formatStatus(status) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function SummaryCard({ label, value }) {
  return (
    <div className="library-summary-card">
      <span className="library-summary-value">{value}</span>
      <span className="library-summary-label">{label}</span>
    </div>
  )
}

function LibraryEntry({ entry }) {
  return (
    <article className="card my-library-entry">
      <div className="my-library-entry-main">
        <h3>{entry.gameTitle}</h3>
        <p className="muted small">{entry.platform}</p>
      </div>
      <div className="my-library-entry-meta">
        <span className={`library-status-pill status-${entry.status}`}>
          {formatStatus(entry.status)}
        </span>
        <span className="library-score-chip">
          {entry.score != null ? `${entry.score}/10` : 'No score'}
        </span>
      </div>
    </article>
  )
}

export default function MyLibraryPage() {
  const { user } = useAuth()
  const [activeStatus, setActiveStatus] = useState('all')
  const [libraryEntries, setLibraryEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchLibrary = useCallback(async () => {
    if (!user?.id) return
    try {
      const res = await apiFetch(`/library/user/${user.id}`)
      if (res.ok) setLibraryEntries(await res.json())
      else setError('Failed to load library.')
    } catch {
      setError('Failed to load library.')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => { fetchLibrary() }, [fetchLibrary])

  const filteredEntries = useMemo(() => {
    if (activeStatus === 'all') return libraryEntries
    return libraryEntries.filter((item) => item.status === activeStatus)
  }, [activeStatus, libraryEntries])

  const stats = useMemo(() => ({
    total:   libraryEntries.length,
    playing: libraryEntries.filter((g) => g.status === 'playing').length,
  }), [libraryEntries])

  return (
    <div className="my-library-page">
      <Navbar />
      <main className="container my-library-main">
        <section className="my-library-hero">
          <h1>My Library</h1>
        </section>

        <section className="my-library-summary-grid">
          <SummaryCard label="Total Games"        value={stats.total} />
          <SummaryCard label="Currently Playing"  value={stats.playing} />
        </section>

        <section className="my-library-filter-row">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`my-library-filter-btn ${activeStatus === tab.key ? 'active' : ''}`}
              onClick={() => setActiveStatus(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </section>

        <section className="my-library-list">
          {loading ? (
            <div className="card"><p className="muted">Loading…</p></div>
          ) : error ? (
            <div className="card"><p className="error">{error}</p></div>
          ) : filteredEntries.length > 0 ? (
            filteredEntries.map((entry) => <LibraryEntry key={entry._id} entry={entry} />)
          ) : (
            <div className="card">
              <p className="muted">No games found.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}