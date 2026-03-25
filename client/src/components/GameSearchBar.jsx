import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './GameSearchBar.css'

export default function GameSearchBar() {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const navigate = useNavigate()
  const wrapperRef = useRef(null)

  const MIN_SEARCH_LENGTH = 2

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim())
    }, 250)

    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    if (debouncedQuery.length < MIN_SEARCH_LENGTH) {
      setResults([])
      setLoading(false)
      setOpen(false)
      return
    }

    const controller = new AbortController()

    async function fetchResults() {
      try {
        setLoading(true)

        const res = await fetch(
          `http://localhost:5000/api/games/search?q=${encodeURIComponent(debouncedQuery)}`,
          { signal: controller.signal }
        )

        if (!res.ok) {
          throw new Error('Failed to fetch search results')
        }

        const data = await res.json()
        setResults(data)
        setOpen(true)
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error(err)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchResults()

    return () => controller.abort()
  }, [debouncedQuery])

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSubmit(e) {
    e.preventDefault()

    const trimmed = query.trim()
    if (trimmed.length < MIN_SEARCH_LENGTH) return

    navigate(`/search?q=${encodeURIComponent(trimmed)}`)
    setOpen(false)
  }

  function handleSelect(game) {
    navigate(`/games/${game._id}`)
    setOpen(false)
    setQuery('')
    setResults([])
  }

  function getSteamImage(appid) {
    return `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appid}/capsule_sm_120.jpg`
  }

  return (
    <div className="game-search" ref={wrapperRef}>
      <form onSubmit={handleSubmit} className="game-search-form">
        <div className={`game-search-shell ${open ? 'is-open' : ''}`}>
          <span className="game-search-icon" aria-hidden="true">⌕</span>

          <input
            type="text"
            placeholder="Search for games"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (results.length > 0 && query.trim().length >= MIN_SEARCH_LENGTH) {
                setOpen(true)
              }
            }}
            className="game-search-input"
          />
        </div>
      </form>

      {open && (
        <div className="game-search-dropdown">
          {loading ? (
            <div className="search-state">Searching...</div>
          ) : results.length > 0 ? (
            results.map((game) => (
              <button
                key={game._id}
                type="button"
                className="search-result-item"
                onClick={() => handleSelect(game)}
              >
                <img
                  src={getSteamImage(game.appid)}
                  alt={game.title}
                  className="search-result-image"
                  loading="lazy"
                />
                <div className="search-result-text">
                  <div className="search-result-title">{game.title}</div>
                  {game.subtitle && (
                    <div className="search-result-subtitle">{game.subtitle}</div>
                  )}
                </div>
              </button>
            ))
          ) : (
            <div className="search-state">No games found.</div>
          )}
        </div>
      )}
    </div>
  )
}