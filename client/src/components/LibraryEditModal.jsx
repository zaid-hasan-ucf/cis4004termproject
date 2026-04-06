import { useState } from 'react'
import { ALL_PLATFORMS } from '../constants'

const VALID_STATUSES = ['playing', 'completed', 'dropped', 'planned']

export default function LibraryEditModal({ entry, onSave, onClose }) {
  const [status,   setStatus]   = useState(entry.status)
  const [score,    setScore]    = useState(entry.score != null ? String(entry.score) : '')
  const [platform, setPlatform] = useState(entry.platform || '')
  const [saving,   setSaving]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    await onSave(entry._id, {
      status,
      score: score !== '' ? Number(score) : null,
      platform,
    })
    setSaving(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{entry.gameTitle}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <label className="settings-label" htmlFor="le-status">Status</label>
          <select id="le-status" className="field-input" value={status} onChange={e => setStatus(e.target.value)}>
            {VALID_STATUSES.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>

          <label className="settings-label" htmlFor="le-score" style={{ marginTop: 14 }}>Score (1–10)</label>
          <input
            id="le-score"
            className="field-input"
            type="number"
            min={1}
            max={10}
            placeholder="No score"
            value={score}
            onChange={e => setScore(e.target.value)}
          />

          <label className="settings-label" htmlFor="le-platform" style={{ marginTop: 14 }}>Platform</label>
          <select id="le-platform" className="field-input" value={platform} onChange={e => setPlatform(e.target.value)}>
            <option value="">— None —</option>
            {ALL_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          <div className="modal-actions">
            <button type="submit" className="neon-btn" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" className="ghost-btn" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
