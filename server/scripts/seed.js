// NOTE: This script was developed with the assistance of Claude AI to
// assist with pre-populating the DB with initial data. Run with: node scripts/seed.js
const { MongoClient } = require("mongodb");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DB_NAME   = process.env.DB_NAME     || "mygamelistdb";
const SALT = 10;

const GAMES_JSON_PATH = path.join(__dirname, "games.json");

// Known stable Steam appids present in games.json
const KNOWN_APPIDS = {
  counterStrike:   10,
  halfLife2:      220,
  portal:         400,
  teamFortress2:  440,
  left4Dead2:     550,
  portal2:        620,
  dota2:          570,
  garrysMod:     4000,
  terraria:     105600,
  stardewValley: 413150,
  hollowKnight:  367520,
  hades:        1145360,
  undertale:     391540,
  celeste:       504230,
};

async function seed() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log("Connected to MongoDB:", MONGO_URI, "| DB:", DB_NAME);

    const db = client.db(DB_NAME);

    const publishers = db.collection("publishers");
    const games      = db.collection("games");
    const users      = db.collection("users");
    const reviews    = db.collection("reviews");
    const library    = db.collection("library");

    await Promise.all([
      publishers.deleteMany({}),
      games.deleteMany({}),
      users.deleteMany({}),
      reviews.deleteMany({}),
      library.deleteMany({}),
    ]);

    // ── Publishers ──────────────────────────────────────────────────────────
    const publisherDocs = [
      { name: "Valve", normalizedName: "valve" },
      { name: "Capcom", normalizedName: "capcom" },
      { name: "FromSoftware", normalizedName: "fromsoftware" },
      { name: "Team Cherry", normalizedName: "team cherry" },
      { name: "CelebRyth", normalizedName: "celebryth" },
      { name: "Hazelight Studios", normalizedName: "hazelight studios" },
      { name: "Supergiant Games", normalizedName: "supergiant games" },
    ].map(p => ({ ...p, createdAt: new Date() }));
    
    await publishers.insertMany(publisherDocs);
    const pubMap = {};
    for (const doc of publisherDocs) {
      const found = await publishers.findOne({ normalizedName: doc.normalizedName });
      pubMap[doc.name] = found._id;
    }
    const publisherId = pubMap["Valve"]; // Use Valve as default for seeded games

    // ── Games (from JSON) ────────────────────────────────────────────────────
    const rawJson    = fs.readFileSync(GAMES_JSON_PATH, "utf8");
    const parsedJson = JSON.parse(rawJson);

    if (!parsedJson.response || !Array.isArray(parsedJson.response.apps)) {
      throw new Error("Invalid JSON format: expected response.apps to be an array");
    }

    const gameDocs = parsedJson.response.apps
      .filter((app) => app && app.appid && app.name)
      .map((app) => ({
        appid:               app.appid,
        title:               app.name,
        normalizedTitle:     app.name.trim().toLowerCase(),
        publisher:           publisherId,
        last_modified:       app.last_modified ?? null,
        lastModifiedDate:    app.last_modified ? new Date(app.last_modified * 1000) : null,
        price_change_number: app.price_change_number ?? null,
        createdAt:           new Date(),
      }));

    if (gameDocs.length > 0) {
      await games.insertMany(gameDocs);
      console.log(`Inserted ${gameDocs.length} games.`);
    }

    await games.createIndex({ appid: 1 }, { unique: true });
    await games.createIndex({ normalizedTitle: 1 });
    await publishers.createIndex({ normalizedName: 1 }, { unique: true });
    await reviews.createIndex({ user: 1, game: 1 }, { unique: true });
    await reviews.createIndex({ game: 1 });
    await reviews.createIndex({ user: 1 });
    await library.createIndex({ user: 1, game: 1 }, { unique: true });
    await library.createIndex({ user: 1 });

    // Resolve game _ids for known appids
    const g = {};
    for (const [key, appid] of Object.entries(KNOWN_APPIDS)) {
      const doc = await games.findOne({ appid });
      if (doc) g[key] = doc._id;
    }

    const found    = Object.keys(g).length;
    const notFound = Object.keys(KNOWN_APPIDS).filter(k => !g[k]);
    console.log(`Resolved ${found}/${Object.keys(KNOWN_APPIDS).length} known games.`);
    if (notFound.length) console.log(`  Not found in games.json: ${notFound.join(", ")}`);

    // ── Users ────────────────────────────────────────────────────────────────
    const userDefs = [
      {
        username:  "superuser",
        password:  "superuser",
        role:      "superuser",
        bio:       "Platform administrator.",
        avatarUrl: "",
        platforms: [],
        pcSpecs:   null,
      },
      {
        username:  "admin",
        password:  "admin",
        role:      "admin",
        bio:       "Site moderator and content reviewer.",
        avatarUrl: "",
        platforms: ["PC"],
        pcSpecs:   { cpu: "Intel Core i7-12700K", gpu: "NVIDIA RTX 3070", ram: "16 GB DDR4", storage: "1 TB NVMe SSD" },
      },
      {
        username:  "alice",
        password:  "alice",
        role:      "user",
        bio:       "Open-world RPG enthusiast. 300+ hours in Half-Life 2 and counting.",
        avatarUrl: "",
        platforms: ["PC", "PlayStation 5"],
        pcSpecs:   { cpu: "Intel Core i9-12900K", gpu: "NVIDIA RTX 3080", ram: "32 GB DDR5", storage: "2 TB NVMe SSD" },
      },
      {
        username:  "bob",
        password:  "bob",
        role:      "user",
        bio:       "Competitive FPS player. Top 500 in multiple ranked titles.",
        avatarUrl: "",
        platforms: ["PC", "Steam Deck"],
        pcSpecs:   { cpu: "AMD Ryzen 7 5800X3D", gpu: "NVIDIA RTX 4070", ram: "16 GB DDR4", storage: "1 TB NVMe SSD" },
      },
      {
        username:  "charlie",
        password:  "charlie",
        role:      "user",
        bio:       "Casual gamer who enjoys co-op games with friends on the couch.",
        avatarUrl: "",
        platforms: ["Nintendo Switch", "PlayStation 5"],
        pcSpecs:   null,
      },
      {
        username:  "diana",
        password:  "diana",
        role:      "user",
        bio:       "Indie game enthusiast. Always looking for hidden gems.",
        avatarUrl: "",
        platforms: ["PC"],
        pcSpecs:   { cpu: "AMD Ryzen 5 5600X", gpu: "AMD RX 6700 XT", ram: "16 GB DDR4", storage: "500 GB NVMe SSD" },
      },
      {
        username:  "eve",
        password:  "eve",
        role:      "user",
        bio:       "Console gamer at heart. PlayStation loyalist since the PS2 days.",
        avatarUrl: "",
        platforms: ["PlayStation 5", "PlayStation 4", "Nintendo Switch"],
        pcSpecs:   null,
      },
      {
        username:  "frank",
        password:  "frank",
        role:      "user",
        bio:       "Action game addict. If there's a leaderboard, I'm climbing it.",
        avatarUrl: "",
        platforms: ["PC", "Xbox Series X|S"],
        pcSpecs:   { cpu: "Intel Core i7-13700K", gpu: "NVIDIA RTX 4080", ram: "32 GB DDR5", storage: "2 TB NVMe SSD" },
      },
      {
        username:  "grace",
        password:  "grace",
        role:      "user",
        bio:       "Cozy games and challenging platformers. Yes, both at once.",
        avatarUrl: "",
        platforms: ["PC", "Nintendo Switch"],
        pcSpecs:   { cpu: "AMD Ryzen 5 7600X", gpu: "NVIDIA RTX 4060", ram: "16 GB DDR5", storage: "1 TB NVMe SSD" },
      },
      {
        username:  "henry",
        password:  "henry",
        role:      "user",
        bio:       "2800 hours in Dota 2 and somehow still not good at it.",
        avatarUrl: "",
        platforms: ["PC", "Steam Deck"],
        pcSpecs:   { cpu: "AMD Ryzen 9 7900X", gpu: "NVIDIA RTX 4090", ram: "64 GB DDR5", storage: "4 TB NVMe SSD" },
      },
    ];

    const u = {};
    for (const def of userDefs) {
      const hash = await bcrypt.hash(def.password, SALT);
      const { insertedId } = await users.insertOne({
        username:     def.username,
        passwordHash: hash,
        role:         def.role,
        bio:          def.bio,
        avatarUrl:    def.avatarUrl,
        platforms:    def.platforms,
        pcSpecs:      def.pcSpecs,
        createdAt:    new Date(),
      });
      u[def.username] = insertedId;
    }
    console.log(`Inserted ${userDefs.length} users.`);

    // ── Reviews ──────────────────────────────────────────────────────────────
    const reviewDefs = [
      // ── Portal 2 ──
      { user: u.alice,   game: g.portal2, rating: 10, body: "Absolutely brilliant puzzle design. The co-op mode with a friend is an experience I'll never forget. Valve's best work." },
      { user: u.bob,     game: g.portal2, rating: 9,  body: "The writing is hilarious and the puzzles are genuinely challenging. GLaDOS is one of gaming's greatest characters." },
      { user: u.charlie, game: g.portal2, rating: 8,  body: "Played the co-op campaign with my brother and laughed the whole way through. A rare game that's genuinely fun with two people." },
      { user: u.diana,   game: g.portal2, rating: 10, body: "A masterpiece. Every puzzle feels fair yet clever. The ending gave me chills." },
      { user: u.grace,   game: g.portal2, rating: 9,  body: "The level design is elegant and the humour is genuinely funny. GLaDOS and Wheatley are iconic." },

      // ── Half-Life 2 ──
      { user: u.alice,   game: g.halfLife2, rating: 10, body: "Revolutionized first-person shooters. The physics, the atmosphere, the storytelling — it holds up to this day." },
      { user: u.charlie, game: g.halfLife2, rating: 9,  body: "Still one of the most immersive shooters ever made. The gravity gun mechanic never gets old." },
      { user: u.diana,   game: g.halfLife2, rating: 9,  body: "City 17 feels like a real place. Gordon Freeman's silence actually speaks volumes — a masterclass in environmental storytelling." },
      { user: u.henry,   game: g.halfLife2, rating: 10, body: "Set the benchmark for atmospheric storytelling in games. Twenty years later, nothing comes close." },

      // ── Team Fortress 2 ──
      { user: u.bob,     game: g.teamFortress2, rating: 8, body: "A timeless team shooter with incredible character variety. Still fun after all these years despite the bots." },
      { user: u.charlie, game: g.teamFortress2, rating: 7, body: "Great game when you get a good server. The class system is perfectly balanced for casual play." },
      { user: u.diana,   game: g.teamFortress2, rating: 6, body: "Fun in bursts but the bot problem has really damaged the casual experience. What could have been." },
      { user: u.henry,   game: g.teamFortress2, rating: 7, body: "Has been going since 2007 for a reason. The class design philosophy is a masterclass in player identity." },

      // ── Left 4 Dead 2 ──
      { user: u.alice,   game: g.left4Dead2, rating: 9, body: "The AI Director makes every campaign feel different. Playing Expert is genuinely terrifying with the right group." },
      { user: u.bob,     game: g.left4Dead2, rating: 9, body: "The best co-op zombie game ever made. The AI Director keeps every run feeling different and tense." },
      { user: u.charlie, game: g.left4Dead2, rating: 9, body: "Perfect with friends. Jump scares, teamwork, and chaos — best enjoyed with a full lobby." },
      { user: u.diana,   game: g.left4Dead2, rating: 8, body: "Incredibly replayable thanks to the dynamic difficulty. The campaign variety is great too." },
      { user: u.frank,   game: g.left4Dead2, rating: 9, body: "Still the gold standard for co-op shooters fifteen years on. The special infected design is still brilliant." },
      { user: u.henry,   game: g.left4Dead2, rating: 8, body: "Twenty rounds of Versus and I was hooked. Nothing beats coordinating a tank ambush with friends." },

      // ── Portal ──
      { user: u.alice,   game: g.portal, rating: 8, body: "A tight, inventive puzzle game. Incredible that it was originally a student project." },
      { user: u.bob,     game: g.portal, rating: 8, body: "Still impressive after all these years. Mastering momentum-based portaling feels amazing once it clicks." },
      { user: u.charlie, game: g.portal, rating: 7, body: "Short and sweet. The concept is brilliant even if the puzzles don't quite reach the sequel's heights." },
      { user: u.diana,   game: g.portal, rating: 9, body: "Short but perfectly crafted. The cake is a lie, and this game is a gem." },
      { user: u.henry,   game: g.portal, rating: 9, body: "A masterclass in teaching through play. Not a single line of traditional tutorial text." },

      // ── Counter-Strike ──
      { user: u.bob,   game: g.counterStrike, rating: 8, body: "The grandfather of tactical shooters. Simple rules, infinite depth. Nothing beats clutching a round." },
      { user: u.henry, game: g.counterStrike, rating: 9, body: "Where it all began. The map design in de_dust2 alone has influenced a generation of shooters." },
      { user: u.frank, game: g.counterStrike, rating: 7, body: "Showing its age now but the bones are still there. CS2 carried the torch but the original will always have a place." },

      // ── Dota 2 ──
      { user: u.henry, game: g.dota2, rating: 6, body: "The deepest MOBA ever made, but the learning curve is a sheer cliff. 2800+ hours and I am still learning." },
      { user: u.bob,   game: g.dota2, rating: 5, body: "Brilliant game design buried under the most hostile community in gaming. You have been warned." },
      { user: u.frank, game: g.dota2, rating: 4, body: "Tried it for a month. The depth is undeniable but I couldn't get past the community and the complexity wall." },

      // ── Garry's Mod ──
      { user: u.bob,     game: g.garrysMod, rating: 7, body: "A sandbox that's only as good as the servers you play on. Some of my best online memories came from GMod Prop Hunt." },
      { user: u.charlie, game: g.garrysMod, rating: 9, body: "Spent countless hours on Trouble in Terrorist Town with friends. Nothing quite captures that chaos." },
      { user: u.henry,   game: g.garrysMod, rating: 8, body: "The original modding sandbox. PropHunt and TTT alone justify the purchase ten times over." },

      // ── Terraria ──
      { user: u.henry, game: g.terraria, rating: 9, body: "More content than most AAA titles at a fraction of the price. The devs have been updating this for over a decade." },
      { user: u.bob,   game: g.terraria, rating: 8, body: "The 2D Minecraft but with more focus on combat and bosses. Great with friends." },
      { user: u.frank, game: g.terraria, rating: 8, body: "Deceptively deep. I went in expecting a simple sandbox and came out 90 hours later with endgame gear." },

      // ── Stardew Valley ──
      { user: u.alice, game: g.stardewValley, rating: 9,  body: "The perfect escape game. A few hundred hours in and I'm still finding new things to do on my farm." },
      { user: u.diana, game: g.stardewValley, rating: 10, body: "A one-person dev made this masterpiece. The attention to detail in every season and character is unbelievable." },
      { user: u.eve,   game: g.stardewValley, rating: 9,  body: "Started on Switch and couldn't stop. Great for short sessions or marathon farming runs on the couch." },
      { user: u.grace, game: g.stardewValley, rating: 10, body: "Endlessly relaxing and rewarding. I put it on when I need to decompress. The perfect cozy game." },

      // ── Hollow Knight ──
      { user: u.diana, game: g.hollowKnight, rating: 10, body: "The best Metroidvania I've ever played. The world building is haunting and the combat incredibly satisfying." },
      { user: u.grace, game: g.hollowKnight, rating: 9,  body: "Brutally difficult but never unfair. The lore tucked into every corner kept me exploring for hours." },
      { user: u.henry, game: g.hollowKnight, rating: 8,  body: "Fantastic atmosphere and tight controls. Some boss fights are punishing but the satisfaction is worth every death." },
      { user: u.bob,   game: g.hollowKnight, rating: 6,  body: "Beautiful game but the backtracking and lack of direction lost me after a few hours. Not for everyone." },

      // ── Hades ──
      { user: u.bob,   game: g.hades, rating: 10, body: "The roguelike that finally clicked for me. Every run feels fresh and the story progresses no matter what. Instant classic." },
      { user: u.grace, game: g.hades, rating: 9,  body: "Just one more run. The writing and voice acting elevate this above every other game in the genre." },
      { user: u.henry, game: g.hades, rating: 10, body: "As close to a perfect game as I've played in years. The combat is incredible and the narrative integration is genius." },
      { user: u.frank, game: g.hades, rating: 9,  body: "Finally a roguelike that respects your time. The progression feels meaningful and the story keeps you hooked." },

      // ── Undertale ──
      { user: u.diana, game: g.undertale, rating: 10, body: "Changed how I think about game design. The pacifist route is a genuinely moving experience I won't spoil." },
      { user: u.eve,   game: g.undertale, rating: 8,  body: "A short but unforgettable experience. The fourth-wall breaks alone are worth the price of admission." },
      { user: u.grace, game: g.undertale, rating: 9,  body: "It shouldn't work as well as it does, but it does. The soundtrack alone is worth five stars." },

      // ── Celeste ──
      { user: u.alice, game: g.celeste, rating: 8,  body: "Surprisingly emotionally resonant. The gameplay and story are beautifully intertwined in ways I didn't expect." },
      { user: u.diana, game: g.celeste, rating: 9,  body: "Tight controls, meaningful story, and brutal challenge. The B-sides pushed me to my absolute limit." },
      { user: u.grace, game: g.celeste, rating: 10, body: "A perfect platformer about climbing a mountain and overcoming self-doubt. The assist mode shows how accessibility should be done." },
    ];

    const validReviews = reviewDefs.filter(r => r.game);
    if (validReviews.length > 0) {
      await reviews.insertMany(validReviews.map(r => ({ ...r, createdAt: new Date() })));
      console.log(`Inserted ${validReviews.length} reviews.`);
    }

    // ── Library ───────────────────────────────────────────────────────────────
    const libraryDefs = [
      // ── Alice ──
      { user: u.alice, game: g.portal2,       status: "completed", score: 10,   hours: 18,  platform: "PC" },
      { user: u.alice, game: g.halfLife2,      status: "completed", score: 10,   hours: 14,  platform: "PC" },
      { user: u.alice, game: g.portal,         status: "completed", score: 8,    hours: 5,   platform: "PC" },
      { user: u.alice, game: g.left4Dead2,     status: "completed", score: 9,    hours: 22,  platform: "PC" },
      { user: u.alice, game: g.teamFortress2,  status: "dropped",   score: 6,    hours: 8,   platform: "PC" },
      { user: u.alice, game: g.stardewValley,  status: "completed", score: 9,    hours: 120, platform: "PC" },
      { user: u.alice, game: g.celeste,        status: "completed", score: 8,    hours: 15,  platform: "PC" },
      { user: u.alice, game: g.hollowKnight,   status: "playing",   score: null, hours: 8,   platform: "PC" },
      { user: u.alice, game: g.hades,          status: "planned",   score: null, hours: 0,   platform: "PC" },

      // ── Bob ──
      { user: u.bob, game: g.counterStrike,  status: "playing",   score: null, hours: 420, platform: "PC" },
      { user: u.bob, game: g.left4Dead2,     status: "completed", score: 9,    hours: 32,  platform: "PC" },
      { user: u.bob, game: g.teamFortress2,  status: "completed", score: 8,    hours: 280, platform: "PC" },
      { user: u.bob, game: g.portal2,        status: "completed", score: 9,    hours: 12,  platform: "Steam Deck" },
      { user: u.bob, game: g.dota2,          status: "dropped",   score: 5,    hours: 40,  platform: "PC" },
      { user: u.bob, game: g.hades,          status: "completed", score: 10,   hours: 45,  platform: "PC" },
      { user: u.bob, game: g.terraria,       status: "completed", score: 8,    hours: 60,  platform: "PC" },
      { user: u.bob, game: g.garrysMod,      status: "completed", score: 7,    hours: 200, platform: "PC" },
      { user: u.bob, game: g.hollowKnight,   status: "dropped",   score: 5,    hours: 4,   platform: "PC" },
      { user: u.bob, game: g.stardewValley,  status: "planned",   score: null, hours: 0,   platform: "Steam Deck" },

      // ── Charlie ──
      { user: u.charlie, game: g.left4Dead2,    status: "completed", score: 9,    hours: 45, platform: "PC" },
      { user: u.charlie, game: g.portal2,       status: "completed", score: 8,    hours: 10, platform: "PC" },
      { user: u.charlie, game: g.teamFortress2, status: "completed", score: 7,    hours: 60, platform: "PC" },
      { user: u.charlie, game: g.garrysMod,     status: "completed", score: 9,    hours: 150, platform: "PC" },
      { user: u.charlie, game: g.stardewValley, status: "playing",   score: null, hours: 30, platform: "Nintendo Switch" },
      { user: u.charlie, game: g.undertale,     status: "completed", score: 8,    hours: 8,  platform: "PC" },
      { user: u.charlie, game: g.terraria,      status: "planned",   score: null, hours: 0,  platform: "PC" },
      { user: u.charlie, game: g.halfLife2,     status: "completed", score: 9,    hours: 12, platform: "PC" },

      // ── Diana ──
      { user: u.diana, game: g.portal2,       status: "completed", score: 10,   hours: 20,  platform: "PC" },
      { user: u.diana, game: g.portal,        status: "completed", score: 9,    hours: 4,   platform: "PC" },
      { user: u.diana, game: g.left4Dead2,    status: "completed", score: 8,    hours: 18,  platform: "PC" },
      { user: u.diana, game: g.stardewValley, status: "completed", score: 10,   hours: 200, platform: "PC" },
      { user: u.diana, game: g.hollowKnight,  status: "completed", score: 10,   hours: 40,  platform: "PC" },
      { user: u.diana, game: g.celeste,       status: "completed", score: 9,    hours: 20,  platform: "PC" },
      { user: u.diana, game: g.undertale,     status: "completed", score: 10,   hours: 10,  platform: "PC" },
      { user: u.diana, game: g.hades,         status: "playing",   score: null, hours: 15,  platform: "PC" },
      { user: u.diana, game: g.halfLife2,     status: "completed", score: 9,    hours: 14,  platform: "PC" },
      { user: u.diana, game: g.garrysMod,     status: "dropped",   score: 4,    hours: 2,   platform: "PC" },

      // ── Eve ──
      { user: u.eve, game: g.stardewValley, status: "completed", score: 9,    hours: 80, platform: "Nintendo Switch" },
      { user: u.eve, game: g.undertale,     status: "completed", score: 8,    hours: 9,  platform: "PC" },
      { user: u.eve, game: g.hollowKnight,  status: "playing",   score: null, hours: 5,  platform: "PlayStation 5" },
      { user: u.eve, game: g.hades,         status: "planned",   score: null, hours: 0,  platform: "PlayStation 5" },
      { user: u.eve, game: g.left4Dead2,    status: "dropped",   score: 5,    hours: 2,  platform: "PC" },
      { user: u.eve, game: g.celeste,       status: "planned",   score: null, hours: 0,  platform: "Nintendo Switch" },

      // ── Frank ──
      { user: u.frank, game: g.counterStrike,  status: "playing",   score: null, hours: 350, platform: "PC" },
      { user: u.frank, game: g.portal2,        status: "completed", score: 10,   hours: 14,  platform: "PC" },
      { user: u.frank, game: g.terraria,       status: "completed", score: 8,    hours: 90,  platform: "PC" },
      { user: u.frank, game: g.hades,          status: "completed", score: 9,    hours: 35,  platform: "PC" },
      { user: u.frank, game: g.left4Dead2,     status: "completed", score: 9,    hours: 55,  platform: "PC" },
      { user: u.frank, game: g.dota2,          status: "dropped",   score: 4,    hours: 15,  platform: "PC" },
      { user: u.frank, game: g.garrysMod,      status: "completed", score: 7,    hours: 80,  platform: "PC" },
      { user: u.frank, game: g.hollowKnight,   status: "planned",   score: null, hours: 0,   platform: "PC" },

      // ── Grace ──
      { user: u.grace, game: g.stardewValley, status: "completed", score: 10,   hours: 300, platform: "PC" },
      { user: u.grace, game: g.hollowKnight,  status: "completed", score: 9,    hours: 45,  platform: "PC" },
      { user: u.grace, game: g.celeste,       status: "completed", score: 10,   hours: 25,  platform: "PC" },
      { user: u.grace, game: g.hades,         status: "completed", score: 9,    hours: 50,  platform: "PC" },
      { user: u.grace, game: g.undertale,     status: "completed", score: 9,    hours: 12,  platform: "PC" },
      { user: u.grace, game: g.portal2,       status: "playing",   score: null, hours: 5,   platform: "PC" },
      { user: u.grace, game: g.terraria,      status: "planned",   score: null, hours: 0,   platform: "Nintendo Switch" },
      { user: u.grace, game: g.portal,        status: "completed", score: 8,    hours: 4,   platform: "PC" },

      // ── Henry ──
      { user: u.henry, game: g.dota2,         status: "playing",   score: null, hours: 2800, platform: "PC" },
      { user: u.henry, game: g.hades,         status: "completed", score: 10,   hours: 60,   platform: "PC" },
      { user: u.henry, game: g.hollowKnight,  status: "completed", score: 8,    hours: 35,   platform: "PC" },
      { user: u.henry, game: g.terraria,      status: "completed", score: 9,    hours: 180,  platform: "PC" },
      { user: u.henry, game: g.counterStrike, status: "completed", score: 7,    hours: 800,  platform: "PC" },
      { user: u.henry, game: g.garrysMod,     status: "completed", score: 8,    hours: 120,  platform: "PC" },
      { user: u.henry, game: g.left4Dead2,    status: "completed", score: 8,    hours: 40,   platform: "PC" },
      { user: u.henry, game: g.halfLife2,     status: "completed", score: 10,   hours: 16,   platform: "PC" },
      { user: u.henry, game: g.portal,        status: "completed", score: 9,    hours: 4,    platform: "PC" },
      { user: u.henry, game: g.stardewValley, status: "dropped",   score: 5,    hours: 10,   platform: "Steam Deck" },
      { user: u.henry, game: g.celeste,       status: "planned",   score: null, hours: 0,    platform: "PC" },
    ];

    const validLibrary = libraryDefs.filter(e => e.game);
    if (validLibrary.length > 0) {
      await library.insertMany(validLibrary.map(e => ({ ...e, createdAt: new Date() })));
      console.log(`Inserted ${validLibrary.length} library entries.`);
    }

    console.log("\nSeeding complete.");
    console.log("\nCredentials:");
    for (const def of userDefs) {
      console.log(`  ${def.role.padEnd(10)} ${def.username.padEnd(10)} / ${def.password}`);
    }
  } finally {
    await client.close();
  }
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
