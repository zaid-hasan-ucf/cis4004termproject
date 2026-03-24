import { useState } from 'react'
import Button from './Button'

const RATINGS = Array.from({ length: 10 }, (_, i) => i + 1)

function getRatingLabel(rating) {
  if (rating >= 9) return 'Masterpiece'
  if (rating >= 8) return 'Great'
  if (rating >= 7) return 'Good'
  if (rating >= 6) return 'Fine'
  if (rating >= 5) return 'Average'
  if (rating >= 4) return 'Bad'
  return 'Terrible'
}

function getRatingClass(rating) {
  if (rating >= 8) return 'rating-great'
  if (rating >= 6) return 'rating-good'
  if (rating >= 4) return 'rating-average'
  return 'rating-poor'
}

function RatingSelector({ value, onChange }) {
  return (
    <div className="rating-selector">
      <div className="rating-selector-header">
        <span className="label">Score</span>
        <span className={`rating-label-text ${getRatingClass(value)}`}>
          {value}/10 — {getRatingLabel(value)}
        </span>
      </div>
      <div className="rating-btns">
        {RATINGS.map((n) => (
          <button
            key={n}
            type="button"
            className={`rating-btn ${n === value ? `active ${getRatingClass(n)}` : ''}`}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ReviewForm({
  initialRating = 7,
  initialBody = '',
  onSubmit,
  onCancel,
  loading = false,
}) {
  const [rating, setRating] = useState(initialRating)
  const [body, setBody] = useState(initialBody)

  function handleSubmit(e) {
    e.preventDefault()
    if (!body.trim()) return
    onSubmit({ rating, body: body.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className="review-form card">
      <RatingSelector value={rating} onChange={setRating} />
      <textarea
        className="review-textarea"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write your review…"
        rows={4}
      />
      <div className="actions">
        <Button type="submit" disabled={loading || !body.trim()}>
          {loading ? 'Submitting…' : 'Submit Review'}
        </Button>
        {onCancel && (
          <Button variant="ghost" type="button" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
