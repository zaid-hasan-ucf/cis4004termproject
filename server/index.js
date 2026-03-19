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
    const { name, password } = req.body;
    if (!name || !password) {
      return res.status(400).json({ error: 'Name and password are required' });
    }

    const users = dbConn.getDb().collection('Users');

    const isExisting = await users.findOne({ name });
    if (isExisting) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT);
    const insertAccount = await users.insertOne({ name, password: hashedPassword });

    res.status(201).json({ message: 'Account created'});
  } catch (err) {
      res.status(500).json({ error: 'Account creation failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { name, password } = req.body;
    if (!name || !password) {
      return res.status(400).json({ error: 'Name and password are required' });
    }

    const users = dbConn.getDb().collection('Users');

    const user = await users.findOne({ name });
    if (!user) {
      return res.status(401).json({ error: 'Invalid name or password' });
    }

    const compare = await bcrypt.compare(password, user.password);
    if (!compare) {
      return res.status(401).json({ error: 'Invalid name or password' });
    }

    res.json({ message: 'Login successful', username: user.name });
  } catch (err) {
      res.status(500).json({ error: 'Failed to login' });
  }
});

(async function start() {
  try {
    await dbConn.connect(MONGODB_URI, DB_NAME);
    console.log('Connected to MongoDB', MONGODB_URI, 'DB:', DB_NAME);
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to connect to MongoDB (server will still start):', err.message || err);
    // start server anyway so nodemon doesn't crash; DB-related endpoints will return 500
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT} (no DB connection)`);
    });
  }
})();

process.on('SIGINT', async () => {
  try {
    await dbConn.close();
  } catch (e) {
    // ignore
  }
  process.exit();
});
