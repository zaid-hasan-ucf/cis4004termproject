const express = require('express');
const { ObjectId } = require('mongodb');
const dbConn = require('../db/connection');
const router = express.Router();
const { requireOwnerOrAdmin } = require('../middleware/roles')

router.get('/all', async (_req, res) => {
  try {
    const db = dbConn.getDb();
    const all = await db.collection('reviews').aggregate([
      { $sort: { createdAt: -1 } },
      { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userDoc' } },
      { $lookup: { from: 'games', localField: 'game', foreignField: '_id', as: 'gameDoc' } },
      { $addFields: {
        username: { $ifNull: [{ $arrayElemAt: ['$userDoc.username', 0] }, 'Unknown'] },
        gameTitle: { $ifNull: [{ $arrayElemAt: ['$gameDoc.title', 0] }, 'Unknown'] },
      }},
      { $project: { userDoc: 0, gameDoc: 0 } },
    ]).toArray();
    res.json(all);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const db = dbConn.getDb();
    const { userId } = req.params;
    if (!ObjectId.isValid(userId)) return res.status(400).json({ error: 'Invalid user id' });
    const reviews = await db.collection('reviews').aggregate([
      { $match: { user: new ObjectId(userId) } },
      { $sort: { createdAt: -1 } },
      { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userDoc' } },
      { $lookup: { from: 'games', localField: 'game', foreignField: '_id', as: 'gameDoc' } },
      { $addFields: {
        userId:    { $toString: '$user' },
        username:  { $ifNull: [{ $arrayElemAt: ['$userDoc.username', 0] }, 'Unknown'] },
        gameTitle: { $ifNull: [{ $arrayElemAt: ['$gameDoc.title', 0] }, 'Unknown'] },
      }},
      { $project: { userDoc: 0, gameDoc: 0 } },
    ]).toArray();
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user reviews' });
  }
});

router.get('/game/:gameId', async (req, res) => {
  try {
    const db = dbConn.getDb();
    const { gameId } = req.params;
    if (!ObjectId.isValid(gameId)) return res.status(400).json({ error: 'Invalid game id' });
    const reviews = await db.collection('reviews').aggregate([
      { $match: { game: new ObjectId(gameId) } },
      { $sort: { createdAt: -1 } },
      { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userDoc' } },
      { $addFields: {
        userId:   { $toString: '$user' },
        username: { $ifNull: [{ $arrayElemAt: ['$userDoc.username', 0] }, 'Unknown'] },
      }},
      { $project: { userDoc: 0 } },
    ]).toArray();
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch game reviews' });
  }
});

router.post('/create', async (req, res) => {
  if (!req.callerId) return res.status(401).json({ error: 'Authentication required' });
  try {
    const { userId, gameId, rating, body } = req.body;
    if (!userId || !gameId || !rating || !body) {
      return res.status(400).json({ error: 'userId, gameId, rating, and body are required' });
    }
    if (req.callerId !== userId) return res.status(403).json({ error: 'Cannot post a review as another user' });
    if (!ObjectId.isValid(gameId)) return res.status(400).json({ error: 'Invalid game id' });
    if (rating < 1 || rating > 10) {
      return res.status(400).json({ error: 'Rating must be between 1 and 10' });
    }
    const reviews = dbConn.getDb().collection('reviews');
    const existing = await reviews.findOne({
      user: new ObjectId(userId),
      game: new ObjectId(gameId),
    });
    if (existing) return res.status(409).json({ error: 'You have already reviewed this game' });
    const result = await reviews.insertOne({
      user: new ObjectId(userId),
      game: new ObjectId(gameId),
      rating: Number(rating),
      body,
      createdAt: new Date(),
    });
    res.status(201).json({ message: 'Review created', id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create review' });
  }
});

router.put('/update/:id', async (req, res, next) => {
  try {
    const reviews = dbConn.getDb().collection('reviews');
    const review = await reviews.findOne({ _id: new ObjectId(req.params.id) });
    if (!review) return res.status(404).json({ error: 'Review not found' });
    req._reviewOwnerId = String(review.user);
    next();
  } catch { return res.status(500).json({ error: 'Failed to fetch review' }); }
}, requireOwnerOrAdmin(req => req._reviewOwnerId), async (req, res) => {
  try {
    const { rating, body } = req.body;
    if (rating && (rating < 1 || rating > 10)) {
      return res.status(400).json({ error: 'Rating must be between 1 and 10' });
    }
    const reviews = dbConn.getDb().collection('reviews');
    const result = await reviews.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: {
        ...(rating && { rating: Number(rating) }),
        ...(body   && { body }),
        updatedAt: new Date(),
      }}
    );
    if (result.matchedCount === 0) return res.status(404).json({ error: 'Review not found' });
    res.json({ message: 'Review updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update review' });
  }
});

router.delete('/delete/:id', async (req, res, next) => {
  try {
    const reviews = dbConn.getDb().collection('reviews');
    const review = await reviews.findOne({ _id: new ObjectId(req.params.id) });
    if (!review) return res.status(404).json({ error: 'Review not found' });
    req._reviewOwnerId = String(review.user);
    next();
  } catch { return res.status(500).json({ error: 'Failed to fetch review' }); }
}, requireOwnerOrAdmin(req => req._reviewOwnerId), async (req, res) => {
  try {
    const reviews = dbConn.getDb().collection('reviews');
    const result = await reviews.deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Review not found' });
    res.json({ message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

module.exports = router;