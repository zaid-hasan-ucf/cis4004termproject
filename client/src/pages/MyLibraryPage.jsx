import { useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import './MyLibraryPage.css'

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'playing', label: 'Playing' },
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
        <h3>{entry.title}</h3>
        <p className="muted small">{entry.platform}</p>
      </div>
      <div className="my-library-entry-meta">
        <span className={`library-status-pill status-${entry.status}`}>
          {formatStatus(entry.status)}
        </span>
        <span className="muted small">{entry.hours > 0 ? `${entry.hours}h` : '0h'}</span>
        <span className="library-score-chip">
          {entry.score != null ? `${entry.score}/10` : 'No score'}
        </span>
      </div>
      <p className="my-library-note">{entry.note}</p>
    </article>
  )
}

export default function MyLibraryPage() {
  const [activeStatus, setActiveStatus] = useState('all')
  const libraryEntries = []

  const filteredEntries = useMemo(() => {
    if (activeStatus === 'all') return libraryEntries
    return libraryEntries.filter((item) => item.status === activeStatus)
  }, [activeStatus, libraryEntries])

  const stats = useMemo(() => {
    const totalHours = libraryEntries.reduce((sum, game) => sum + game.hours, 0)
    const playing = libraryEntries.filter((game) => game.status === 'playing').length
    return {
      total: libraryEntries.length,
      totalHours,
      playing,
    }
  }, [libraryEntries])

  return (
    <div className="my-library-page">
      <Navbar />
      <main className="container my-library-main">
        <section className="my-library-hero">
          <div>
            <h1>My Library</h1>
            
          </div>
        </section>

        <section className="my-library-summary-grid">
          <SummaryCard label="Total Games" value={stats.total} />
          <SummaryCard label="Hours Tracked" value={`${stats.totalHours}h`} />
          <SummaryCard label="Currently Playing" value={stats.playing} />
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
          {filteredEntries.length > 0 ? (
            filteredEntries.map((entry) => <LibraryEntry key={entry.id} entry={entry} />)
          ) : (
            <div className="card">
              <p className="muted">No games found</p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
