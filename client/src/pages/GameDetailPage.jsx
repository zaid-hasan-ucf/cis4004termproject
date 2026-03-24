import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import Navbar from '../components/Navbar'
import Button from '../components/Button'
import ReviewCard from '../components/ReviewCard'
import ReviewForm from '../components/ReviewForm'

// TODO: replace with API calls once backend is wired
const MOCK_GAME = {
  _id: '1',
  title: 'Elden Ring',
  coverUrl: null,
  summary: 'A fantasy action-RPG set within a world created by Hidetaka Miyazaki and George R. R. Martin. Unravel the mysteries of the Elden Ring and become the Elden Lord.',
  releaseDate: '2022-02-25',
  developer: 'FromSoftware',
  publisher: 'Bandai Namco',
  genres: ['Action RPG', 'Open World', 'Souls-like'],
  platforms: ['PC', 'PlayStation 5', 'PlayStation 4', 'Xbox Series X|S', 'Xbox One'],
  avgRating: 9.2,
  reviewCount: 142,
}

const MOCK_REVIEWS = [
  {
    _id: 'r1', userId: 'u1', username: 'player1', rating: 10,
    body: 'One of the greatest games ever made. The open world design is absolutely masterful — every corner hides something worth discovering.',
    createdAt: '2026-02-15',
  },
  {
    _id: 'r2', userId: 'u2', username: 'gamer42', rating: 8,
    body: 'Amazing game but the difficulty might put off some players. Once it clicks though, nothing else compares.',
    createdAt: '2026-01-20',
  },
]

function GameCover({ coverUrl, title }) {
  return (
    <div className="game-cover">
      {coverUrl
        ? <img src={coverUrl} alt={title} className="game-cover-img" />
        : <div className="game-cover-placeholder" />
      }
    </div>
  )
}

function PlatformPill({ name }) {
  return <span className="platform-pill">{name}</span>
}

function GenrePill({ name }) {
  return <span className="genre-pill">{name}</span>
}

function GameHeader({ game }) {
  const year = new Date(game.releaseDate).getFullYear()
  return (
    <div className="game-detail-header card">
      <GameCover coverUrl={game.coverUrl} title={game.title} />
      <div className="game-meta">
        <h1 className="game-title">{game.title}</h1>
        <p className="game-developer muted small">
          {game.developer} · {game.publisher} · {year}
        </p>
        <div className="pill-row">
          {game.genres.map((g) => <GenrePill key={g} name={g} />)}
        </div>
        <div className="pill-row">
          {game.platforms.map((p) => <PlatformPill key={p} name={p} />)}
        </div>
        <div className="game-score-row">
          <div className="avg-score-display">
            <span className="avg-score-value">{game.avgRating}</span>
            <span className="avg-score-sub">/ 10 avg · {game.reviewCount} reviews</span>
          </div>
          <Button>+ Add to Library</Button>
        </div>
        <p className="game-summary">{game.summary}</p>
      </div>
    </div>
  )
}

function ReviewsSection({ reviews, onReviewSubmit, onDelete }) {
  const { user } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [editingReview, setEditingReview] = useState(null)

  const userReview = reviews.find((r) => r.userId === user?.id)
  const canReview = user && !userReview

  function handleEdit(review) {
    setEditingReview(review)
    setShowForm(false)
  }

  function handleSubmit(data) {
    onReviewSubmit({ ...data, editing: editingReview })
    setShowForm(false)
    setEditingReview(null)
  }

  function handleCancel() {
    setShowForm(false)
    setEditingReview(null)
  }

  return (
    <section className="home-section">
      <div className="section-header">
        <h2 className="section-heading">
          Reviews <span className="review-count">({reviews.length})</span>
        </h2>
        {canReview && !showForm && !editingReview && (
          <Button variant="ghost" onClick={() => setShowForm(true)}>
            Write a Review
          </Button>
        )}
      </div>

      {(showForm || editingReview) && (
        <ReviewForm
          initialRating={editingReview?.rating ?? 7}
          initialBody={editingReview?.body ?? ''}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}

      <div className="reviews-list">
        {reviews.length === 0 && !showForm && (
          <div className="card">
            <p className="muted">No reviews yet. Be the first to write one!</p>
          </div>
        )}
        {reviews.map((review) => (
          <ReviewCard
            key={review._id}
            review={review}
            onEdit={handleEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  )
}

export default function GameDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  // TODO: fetch game by id from API using `id`
  const game = MOCK_GAME
  const [reviews, setReviews] = useState(MOCK_REVIEWS)

  function handleReviewSubmit({ rating, body, editing }) {
    // TODO: call POST or PUT /api/reviews
    if (editing) {
      setReviews((prev) =>
        prev.map((r) => r._id === editing._id ? { ...r, rating, body } : r)
      )
    } else {
      const newReview = {
        _id: Date.now().toString(),
        userId: user?.id,
        username: user?.username ?? 'unknown',
        rating,
        body,
        createdAt: new Date().toISOString(),
      }
      setReviews((prev) => [newReview, ...prev])
    }
  }

  function handleDeleteReview(reviewId) {
    // TODO: call DELETE /api/reviews/:id
    setReviews((prev) => prev.filter((r) => r._id !== reviewId))
  }

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop: 32, paddingBottom: 48 }}>
        <GameHeader game={game} />
        <ReviewsSection
          reviews={reviews}
          onReviewSubmit={handleReviewSubmit}
          onDelete={handleDeleteReview}
        />
      </div>
    </div>
  )
}
