import React from 'react'

const mockGames = [
  { id: 'g101', title: 'Hades', genre: 'Roguelike', platform: 'PC' },
  { id: 'g102', title: 'Portal 2', genre: 'Puzzle', platform: 'PC' },
  { id: 'g103', title: 'Stardew Valley', genre: 'Simulation', platform: 'Multi-Platform' },
]

const sectionStyle = {
  border: '1px solid #d1d5db',
  borderRadius: '10px',
  padding: '1rem',
  background: '#ffffff',
}

const cardTitleStyle = {
  marginTop: 0,
  marginBottom: '0.75rem',
}

export default function AdminPage() {
  return (
    <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
      <h1 style={{ marginTop: 0 }}>Administrator Dashboard</h1>
      <p style={{ marginBottom: '1.5rem' }}>
        UI preview only. This page currently shows admin-specific capabilities and CRUD controls.
      </p>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={sectionStyle}>
          <h2 style={cardTitleStyle}>Administrator Functionalities</h2>
          <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
            <li>Create game records</li>
            <li>Read all game records</li>
            <li>Update existing game records</li>
            <li>Delete game records</li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <h2 style={cardTitleStyle}>Standard User Functionalities</h2>
          <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
            <li>Browse and search game catalog</li>
            <li>View game details</li>
            <li>Write and manage personal reviews</li>
            <li>Maintain personal profile/library data</li>
          </ul>
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={cardTitleStyle}>CRUD Controls (Admin UI)</h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem',
          }}
        >
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.9rem' }}>
            <h3 style={{ marginTop: 0 }}>Create</h3>
            <form>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <input type="text" placeholder="Game Title" />
                <input type="text" placeholder="Genre" />
                <input type="text" placeholder="Platform" />
                <button type="button">Create Game</button>
              </div>
            </form>
          </div>

          <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.9rem' }}>
            <h3 style={{ marginTop: 0 }}>Read</h3>
            <table border="1" cellPadding="8" cellSpacing="0" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Genre</th>
                  <th>Platform</th>
                </tr>
              </thead>
              <tbody>
                {mockGames.map((game) => (
                  <tr key={game.id}>
                    <td>{game.title}</td>
                    <td>{game.genre}</td>
                    <td>{game.platform}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.9rem' }}>
            <h3 style={{ marginTop: 0 }}>Update</h3>
            <form>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <select defaultValue="">
                  <option value="" disabled>Select Game</option>
                  {mockGames.map((game) => (
                    <option key={game.id} value={game.id}>{game.title}</option>
                  ))}
                </select>
                <input type="text" placeholder="Updated Title" />
                <input type="text" placeholder="Updated Genre" />
                <input type="text" placeholder="Updated Platform" />
                <button type="button">Update Game</button>
              </div>
            </form>
          </div>

          <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.9rem' }}>
            <h3 style={{ marginTop: 0 }}>Delete</h3>
            <form>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <select defaultValue="">
                  <option value="" disabled>Select Game to Delete</option>
                  {mockGames.map((game) => (
                    <option key={game.id} value={game.id}>{game.title}</option>
                  ))}
                </select>
                <button type="button" style={{ background: '#b91c1c', color: '#ffffff' }}>
                  Delete Game
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}