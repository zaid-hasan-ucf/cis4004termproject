const express = require('express');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const dbConn = require('../db/connection');
const router = express.Router();
const SALT = 10;

router.post('/create', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    const users = dbConn.getDb().collection('users');
    const existing = await users.findOne({ username });
    if (existing) return res.status(409).json({ error: 'Username already taken' });
    const passwordHash = await bcrypt.hash(password, SALT);
    const result = await users.insertOne({
      username,
      passwordHash,
      role: role || 'user',
      bio: '',
      avatarUrl: '',
      createdAt: new Date(),
    });
    res.status(201).json({ message: 'User created', id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.put('/update/:id', async (req, res) => {
  try {
    const { username, password, role, bio, avatarUrl } = req.body;
    const users = dbConn.getDb().collection('users');
    const update = {
      ...(username  && { username }),
      ...(role      && { role }),
      ...(bio       !== undefined && { bio }),
      ...(avatarUrl !== undefined && { avatarUrl }),
      updatedAt: new Date(),
    };
    if (password) update.passwordHash = await bcrypt.hash(password, SALT);
    const result = await users.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: update }
    );
    if (result.matchedCount === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.delete('/delete/:id', async (req, res) => {
  try {
    const users = dbConn.getDb().collection('users');
    const result = await users.deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

router.get('/find/:username', async (req, res) => {
  try {
    const users = dbConn.getDb().collection('users');
    const user = await users.findOne(
      { username: req.params.username },
      { projection: { passwordHash: 0 } }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to find user' });
  }
});

module.exports = router;