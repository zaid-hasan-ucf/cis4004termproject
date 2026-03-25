import Navbar from '../components/Navbar'
import GameSearchBar from '../components/GameSearchBar'
import './HomePage.css'

export default function HomePage() {
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
    </div>
  )
}