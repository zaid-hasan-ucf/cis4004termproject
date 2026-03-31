const express = require('express');
const bcrypt = require('bcrypt');
const { getDb } = require('../db/connection');
const router = express.Router();
const SALT = 10;

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    const users = getDb().collection('users');
    const existing = await users.findOne({ username });
    if (existing) return res.status(409).json({ error: 'Username already taken' });
    const passwordHash = await bcrypt.hash(password, SALT);
    await users.insertOne({
      username, passwordHash, role: 'user',
      bio: '', avatarUrl: '', createdAt: new Date(),
    });
    res.status(201).json({ message: 'Account created' });
  } catch (err) {
    res.status(500).json({ error: 'Account creation failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    const users = getDb().collection('users');
    const user = await users.findOne({ username });
    if (!user) return res.status(401).json({ error: 'Invalid username or password' });
    const storedHash = user.passwordHash || user.password;
    if (!storedHash) return res.status(401).json({ error: 'Invalid username or password' });
    const match = await bcrypt.compare(password, storedHash);
    if (!match) return res.status(401).json({ error: 'Invalid username or password' });
    res.json({
      message: 'Login successful',
      user: { id: user._id, username: user.username, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;