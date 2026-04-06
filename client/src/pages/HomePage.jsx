import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import GameSearchBar from '../components/GameSearchBar'
import { apiFetch } from '../api/apiFetch'
import './HomePage.css'

function getSteamThumb(appid) {
  return `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appid}/capsule_sm_120.jpg`
}

function RecentGameCard({ game }) {
  const thumb = game.coverImage || (game.appid ? getSteamThumb(game.appid) : null)
  return (
    <Link to={`/games/${game._id}`} className="home-game-card">
      {thumb
        ? <img src={thumb} alt={game.title} className="home-game-card-img" loading="lazy" />
        : <div className="home-game-card-img home-game-card-placeholder" />
      }
      <p className="home-game-card-title">{game.title}</p>
    </Link>
  )
}

export default function HomePage() {
  const [recent, setRecent] = useState([])

  useEffect(() => {
    apiFetch('/games/recent?limit=12')
      .then(r => r.ok ? r.json() : [])
      .then(setRecent)
      .catch(() => {})
  }, [])

  return (
    <div className="home-page">
      <Navbar />
      <main className="home-search-layout">
        <div className="home-search-center">
          <h1 className="home-search-title">MyGameList</h1>
          <p className="home-search-subtitle">
            Search for games, track your favorites, and build your library.
          </p>
          <GameSearchBar />
        </div>
      </main>

      {recent.length > 0 && (
        <section className="home-recent-section container">
          <div className="section-header">
            <h2 className="section-heading">Recently Added</h2>
          </div>
          <div className="home-game-grid">
            {recent.map(game => (
              <RecentGameCard key={game._id} game={game} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
