const express = require('express');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const dbConn = require('../db/connection');
const router = express.Router();
const { requireAdmin, requireSuperuser, requireOwnerOrAdmin, rank } = require('../middleware/roles');
const SALT = 10;

router.post('/create', requireAdmin, async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    // only superuser can create admin/superuser accounts
    const requestedRole = role || 'user';
    if (requestedRole !== 'user' && req.callerRole !== 'superuser') {
      return res.status(403).json({ error: 'Only superusers can create admin or superuser accounts' });
    }
    const users = dbConn.getDb().collection('users');
    const existing = await users.findOne({ username });
    if (existing) return res.status(409).json({ error: 'Username already taken' });
    const passwordHash = await bcrypt.hash(password, SALT);
    const result = await users.insertOne({
      username,
      passwordHash,
      role: requestedRole,
      bio: '',
      avatarUrl: '',
      createdAt: new Date(),
    });
    res.status(201).json({ message: 'User created', id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.put('/update/:id', async (req, res, next) => {
  try {
    const users = dbConn.getDb().collection('users');
    const user = await users.findOne({ _id: new ObjectId(req.params.id) });
    if (!user) return res.status(404).json({ error: 'User not found' });
    req._targetUserId = String(user._id);
    req._targetRole = user.role || 'user';
    req._targetUsername = user.username;
    next();
  } catch { return res.status(500).json({ error: 'Failed to fetch user' }); }
}, requireOwnerOrAdmin(req => req._targetUserId), async (req, res) => {
  try {
    const { username, password, role, bio, avatarUrl } = req.body;
    // admins cannot edit accounts with equal or higher rank than themselves
    if (req.callerRole === 'admin' && rank(req._targetRole) >= rank('admin')) {
      return res.status(403).json({ error: 'Admins cannot edit other admin or superuser accounts' });
    }
    // only superuser can change roles, and only to valid values
    const VALID_ROLES = ['user', 'admin', 'superuser'];
    if (role) {
      if (!VALID_ROLES.includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
      if (req.callerRole !== 'superuser') {
        return res.status(403).json({ error: 'Only superusers can change roles' });
      }
    }
    const users = dbConn.getDb().collection('users');
    // check username uniqueness if changing username
    if (username && username !== req._targetUsername) {
      const taken = await users.findOne({ username, _id: { $ne: new ObjectId(req.params.id) } });
      if (taken) return res.status(409).json({ error: 'Username already taken' });
    }
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

router.delete('/delete/:id', async (req, res, next) => {
  try {
    const users = dbConn.getDb().collection('users');
    const user = await users.findOne({ _id: new ObjectId(req.params.id) });
    if (!user) return res.status(404).json({ error: 'User not found' });
    req._targetUserId = String(user._id);
    req._targetRole = user.role || 'user';
    next();
  } catch { return res.status(500).json({ error: 'Failed to fetch user' }); }
}, requireOwnerOrAdmin(req => req._targetUserId), async (req, res) => {
  // admins cannot delete accounts with equal or higher rank
  if (req.callerRole === 'admin' && rank(req._targetRole) >= rank('admin')) {
    return res.status(403).json({ error: 'Admins cannot delete other admin or superuser accounts' });
  }
  try {
    const users = dbConn.getDb().collection('users');
    const result = await users.deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

router.get('/all', requireAdmin, async (req, res) => {
  try {
    const users = dbConn.getDb().collection('users');
    const all = await users
      .find({}, { projection: { passwordHash: 0 } })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(all);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
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