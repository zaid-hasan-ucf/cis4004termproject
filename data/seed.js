// NOTE: The entirety of this script was developed with the assistance of Claude AI to
// assist with pre-populating the DB with initial data. It can be run with node seed.js

const { MongoClient } = require("mongodb");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const DB_NAME = "mygamelistdb";

async function seed() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  console.log("Connected to MongoDB");

  const db = client.db(DB_NAME);

  const roles      = db.collection("roles");
  const publishers = db.collection("publishers");
  const games      = db.collection("games");
  const users      = db.collection("users");
  const reviews    = db.collection("reviews");

  await Promise.all([
    roles.deleteMany({}),
    publishers.deleteMany({}),
    games.deleteMany({}),
    users.deleteMany({}),
    reviews.deleteMany({}),
  ]);

  const { insertedIds } = await roles.insertMany([
    { name: "superuser" },
    { name: "administrator" },
    { name: "user" },
  ]);
  const superuserRoleId = insertedIds[0];

  const { insertedId: adminId } = await users.insertOne({
    username: "admin",
    password: "1234",
    role: superuserRoleId,
  });

  const { insertedId: publisherId } = await publishers.insertOne({
    name: "Test Publisher",
  });

  const { insertedId: gameId } = await games.insertOne({
    title: "Test Game",
    coverImage: "https://placeholder.com/test-game.jpg",
    publisher: publisherId,
  });

  await reviews.insertOne({
    user: adminId,
    game: gameId,
    rating: 5,
    body: "Test review body",
  });

  await client.close();
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});