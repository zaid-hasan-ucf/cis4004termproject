import Card from './Card'

export default function GameCard({ title = 'Untitled', subtitle = 'Genre • Platform', coverUrl, onClick }) {
  return (
    <Card className="game-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default', padding: '14px' }}>
      <div
        className="cover"
        style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : {}}
      />
      <div className="meta">
        <h3>{title}</h3>
        <p className="muted small">{subtitle}</p>
      </div>
    </Card>
  )
}
