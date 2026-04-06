import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE, apiFetch } from '../api/apiFetch'
import './GameSearchBar.css'

export default function GameSearchBar() {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [results, setResults] = useState([])
  const [steamResults, setSteamResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [open, setOpen] = useState(false)

  const navigate = useNavigate()
  const wrapperRef = useRef(null)

  const MIN_SEARCH_LENGTH = 2

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 250)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    if (debouncedQuery.length < MIN_SEARCH_LENGTH) {
      setResults([])
      setSteamResults([])
      setLoading(false)
      setOpen(false)
      return
    }

    const controller = new AbortController()

    async function fetchResults() {
      try {
        setLoading(true)

        // Fire both in parallel so Steam results appear alongside local ones
        const [localRes, steamRes] = await Promise.all([
          fetch(`${API_BASE}/games/search?q=${encodeURIComponent(debouncedQuery)}`, { signal: controller.signal }),
          fetch(`${API_BASE}/games/steam-search?q=${encodeURIComponent(debouncedQuery)}`, { signal: controller.signal }),
        ])

        const localData = localRes.ok ? await localRes.json() : []
        const steamData = steamRes.ok ? await steamRes.json() : []

        // Only show Steam results not already in the local DB
        const localAppIds = new Set(localData.map(g => g.appid))
        const newOnSteam = steamData.filter(g => !localAppIds.has(g.appid))

        setResults(localData)
        setSteamResults(newOnSteam)
        setOpen(true)
      } catch (err) {
        if (err.name !== 'AbortError') console.error(err)
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
    if (results.length > 0) {
      handleSelect(results[0])
    } else {
      setOpen(false)
    }
  }

  function handleSelect(game) {
    navigate(`/games/${game._id}`)
    setOpen(false)
    setQuery('')
    setResults([])
    setSteamResults([])
  }

  async function handleImport(appid) {
    try {
      setImporting(true)
      const res = await apiFetch('/games/import', {
        method: 'POST',
        body: JSON.stringify({ appid }),
      })
      if (!res.ok) throw new Error('Import failed')
      const data = await res.json()
      navigate(`/games/${data.id}`)
      setOpen(false)
      setQuery('')
      setResults([])
      setSteamResults([])
    } catch (err) {
      console.error('Import failed:', err)
    } finally {
      setImporting(false)
    }
  }

  function getSteamImage(appid) {
    return `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appid}/capsule_sm_120.jpg`
  }

  const hasLocal = results.length > 0
  const hasSteam = steamResults.length > 0

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
              if ((hasLocal || hasSteam) && query.trim().length >= MIN_SEARCH_LENGTH) {
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
          ) : !hasLocal && !hasSteam ? (
            <div className="search-state">No games found.</div>
          ) : (
            <>
              {hasLocal && results.map((game) => (
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
                  </div>
                </button>
              ))}

              {hasSteam && (
                <>
                  <div className="search-section-label">Not in database — import from Steam</div>
                  {importing ? (
                    <div className="search-state">Importing...</div>
                  ) : (
                    steamResults.map((game) => (
                      <button
                        key={game.appid}
                        type="button"
                        className="search-result-item"
                        onClick={() => handleImport(game.appid)}
                      >
                        <img
                          src={game.tinyImage || getSteamImage(game.appid)}
                          alt={game.title}
                          className="search-result-image"
                          loading="lazy"
                        />
                        <div className="search-result-text">
                          <div className="search-result-title">{game.title}</div>
                          <div className="search-result-subtitle">Click to add to database</div>
                        </div>
                      </button>
                    ))
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
