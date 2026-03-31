const express = require('express');
const dbConn = require('./db/connection');
const bcrypt = require('bcrypt');
const cors = require('cors');
require('dotenv').config();

//Routes
const authRoutes    = require('./routes/auth');
const gamesRoutes   = require('./routes/games');
const reviewsRoutes = require('./routes/reviews');
const usersRoutes   = require('./routes/users');

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'mygamelistdb';
const SALT = 10;

const app = express();
app.use(express.json());
app.use(cors());

app.use('/api/auth',    authRoutes);
app.use('/api/games',   gamesRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/users',   usersRoutes);

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
  try { await dbConn.close(); } catch (e) { /* ignore */ }
  process.exit();
});
