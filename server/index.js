const express = require('express');
const dbConn = require('./db/connection');
require('dotenv').config();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'testdb';

const app = express();
app.use(express.json());

app.get('/api/ping', (req, res) => res.json({ ok: true, time: Date.now() }));

app.get('/api/items', async (req, res) => {
  try {
    const items = await dbConn.getDb().collection('items').find({}).toArray();
    res.json(items);
  } catch (err) {
    console.error('GET /api/items error:', err.message || err);
    res.status(500).json({ error: 'failed to fetch items' });
  }
});

app.post('/api/items', async (req, res) => {
  try {
    const item = req.body;
    const result = await dbConn.getDb().collection('items').insertOne(item);
    res.json({ insertedId: result.insertedId });
  } catch (err) {
    console.error('POST /api/items error:', err.message || err);
    res.status(500).json({ error: 'failed to insert item' });
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
