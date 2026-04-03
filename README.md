# MyGameList

A full-stack game tracking and review app built with React, Express, and MongoDB.

---

## First-time setup

```bash
npm run setup:fresh
```

This installs all dependencies, creates `.env`, creates required directories, checks for port conflicts, starts MongoDB, seeds the database, then stops MongoDB.

> If `mongod` is not in your PATH, start MongoDB manually first (`npm run db`), then run `npm run setup:fresh`.

---

## Daily development

Start MongoDB, Client, Server all at once:

```bash
npm run dev:all
```

Or start MongoDB separately if you prefer:

```bash
# Terminal 1
npm run db

# Terminal 2
npm run dev
```

---

## Seeding / resetting the database

```bash
npm run setup:fresh   # full setup + wipe + reseed
npm run seed          # reseed only (MongoDB must be running)
```

**Seed credentials:**

| Role       | Username   | Password   |
|------------|------------|------------|
| superuser  | superuser  | superuser  |
| admin      | admin      | admin      |
| user       | alice      | alice      |
| user       | bob        | bob        |
| user       | charlie    | charlie    |
| user       | diana      | diana      |

---

## Configuration

All config lives in `.env` at the repo root (created automatically by setup):

| Variable         | Default                        | Description                  |
|------------------|--------------------------------|------------------------------|
| `MONGODB_URI`    | `mongodb://localhost:27017`    | MongoDB connection string    |
| `DB_NAME`        | `mygamelistdb`                 | Database name                |
| `PORT`           | `5555`                         | API server port              |
| `SERVER_ORIGIN`  | `http://localhost:5555`        | Used to build upload URLs    |

The client reads `client/.env`:

| Variable       | Default                        | Description        |
|----------------|--------------------------------|--------------------|
| `VITE_API_URL` | `http://localhost:5555/api`    | API base URL       |

> `npm run setup` automatically updates both files if a port conflict is detected.

---

## All scripts

| Command              | What it does                                          |
|----------------------|-------------------------------------------------------|
| `npm run setup`      | Install deps, create `.env`, create dirs, check ports |
| `npm run setup:fresh`| Setup + seed (auto-starts MongoDB if needed)          |
| `npm run seed`       | Seed database only (MongoDB must be running)          |
| `npm run db`         | Start MongoDB using `mongod.cfg`                      |
| `npm run dev`        | Start API server + Vite client                        |
| `npm run dev:all`    | Start MongoDB + API server + Vite client              |




WARNING WARNING WARNING

IF YOU ARE ON A MAC, TURN OFF AIRPLAY TEMPORARILY OTHERWISE THE BACKEND DOES NOT WORK.

WARNING WARNING WARNING