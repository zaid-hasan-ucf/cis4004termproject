const express = require('express');
const dbConn = require('./db/connection');
const bcrypt = require('bcrypt');
const cors = require('cors');
require('dotenv').config();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'mygamelistdb';
const SALT = 10;

const app = express();
app.use(express.json());
app.use(cors());

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const users = dbConn.getDb().collection('users');

    const existing = await users.findOne({ username });
    if (existing) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const passwordHash = await bcrypt.hash(password, SALT);
    const result = await users.insertOne({
      username,
      passwordHash,
      role: 'user',
      bio: '',
      avatarUrl: '',
      createdAt: new Date(),
    });

    res.status(201).json({ message: 'Account created' });
  } catch (err) {
    res.status(500).json({ error: 'Account creation failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const users = dbConn.getDb().collection('users');

    const user = await users.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const storedHash = user.passwordHash || user.password;
    if (!storedHash) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const match = await bcrypt.compare(password, storedHash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    res.json({
      message: 'Login successful',
      user: { id: user._id, username: user.username, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
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
  try { await dbConn.close(); } catch (e) { /* ignore */ }
  process.exit();
});
