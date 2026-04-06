const express = require('express');
const { ObjectId } = require('mongodb');
const dbConn = require('../db/connection');
const router = express.Router();
const { requireOwnerOrAdmin } = require('../middleware/roles');

const VALID_STATUSES = ['playing', 'completed', 'dropped', 'planned'];

router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!ObjectId.isValid(userId)) return res.status(400).json({ error: 'Invalid user id' });
    const db = dbConn.getDb();
    const entries = await db.collection('library').aggregate([
      { $match: { user: new ObjectId(userId) } },
      { $sort: { createdAt: -1 } },
      { $lookup: { from: 'games', localField: 'game', foreignField: '_id', as: 'gameDoc' } },
      { $addFields: {
        gameTitle: { $ifNull: [{ $arrayElemAt: ['$gameDoc.title', 0] }, 'Unknown'] },
        gameId:    { $toString: { $arrayElemAt: ['$gameDoc._id', 0] } },
        coverUrl:  { $ifNull: [{ $arrayElemAt: ['$gameDoc.coverImage', 0] }, null] },
        appid:     { $arrayElemAt: ['$gameDoc.appid', 0] },
      }},
      { $project: { gameDoc: 0 } },
    ]).toArray();
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch library' });
  }
});

router.post('/add', async (req, res) => {
  if (!req.callerId) return res.status(401).json({ error: 'Authentication required' });
  try {
    const { userId, gameId, status, score, hours, platform } = req.body;
    if (!userId || !gameId || !status) {
      return res.status(400).json({ error: 'userId, gameId, and status are required' });
    }
    if (req.callerId !== userId) return res.status(403).json({ error: 'Cannot add to another user\'s library' });
    if (!ObjectId.isValid(gameId)) return res.status(400).json({ error: 'Invalid game id' });
    if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const db = dbConn.getDb();
    const existing = await db.collection('library').findOne({
      user: new ObjectId(userId),
      game: new ObjectId(gameId),
    });
    if (existing) return res.status(409).json({ error: 'Game already in library' });
    const result = await db.collection('library').insertOne({
      user:     new ObjectId(userId),
      game:     new ObjectId(gameId),
      status,
      score:    score    != null ? Number(score) : null,
      hours:    hours    != null ? Number(hours) : 0,
      platform: platform || '',
      createdAt: new Date(),
    });
    res.status(201).json({ message: 'Added to library', id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add to library' });
  }
});

router.put('/update/:id', async (req, res, next) => {
  try {
    const db = dbConn.getDb();
    const entry = await db.collection('library').findOne({ _id: new ObjectId(req.params.id) });
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    req._entryOwnerId = String(entry.user);
    next();
  } catch { return res.status(500).json({ error: 'Failed to fetch entry' }); }
}, requireOwnerOrAdmin(req => req._entryOwnerId), async (req, res) => {
  try {
    const { status, score, hours, platform } = req.body;
    if (status && !VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const result = await dbConn.getDb().collection('library').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: {
        ...(status   && { status }),
        ...(score    !== undefined && { score: score != null ? Number(score) : null }),
        ...(hours    !== undefined && { hours: Number(hours) }),
        ...(platform !== undefined && { platform }),
        updatedAt: new Date(),
      }}
    );
    if (result.matchedCount === 0) return res.status(404).json({ error: 'Entry not found' });
    res.json({ message: 'Library entry updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update library entry' });
  }
});

router.delete('/remove/:id', async (req, res, next) => {
  try {
    const db = dbConn.getDb();
    const entry = await db.collection('library').findOne({ _id: new ObjectId(req.params.id) });
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    req._entryOwnerId = String(entry.user);
    next();
  } catch { return res.status(500).json({ error: 'Failed to fetch entry' }); }
}, requireOwnerOrAdmin(req => req._entryOwnerId), async (req, res) => {
  try {
    const result = await dbConn.getDb().collection('library').deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Entry not found' });
    res.json({ message: 'Removed from library' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove from library' });
  }
});

module.exports = router;
