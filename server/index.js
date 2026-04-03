const express = require('express');
const path    = require('path');
const dbConn  = require('./db/connection');
const cors    = require('cors');
require('dotenv').config();

// Routes
const authRoutes    = require('./routes/auth');
const gamesRoutes   = require('./routes/games');
const reviewsRoutes = require('./routes/reviews');
const usersRoutes   = require('./routes/users');
const libraryRoutes = require('./routes/library');
const uploadRoutes  = require('./routes/upload');
const { attachCaller } = require('./middleware/roles');

const PORT        = process.env.PORT        || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME     = process.env.DB_NAME     || 'mygamelistdb';

const app = express();
app.use(express.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, '../data/uploads')));
app.use(attachCaller);

app.use('/api/auth',    authRoutes);
app.use('/api/games',   gamesRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/users',   usersRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/upload',  uploadRoutes);

app.get('/api/stats', async (_req, res) => {
  try {
    const db = dbConn.getDb();
    const [games, users, reviews] = await Promise.all([
      db.collection('games').countDocuments(),
      db.collection('users').countDocuments(),
      db.collection('reviews').countDocuments(),
    ]);
    res.json({ games, users, reviews });
  } catch {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

(async function start() {
  try {
    await dbConn.connect(MONGODB_URI, DB_NAME);
    console.log('Connected to MongoDB:', MONGODB_URI, '| DB:', DB_NAME);
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('MongoDB connection failed (server will still start):', err.message || err);
    app.listen(PORT, () => console.log(`Server running on port ${PORT} (no DB connection)`));
  }
})();

process.on('SIGINT', async () => {
  try { await dbConn.close(); } catch { /* ignore */ }
  process.exit();
});
