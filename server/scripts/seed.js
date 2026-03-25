// NOTE: The entirety of this script was developed with the assistance of Claude AI to
// assist with pre-populating the DB with initial data. It can be run with node seeder.js
const { MongoClient } = require("mongodb");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const DB_NAME = "mygamelistdb";
const SALT = 10;

const GAMES_JSON_PATH = path.join(__dirname, "games.json");

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

    const roles = db.collection("roles");
    const publishers = db.collection("publishers");
    const games = db.collection("games");
    const users = db.collection("users");
    const reviews = db.collection("reviews");

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
      name: "Imported/Seed Publisher",
    });

    const rawJson = fs.readFileSync(GAMES_JSON_PATH, "utf8");
    const parsedJson = JSON.parse(rawJson);

    if (!parsedJson.response || !Array.isArray(parsedJson.response.apps)) {
      throw new Error("Invalid JSON format: expected response.apps to be an array");
    }

    const gameDocs = parsedJson.response.apps
      .filter((app) => app && app.appid && app.name)
      .map((app) => ({
        appid: app.appid,
        title: app.name,
        normalizedTitle: app.name.trim().toLowerCase(),
        publisher: publisherId,
        last_modified: app.last_modified ?? null,
        lastModifiedDate: app.last_modified
          ? new Date(app.last_modified * 1000)
          : null,
        price_change_number: app.price_change_number ?? null,
        createdAt: new Date(),
      }));

    if (gameDocs.length > 0) {
      await games.insertMany(gameDocs);
      console.log(`Inserted ${gameDocs.length} games.`);
    } else {
      console.log("No games found in JSON.");
    }

    await games.createIndex({ appid: 1 }, { unique: true });
    await games.createIndex({ normalizedTitle: 1 });

    const firstGame = await games.findOne({});
    if (firstGame) {
      await reviews.insertOne({
        user: adminId,
        game: firstGame._id,
        rating: 5,
        body: "Seeded review body",
        createdAt: new Date(),
      });
    }

    console.log("Database seeding completed successfully.");
  } finally {
    await client.close();
  }
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});