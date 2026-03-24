import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import GameList from '../components/GameList'
import Button from '../components/Button'

// TODO: replace all mock data with API calls once backend is wired
const FEATURED_GAMES = [
  { _id: '1', title: 'Elden Ring', subtitle: 'Action RPG • PC, PS5' },
  { _id: '2', title: 'The Witcher 3', subtitle: 'RPG • PC, PS4' },
  { _id: '3', title: 'Hollow Knight', subtitle: 'Metroidvania • PC' },
  { _id: '4', title: 'Cyberpunk 2077', subtitle: 'RPG • PC, PS5' },
  { _id: '5', title: 'Hades', subtitle: 'Roguelike • PC, Switch' },
  { _id: '6', title: 'Dark Souls III', subtitle: 'Action RPG • PC, PS4' },
]

const NEW_RELEASES = [
  { _id: '7', title: "Dragon's Dogma 2", subtitle: 'Action RPG • PC, PS5' },
  { _id: '8', title: 'Helldivers 2', subtitle: 'Shooter • PC, PS5' },
  { _id: '9', title: 'Palworld', subtitle: 'Survival • PC, Xbox' },
  { _id: '10', title: 'FF VII Rebirth', subtitle: 'RPG • PS5' },
]

const UPCOMING_GAMES = [
  { _id: '11', title: 'GTA VI', subtitle: 'Open World • PS5, Xbox' },
  { _id: '12', title: 'Fable', subtitle: 'RPG • PC, Xbox' },
  { _id: '13', title: 'Death Stranding 2', subtitle: 'Action • PS5' },
  { _id: '14', title: 'Monster Hunter Wilds', subtitle: 'Action RPG • PC, PS5' },
]

function SectionHeader({ title, linkTo }) {
  const navigate = useNavigate()
  return (
    <div className="section-header">
      <h2 className="section-heading">{title}</h2>
      {linkTo && (
        <button className="view-all-btn" onClick={() => navigate(linkTo)}>
          View All →
        </button>
      )}
    </div>
  )
}

function HomeHero() {
  const navigate = useNavigate()
  return (
    <header className="home-hero">
      <div>
        <h1>MyGameList</h1>
        <p className="muted">Track, review, and discover your next favorite game.</p>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <Button onClick={() => navigate('/search')}>Browse Games</Button>
        <Button variant="ghost" onClick={() => navigate('/library')}>My Library</Button>
      </div>
    </header>
  )
}

export default function HomePage() {
  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop: 32, paddingBottom: 48 }}>

        <HomeHero />

        <section className="home-section">
          <SectionHeader title="Popular Games" linkTo="/search" />
          <GameList items={FEATURED_GAMES} />
        </section>

        <section className="home-section">
          <SectionHeader title="New Releases" linkTo="/search?filter=new" />
          <GameList items={NEW_RELEASES} />
        </section>

        <section className="home-section">
          <SectionHeader title="Upcoming" linkTo="/search?filter=upcoming" />
          <GameList items={UPCOMING_GAMES} />
        </section>

      </div>
    </div>
  )
}
