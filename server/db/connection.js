const { MongoClient } = require('mongodb');

let _client = null;
let _db = null;

async function connect(uri, dbName) {
  if (_client) return _db;
  _client = new MongoClient(uri);
  await _client.connect();
  _db = _client.db(dbName);
  return _db;
}

function getDb() {
  if (!_db) throw new Error('Database not connected');
  return _db;
}

async function close() {
  if (_client) {
    await _client.close();
    _client = null;
    _db = null;
  }
}

module.exports = { connect, getDb, close };
