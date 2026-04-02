import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import Navbar from '../components/Navbar'
import Button from '../components/Button'
import ReviewCard from '../components/ReviewCard'
import ReviewForm from '../components/ReviewForm'

const MOCK_REVIEWS = [
  {
    _id: 'r1',
    userId: 'u1',
    username: 'player1',
    rating: 10,
    body: 'One of the greatest games ever made. The open world design is absolutely masterful — every corner hides something worth discovering.',
    createdAt: '2026-02-15',
  },
  {
    _id: 'r2',
    userId: 'u2',
    username: 'gamer42',
    rating: 8,
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

function CategoryPill({ name }) {
  return <span className="category-pill">{name}</span>
}

function formatReleaseYear(releaseDate) {
  if (!releaseDate) return '—'
  const parsed = new Date(releaseDate)
  if (Number.isNaN(parsed.getTime())) return releaseDate
  return parsed.getFullYear()
}

function mapPlatforms(platforms) {
  if (!platforms) return []
  const result = []
  if (platforms.windows) result.push('Windows')
  if (platforms.mac) result.push('Mac')
  if (platforms.linux) result.push('Linux')
  return result
}

function GameHeader({ game }) {
  const year = formatReleaseYear(game.releaseDate)

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

function GameDetailsSection({ game }) {
  return (
    <section className="home-section">
      <div className="section-header">
        <h2 className="section-heading">Game Details</h2>
      </div>

      <div className="game-extra-grid">
        <div className="card game-extra-card">
          <h3 className="game-extra-title">Categories</h3>
          <div className="pill-row">
            {game.categories.length > 0 ? (
              game.categories.map((category) => (
                <CategoryPill key={category} name={category} />
              ))
            ) : (
              <p className="muted">No category data available.</p>
            )}
          </div>
        </div>

        <div className="card game-extra-card">
          <h3 className="game-extra-title">Supported Languages</h3>
          {game.supportedLanguages ? (
            <div
              className="steam-html-content"
              dangerouslySetInnerHTML={{ __html: game.supportedLanguages }}
            />
          ) : (
            <p className="muted">No language data available.</p>
          )}
        </div>
      </div>

      <div className="card game-extra-card">
        <h3 className="game-extra-title">PC Requirements (Minimum)</h3>
        {game.pcRequirementsMinimum ? (
          <div
            className="steam-html-content"
            dangerouslySetInnerHTML={{ __html: game.pcRequirementsMinimum }}
          />
        ) : (
          <p className="muted">No PC requirement data available.</p>
        )}
      </div>

      <div className="card game-extra-card">
        <h3 className="game-extra-title">About This Game</h3>
        {game.detailedDescription ? (
          <div
            className="steam-html-content"
            dangerouslySetInnerHTML={{ __html: game.detailedDescription }}
          />
        ) : (
          <p className="muted">No detailed description available.</p>
        )}
      </div>
    </section>
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
  const [reviews, setReviews] = useState(MOCK_REVIEWS)
  const [game, setGame] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchGame() {
      try {
        setLoading(true)
        setError('')

        const response = await fetch(`http://localhost:5000/api/games/${id}/details`)

        if (!response.ok) {
          const errData = await response.json().catch(() => null)
          throw new Error(errData?.error || 'Failed to fetch game details')
        }

        const data = await response.json()
        const cached = data.steamCached || {}

        setGame({
          _id: data._id,
          title: data.title,
          coverUrl: cached.capsuleImage || cached.headerImage || null,
          summary: cached.detailedDescription
            ? ''
            : 'No summary available.',
          releaseDate: '',
          developer: cached.developers?.join(', ') || 'Unknown Developer',
          publisher: cached.publishers?.join(', ') || 'Unknown Publisher',
          genres: cached.genres || [],
          categories: cached.categories || [],
          platforms: mapPlatforms(cached.platforms),
          supportedLanguages: cached.supportedLanguages || '',
          pcRequirementsMinimum: cached.pcRequirementsMinimum || '',
          detailedDescription: cached.detailedDescription || '',
          avgRating: 9.2,
          reviewCount: reviews.length,
        })
      } catch (err) {
        console.error(err)
        setError(err.message || 'Failed to load game.')
      } finally {
        setLoading(false)
      }
    }

    fetchGame()
  }, [id, reviews.length])

  function handleReviewSubmit({ rating, body, editing }) {
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
    setReviews((prev) => prev.filter((r) => r._id !== reviewId))
  }

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="container" style={{ paddingTop: 32, paddingBottom: 48 }}>
          <div className="card">
            <p className="muted">Loading game details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !game) {
    return (
      <div>
        <Navbar />
        <div className="container" style={{ paddingTop: 32, paddingBottom: 48 }}>
          <div className="card">
            <p className="error">{error || 'Game not found.'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop: 32, paddingBottom: 48 }}>
        <GameHeader game={game} />
        <GameDetailsSection game={game} />
        <ReviewsSection
          reviews={reviews}
          onReviewSubmit={handleReviewSubmit}
          onDelete={handleDeleteReview}
        />
      </div>
    </div>
  )
}