const express = require('express');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'testdb';

const app = express();
app.use(express.json());

let dbClient;
let db;

app.get('/api/ping', (req, res) => res.json({ ok: true, time: Date.now() }));

app.get('/api/items', async (req, res) => {
  try {
    const items = await db.collection('items').find({}).toArray();
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed to fetch items' });
  }
});

app.post('/api/items', async (req, res) => {
  try {
    const item = req.body;
    const result = await db.collection('items').insertOne(item);
    res.json({ insertedId: result.insertedId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed to insert item' });
  }
});

(async function start() {
  try {
    dbClient = new MongoClient(MONGODB_URI);
    await dbClient.connect();
    db = dbClient.db(DB_NAME);
    console.log('Connected to MongoDB', MONGODB_URI, 'DB:', DB_NAME);

    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();

process.on('SIGINT', async () => {
  if (dbClient) await dbClient.close();
  process.exit();
});
