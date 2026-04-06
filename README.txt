================================================================
MYGAMELIST - SETUP GUIDE
================================================================

A full-stack game tracking and review platform built with React, Express,
and MongoDB. Users can manage their game libraries, discover games from Steam,
write and read reviews, and build a gaming profile.

================================================================
PREREQUISITES
================================================================

- Node.js v22
- MongoDB (Community Edition) on PATH

================================================================
QUICK START
================================================================

FIRST TIME ONLY:
  npm run setup:fresh
  Installs dependencies, creates .env file, and seeds the database.

EVERY DAY:
  npm run dev:all
  Starts MongoDB (port 27017), API server (port 5000),
  and React frontend (port 5173).

Then open your browser to: http://localhost:5173

================================================================
TEST ACCOUNTS
================================================================

The following accounts are pre-seeded and ready to use:

SUPERUSER ACCOUNT:
  Username: superuser
  Password: superuser

ADMIN ACCOUNT:
  Username: admin
  Password: admin

REGULAR USER ACCOUNTS:
  Username: alice     | Password: alice
  Username: bob       | Password: bob
  Username: charlie   | Password: charlie
  Username: diana     | Password: diana
  Username: eve       | Password: eve
  Username: frank     | Password: frank
  Username: grace     | Password: grace
  Username: henry     | Password: henry

================================================================
NOTES & TROUBLESHOOTING
================================================================

macOS Users:
  If running on macOS, turn off AirPlay temporarily.
  AirPlay uses port 5555 and may conflict with the API server.

MongoDB Not in PATH:
  If mongod is not in your system PATH, start MongoDB manually
  before running the setup script.

================================================================
