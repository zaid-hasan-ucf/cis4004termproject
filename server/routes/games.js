const express = require('express')
const router = express.Router()
const { getDb } = require('../db/connection')

router.get('/search', async (req, res) => {
  try {
    const q = (req.query.q || '').trim().toLowerCase()

    if (q.length < 2) {
      return res.json([])
    }

    const db = getDb()
    const games = db.collection('games')

    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    const startsWithResults = await games
      .find({
        normalizedTitle: { $regex: `^${escaped}` }
      })
      .project({
        title: 1,
        appid: 1
      })
      .limit(8)
      .toArray()

    return res.json(startsWithResults)
  } catch (err) {
    console.error('Game search failed:', err)
    return res.status(500).json({ error: 'Failed to search games' })
  }
})

module.exports = router