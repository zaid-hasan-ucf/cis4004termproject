// DISCLAIMER: Parts of this file were generated/modified using AI to simplify development due to the project's large scale. 

const express = require('express')
const { ObjectId } = require('mongodb');
const router = express.Router()
const { getDb } = require('../db/connection')
const { getSteamAppDetails } = require('../services/steamService')
const { requireAdmin } = require('../middleware/roles')

router.get('/search', async (req, res) => {
  try {
    const q = (req.query.q || '').trim().toLowerCase()

    if (q.length < 2) {
      return res.json([])
    }

    const db = getDb()
    const games = db.collection('games')

    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    const results = await games
      .find({ normalizedTitle: { $regex: escaped } })
      .project({ title: 1, appid: 1 })
      .limit(8)
      .toArray()

    return res.json(results)
  } catch (err) {
    console.error('Game search failed:', err)
    return res.status(500).json({ error: 'Failed to search games' })
  }
})

router.get('/all', async (_req, res) => {
  try {
    const games = getDb().collection('games');
    const all = await games
      .find({})
      .project({ title: 1, appid: 1, coverImage: 1, createdAt: 1 })
      .sort({ title: 1 })
      .toArray();
    res.json(all);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

router.post('/create', requireAdmin, async (req, res) => {
  try {
    const { title, coverImage, publisher, appid } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    const games = getDb().collection('games');
    const result = await games.insertOne({
      title,
      normalizedTitle: title.trim().toLowerCase(),
      coverImage: coverImage || '',
      publisher: publisher ? new ObjectId(publisher) : null,
      ...(appid && { appid: Number(appid) }),
      createdAt: new Date(),
    });
    res.status(201).json({ message: 'Game created', id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create game' });
  }
});
 
router.put('/update/:id', requireAdmin, async (req, res) => {
  try {
    const { title, coverImage, publisher, appid } = req.body;
    const games = getDb().collection('games');
    const result = await games.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: {
        ...(title      && { title, normalizedTitle: title.trim().toLowerCase() }),
        ...(coverImage && { coverImage }),
        ...(publisher  && { publisher: new ObjectId(publisher) }),
        ...(appid      && { appid: Number(appid) }),
        updatedAt: new Date(),
      }}
    );
    if (result.matchedCount === 0) return res.status(404).json({ error: 'Game not found' });
    res.json({ message: 'Game updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update game' });
  }
});
 
router.delete('/delete/:id', requireAdmin, async (req, res) => {
  try {
    const games = getDb().collection('games');
    const result = await games.deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Game not found' });
    res.json({ message: 'Game deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete game' });
  }
});

router.get('/steam-search', async (req, res) => {
  const q = (req.query.q || '').trim()
  if (q.length < 2) return res.json([])
  try {
    const steamRes = await fetch(
      `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(q)}&l=english&cc=US`
    )
    if (!steamRes.ok) return res.json([])
    const data = await steamRes.json()
    const items = (data.items || []).slice(0, 8).map(item => ({
      appid: item.id,
      title: item.name,
      tinyImage: item.tiny_image,
    }))
    res.json(items)
  } catch {
    res.json([])
  }
})

router.post('/import', async (req, res) => {
  if (!req.callerId) return res.status(401).json({ error: 'Authentication required' })
  const { appid } = req.body
  if (!appid) return res.status(400).json({ error: 'appid is required' })
  try {
    const db = getDb()
    const games = db.collection('games')

    const existing = await games.findOne({ appid: Number(appid) })
    if (existing) return res.json({ id: existing._id })

    const steamData = await getSteamAppDetails(Number(appid))
    if (!steamData) return res.status(404).json({ error: 'Game not found on Steam' })

    const steamCached = {
      detailedDescription:   steamData.detailed_description || '',
      supportedLanguages:    steamData.supported_languages || '',
      headerImage:           steamData.header_image || '',
      capsuleImage:          steamData.capsule_image || '',
      pcRequirementsMinimum: steamData.pc_requirements?.minimum || '',
      developers:            steamData.developers || [],
      publishers:            steamData.publishers || [],
      platforms: {
        windows: !!steamData.platforms?.windows,
        mac:     !!steamData.platforms?.mac,
        linux:   !!steamData.platforms?.linux,
      },
      categories: (steamData.categories || []).map(c => c.description),
      genres:     (steamData.genres     || []).map(g => g.description),
    }

    const result = await games.insertOne({
      title:           steamData.name,
      normalizedTitle: steamData.name.trim().toLowerCase(),
      coverImage:      steamData.header_image || '',
      appid:           Number(appid),
      steamCached,
      steamCachedAt:   new Date(),
      createdAt:       new Date(),
    })

    res.status(201).json({ id: result.insertedId })
  } catch (err) {
    console.error('Game import failed:', err)
    res.status(500).json({ error: 'Failed to import game' })
  }
})

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
      return res.status(500).json({ error: 'Failed to fetch game details' });
  }
});

module.exports = router