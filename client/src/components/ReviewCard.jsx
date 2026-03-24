import { useAuth } from '../context/useAuth'
import Button from './Button'

function getRatingClass(rating) {
  if (rating >= 8) return 'rating-great'
  if (rating >= 6) return 'rating-good'
  if (rating >= 4) return 'rating-average'
  return 'rating-poor'
}

function RatingBadge({ rating, size = 'md' }) {
  return (
    <div className={`rating-badge ${getRatingClass(rating)} ${size === 'sm' ? 'rating-badge-sm' : ''}`}>
      {rating}<span className="rating-denom">/10</span>
    </div>
  )
}

function ReviewActions({ isOwner, isAdmin, onEdit, onDelete }) {
  if (!isOwner && !isAdmin) return null
  return (
    <div className="review-actions">
      {isOwner && (
        <Button variant="ghost" onClick={onEdit}>Edit</Button>
      )}
      <Button variant="ghost" className="danger-btn" onClick={onDelete}>Delete</Button>
    </div>
  )
}

export default function ReviewCard({ review, showGame = false, onEdit, onDelete }) {
  const { user } = useAuth()
  const isOwner = user?.id === review.userId
  const isAdmin = user?.role === 'admin'

  const formattedDate = new Date(review.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })

  return (
    <div className="review-card card">
      <div className="review-header">
        <div className="review-left">
          {showGame && (
            <p className="review-game-name">{review.gameTitle}</p>
          )}
          <div className="review-author">
            <div className="avatar-placeholder avatar-sm">
              {review.username[0].toUpperCase()}
            </div>
            <span className="review-username">{review.username}</span>
            <span className="muted small">· {formattedDate}</span>
          </div>
        </div>
        <RatingBadge rating={review.rating} />
      </div>

      <p className="review-body">{review.body}</p>

      <ReviewActions
        isOwner={isOwner}
        isAdmin={isAdmin}
        onEdit={() => onEdit?.(review)}
        onDelete={() => onDelete?.(review._id)}
      />
    </div>
  )
}
