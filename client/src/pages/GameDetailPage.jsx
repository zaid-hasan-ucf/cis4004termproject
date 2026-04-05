// DISCLAIMER: Parts of this file were generated/modified using AI to simplify development due to the project's large scale. 

import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { apiFetch } from '../api/apiFetch'
import Navbar from '../components/Navbar'
import Button from '../components/Button'
import ReviewCard from '../components/ReviewCard'
import ReviewForm from '../components/ReviewForm'

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

function Pill({ name, className }) {
  return <span className={className}>{name}</span>
}

function mapPlatforms(platforms) {
  if (!platforms) return []
  const result = []
  if (platforms.windows) result.push('Windows')
  if (platforms.mac)     result.push('Mac')
  if (platforms.linux)   result.push('Linux')
  return result
}

function GameHeader({ game, user, libraryEntryId, onAddToLibrary, onRemoveFromLibrary }) {
  const inLibrary = !!libraryEntryId
  return (
    <div className="game-detail-header card">
      <GameCover coverUrl={game.coverUrl} title={game.title} />
      <div className="game-meta">
        <h1 className="game-title">{game.title}</h1>
        <p className="game-developer muted small">
          {game.developer} · {game.publisher}
        </p>
        <div className="pill-row">
          {game.genres.map((g) => <Pill key={g} name={g} className="genre-pill" />)}
        </div>
        <div className="pill-row">
          {game.platforms.map((p) => <Pill key={p} name={p} className="platform-pill" />)}
        </div>
        <div className="game-score-row">
          <div className="avg-score-display">
            <span className="avg-score-value">{game.avgRating}</span>
            <span className="avg-score-sub">/ 10 avg · {game.reviewCount} reviews</span>
          </div>
          {user && (
            inLibrary
              ? <Button variant="ghost" onClick={onRemoveFromLibrary}>Remove from Library</Button>
              : <Button onClick={onAddToLibrary}>+ Add to Library</Button>
          )}
        </div>
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
                <Pill key={category} name={category} className="category-pill" />
              ))
            ) : (
              <p className="muted">No category data available.</p>
            )}
          </div>
        </div>
        <div className="card game-extra-card">
          <h3 className="game-extra-title">Supported Languages</h3>
          {game.supportedLanguages ? (
            <div className="steam-html-content" dangerouslySetInnerHTML={{ __html: game.supportedLanguages }} />
          ) : (
            <p className="muted">No language data available.</p>
          )}
        </div>
      </div>
      <div className="card game-extra-card">
        <h3 className="game-extra-title">PC Requirements (Minimum)</h3>
        {game.pcRequirementsMinimum ? (
          <div className="steam-html-content" dangerouslySetInnerHTML={{ __html: game.pcRequirementsMinimum }} />
        ) : (
          <p className="muted">No PC requirement data available.</p>
        )}
      </div>
      <div className="card game-extra-card">
        <h3 className="game-extra-title">About This Game</h3>
        {game.detailedDescription ? (
          <div className="steam-html-content" dangerouslySetInnerHTML={{ __html: game.detailedDescription }} />
        ) : (
          <p className="muted">No detailed description available.</p>
        )}
      </div>
    </section>
  )
}

function ReviewsSection({ reviews, onReviewSubmit, onDelete }) {
  const { user } = useAuth()
  const [showForm, setShowForm]           = useState(false)
  const [editingReview, setEditingReview] = useState(null)

  const userReview = reviews.find((r) => r.userId === user?.id)
  const canReview  = user && !userReview

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
          <ReviewCard key={review._id} review={review} onEdit={handleEdit} onDelete={onDelete} />
        ))}
      </div>
    </section>
  )
}

export default function GameDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [game, setGame]                     = useState(null)
  const [reviews, setReviews]               = useState([])
  const [libraryEntryId, setLibraryEntryId] = useState(null)
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState('')

  useEffect(() => {
    async function fetchAll() {
      try {
        setLoading(true)
        setError('')

        const requests = [
          apiFetch(`/games/${id}/details`),
          apiFetch(`/reviews/game/${id}`),
        ]
        if (user?.id) requests.push(apiFetch(`/library/user/${user.id}`))

        const [gameRes, reviewsRes, libraryRes] = await Promise.all(requests)

        if (!gameRes.ok) {
          const errData = await gameRes.json().catch(() => null)
          throw new Error(errData?.error || 'Failed to fetch game details')
        }

        const data           = await gameRes.json()
        const fetchedReviews = reviewsRes.ok ? await reviewsRes.json() : []
        setReviews(fetchedReviews)

        if (libraryRes?.ok) {
          const entries = await libraryRes.json()
          const entry = entries.find(e => e.gameId === String(data._id))
          setLibraryEntryId(entry?._id ?? null)
        }

        const cached    = data.steamCached || {}
        const avgRating = fetchedReviews.length > 0
          ? (fetchedReviews.reduce((sum, r) => sum + r.rating, 0) / fetchedReviews.length).toFixed(1)
          : '—'

        setGame({
          _id:                   data._id,
          title:                 data.title,
          coverUrl:              cached.capsuleImage || cached.headerImage || null,
          developer:             cached.developers?.join(', ') || 'Unknown Developer',
          publisher:             cached.publishers?.join(', ') || 'Unknown Publisher',
          genres:                cached.genres || [],
          categories:            cached.categories || [],
          platforms:             mapPlatforms(cached.platforms),
          supportedLanguages:    cached.supportedLanguages || '',
          pcRequirementsMinimum: cached.pcRequirementsMinimum || '',
          detailedDescription:   cached.detailedDescription || '',
          avgRating,
          reviewCount:           fetchedReviews.length,
        })
      } catch (err) {
        console.error(err)
        setError(err.message || 'Failed to load game.')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [id, user?.id])

  function recalcGame(updatedReviews) {
    const avg = updatedReviews.length > 0
      ? (updatedReviews.reduce((s, r) => s + r.rating, 0) / updatedReviews.length).toFixed(1)
      : '—'
    setGame(g => ({ ...g, avgRating: avg, reviewCount: updatedReviews.length }))
  }

  async function handleAddToLibrary() {
    const userReview = reviews.find(r => r.userId === user.id)
    const score = userReview ? userReview.rating : null
    try {
      const res = await apiFetch('/library/add', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          gameId: String(game._id),
          status: 'playing',
          platform: '',
          score,
        }),
      })
      const data = await res.json()
      if (res.ok) setLibraryEntryId(data.id)
    } catch (err) {
      console.error('Add to library failed:', err)
    }
  }

  async function handleRemoveFromLibrary() {
    try {
      const res = await apiFetch(`/library/remove/${libraryEntryId}`, { method: 'DELETE' })
      if (res.ok) setLibraryEntryId(null)
    } catch (err) {
      console.error('Remove from library failed:', err)
    }
  }

  async function handleReviewSubmit({ rating, body, editing }) {
    try {
      if (editing) {
        const res = await apiFetch(`/reviews/update/${editing._id}`, {
          method: 'PUT',
          body: JSON.stringify({ rating, body }),
        })
        if (res.ok) {
          setReviews(prev => {
            const updated = prev.map(r => r._id === editing._id ? { ...r, rating, body } : r)
            recalcGame(updated)
            if (libraryEntryId) {
              apiFetch(`/library/update/${libraryEntryId}`, {
                method: 'PUT',
                body: JSON.stringify({ score: rating }),
              })
            }
            return updated
          })
        }
      } else {
        const res = await apiFetch('/reviews/create', {
          method: 'POST',
          body: JSON.stringify({ userId: user.id, gameId: id, rating, body }),
        })
        const data = await res.json()
        if (res.ok) {
          const newReview = {
            _id:       data.id,
            userId:    user.id,
            username:  user.username,
            rating,
            body,
            createdAt: new Date().toISOString(),
          }
          setReviews(prev => {
            const updated = [newReview, ...prev]
            recalcGame(updated)
            return updated
          })
          if (libraryEntryId) {
            apiFetch(`/library/update/${libraryEntryId}`, {
              method: 'PUT',
              body: JSON.stringify({ score: rating }),
            })
          }
        }
      }
    } catch (err) {
      console.error('Review submit failed:', err)
    }
  }

  async function handleDeleteReview(reviewId) {
    try {
      const res = await apiFetch(`/reviews/delete/${reviewId}`, { method: 'DELETE' })
      if (res.ok) {
        setReviews(prev => {
          const updated = prev.filter(r => r._id !== reviewId)
          recalcGame(updated)
          return updated
        })
        if (libraryEntryId) {
          apiFetch(`/library/update/${libraryEntryId}`, {
            method: 'PUT',
            body: JSON.stringify({ score: null }),
          })
        }
      }
    } catch (err) {
      console.error('Review delete failed:', err)
    }
  }

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="container" style={{ paddingTop: 32, paddingBottom: 48 }}>
          <div className="card"><p className="muted">Loading game details...</p></div>
        </div>
      </div>
    )
  }

  if (error || !game) {
    return (
      <div>
        <Navbar />
        <div className="container" style={{ paddingTop: 32, paddingBottom: 48 }}>
          <div className="card"><p className="error">{error || 'Game not found.'}</p></div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop: 32, paddingBottom: 48 }}>
        <GameHeader
          game={game}
          user={user}
          libraryEntryId={libraryEntryId}
          onAddToLibrary={handleAddToLibrary}
          onRemoveFromLibrary={handleRemoveFromLibrary}
        />
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