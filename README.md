# MyGameList

A full-stack game tracking and review platform built with React, Express, and MongoDB. Users can manage their game libraries, discover games from Steam, write and read reviews, and build a gaming profile.

---

## Prerequisites

- **Node.js** (v22)
- **MongoDB** (Community Edition [on path])

---

## Quick Start

### First time only

```bash
npm run setup:fresh # Install deps, create .env, seed database
```

### Every day

```bash
npm run dev:all # Start MongoDB + API server + React dev server
```

This starts MongoDB (port 27017), the API server (port 5000), and the React frontend (port 5173).

**Then open:** http://localhost:5173

---

## Test Accounts

**Seeded credentials:**

| Role       | Username   | Password   |
|------------|------------|------------|
| superuser  | superuser  | superuser  |
| admin      | admin      | admin      |
| user       | alice      | alice      |
| user       | bob        | bob        |
| user       | charlie    | charlie    |
| user       | diana      | diana      |
| user       | eve        | eve        |
| user       | frank      | frank      |
| user       | grace      | grace      |
| user       | henry      | henry      |

---

## Notes

- **macOS:** If running on macOS, turn off AirPlay temporarily. AirPlay uses port 5000 and conflicts with the API server.
- **MongoDB:** If `mongod` is not in your PATH, start MongoDB manually before running setup.
