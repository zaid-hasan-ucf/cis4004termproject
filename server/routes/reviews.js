const express = require('express');
const { ObjectId } = require('mongodb');
const dbConn = require('../db/connection');
const router = express.Router();

router.post('/create', async (req, res) => {
  try {
    const { userId, gameId, rating, body } = req.body;
    if (!userId || !gameId || !rating || !body) {
      return res.status(400).json({ error: 'userId, gameId, rating, and body are required' });
    }
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

router.put('/update/:id', async (req, res) => {
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

router.delete('/delete/:id', async (req, res) => {
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