// NOTE: The entirety of this script was developed with the assistance of Claude AI to
// assist with pre-populating the DB with initial data. It can be run with node seeder.js
const { MongoClient } = require("mongodb");
const bcrypt = require("bcrypt");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const DB_NAME = "mygamelistdb";
const SALT = 10;

async function seed() {
  const client = new MongoClient(MONGO_URI);
  try {
    try {
      await client.connect();
      console.log("Connected to MongoDB");
    } catch (err) {
      console.error(`Failed to connect to MongoDB at ${MONGO_URI}:`, err);
      throw err;
    }

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

    const passwordHash = await bcrypt.hash("1234", SALT);
    const { insertedId: adminId } = await users.insertOne({
      username: "admin",
      passwordHash,
      role: "superuser",
      bio: "",
      avatarUrl: "",
      createdAt: new Date(),
    });

    const { insertedId: publisherId } = await publishers.insertOne({
      name: "Test Publisher",
    });

    const { insertedId: gameId } = await games.insertOne({
      title: "Test Game",
      publisher: publisherId,
    });

    await reviews.insertOne({
      user: adminId,
      game: gameId,
      rating: 5,
      body: "Test review body",
    });

    console.log("Database seeding completed successfully.");
  } finally {
    await client.close();
  }
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});