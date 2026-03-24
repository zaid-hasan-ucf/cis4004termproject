import { useNavigate } from 'react-router-dom'
import GameCard from './GameCard'

export default function GameList({ items = [] }) {
  const navigate = useNavigate()

  if (!items.length) {
    return (
      <div className="card" style={{ padding: 20 }}>
        <p className="muted">No games to show yet.</p>
      </div>
    )
  }

  return (
    <section className="games-grid">
      {items.map((g, i) => (
        <GameCard
          key={g._id || i}
          title={g.title}
          subtitle={g.subtitle}
          coverUrl={g.coverUrl}
          onClick={() => navigate(`/games/${g._id}`)}
        />
      ))}
    </section>
  )
}
