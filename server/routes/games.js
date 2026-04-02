const express = require('express')
const { ObjectId } = require('mongodb');
const router = express.Router()
const { getDb } = require('../db/connection')
const { getSteamAppDetails } = require('../services/steamService')

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

router.post('/create', async (req, res) => {
  try {
    const { title, coverImage, publisher } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    const games = getDb().collection('games');
    const result = await games.insertOne({
      title,
      normalizedTitle: title.trim().toLowerCase(),
      coverImage: coverImage || '',
      publisher: publisher ? new ObjectId(publisher) : null,
      createdAt: new Date(),
    });
    res.status(201).json({ message: 'Game created', id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create game' });
  }
});
 
router.put('/update/:id', async (req, res) => {
  try {
    const { title, coverImage, publisher } = req.body;
    const games = getDb().collection('games');
    const result = await games.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: {
        ...(title      && { title, normalizedTitle: title.trim().toLowerCase() }),
        ...(coverImage && { coverImage }),
        ...(publisher  && { publisher: new ObjectId(publisher) }),
        updatedAt: new Date(),
      }}
    );
    if (result.matchedCount === 0) return res.status(404).json({ error: 'Game not found' });
    res.json({ message: 'Game updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update game' });
  }
});
 
router.delete('/delete/:id', async (req, res) => {
  try {
    const games = getDb().collection('games');
    const result = await games.deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Game not found' });
    res.json({ message: 'Game deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete game' });
  }
});

 router.get('/:id/details', async (req, res) => {
  try {
    const db = getDb();
    const games = db.collection('games');
    const gameId = req.params.id;

    if (!ObjectId.isValid(gameId)) {
      return res.status(400).json({ error: 'Invalid game id' });
    }

    const game = await games.findOne({ _id: new ObjectId(gameId) });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Return cached data if it already exists
    if (game.steamCached) {
      return res.json({
        _id: game._id,
        title: game.title,
        appid: game.appid,
        steamCached: game.steamCached,
      });
    }

    // Otherwise fetch from Steam using the appid from Mongo
    const steamData = await getSteamAppDetails(game.appid);

    if (!steamData) {
      return res.status(404).json({ error: 'Steam details not found' });
    }

    const steamCached = {
      detailedDescription: steamData.detailed_description || '',
      supportedLanguages: steamData.supported_languages || '',
      headerImage: steamData.header_image || '',
      capsuleImage: steamData.capsule_image || '',
      pcRequirementsMinimum: steamData.pc_requirements?.minimum || '',
      developers: steamData.developers || [],
      publishers: steamData.publishers || [],
      platforms: {
        windows: !!steamData.platforms?.windows,
        mac: !!steamData.platforms?.mac,
        linux: !!steamData.platforms?.linux,
      },
      categories: (steamData.categories || []).map((c) => c.description),
      genres: (steamData.genres || []).map((g) => g.description),
    };

    await games.updateOne(
      { _id: game._id },
      {
        $set: {
          steamCached,
          steamCachedAt: new Date(),
        },
      }
    );

    return res.json({
      _id: game._id,
      title: game.title,
      appid: game.appid,
      steamCached,
    });
  } catch (err) {
      console.error('Failed to fetch game details:', err);
      return res.status(500).json({
        error: 'Failed to fetch game details',
        message: err.message,
        stack: err.stack,
      });
  }
});

module.exports = router