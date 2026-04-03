#!/usr/bin/env node

// NOTE: The most of this script was developed with the assistance of Claude AI

const { execSync, spawn } = require('child_process');
const net  = require('net');
const fs   = require('fs');
const path = require('path');

const ROOT = __dirname;
const SEED = process.argv.includes('--seed');

// ── Logging helpers ───────────────────────────────────────────────────────────

function log(msg)  { console.log(`\x1b[36m▸\x1b[0m ${msg}`); }
function ok(msg)   { console.log(`\x1b[32m✔\x1b[0m ${msg}`); }
function warn(msg) { console.log(`\x1b[33m⚠\x1b[0m ${msg}`); }
function fail(msg) { console.error(`\x1b[31m✖\x1b[0m ${msg}`); }

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: 'inherit', cwd: ROOT, ...opts });
}

// ── .env file helpers ─────────────────────────────────────────────────────────

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return fs.readFileSync(filePath, 'utf8').split('\n').reduce((acc, line) => {
    const t = line.trim();
    if (!t || t.startsWith('#')) return acc;
    const eq = t.indexOf('=');
    if (eq === -1) return acc;
    acc[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
    return acc;
  }, {});
}

function updateEnvKey(filePath, key, value) {
  const content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  const re = new RegExp(`^(${key}=).*$`, 'm');
  const updated = re.test(content)
    ? content.replace(re, `$1${value}`)
    : content + (content.endsWith('\n') ? '' : '\n') + `${key}=${value}\n`;
  fs.writeFileSync(filePath, updated);
}

// ── Port utilities ────────────────────────────────────────────────────────────

function isPortOccupied(port, host = '127.0.0.1') {
  return new Promise(resolve => {
    const server = net.createServer();
    server.once('error', () => resolve(true));
    server.once('listening', () => { server.close(); resolve(false); });
    server.listen(port, host);
  });
}

function isServiceUp(port, host = '127.0.0.1', timeoutMs = 1500) {
  return new Promise(resolve => {
    const sock  = net.createConnection({ port, host });
    const timer = setTimeout(() => { sock.destroy(); resolve(false); }, timeoutMs);
    sock.once('connect', () => { clearTimeout(timer); sock.destroy(); resolve(true); });
    sock.once('error',   () => { clearTimeout(timer); resolve(false); });
  });
}

async function findFreePort(start) {
  let p = start;
  while (await isPortOccupied(p)) p++;
  return p;
}

async function waitForService(port, host, timeoutMs = 12000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isServiceUp(port, host, 800)) return true;
    await new Promise(r => setTimeout(r, 600));
  }
  return false;
}

// ── Port conflict resolution ──────────────────────────────────────────────────

async function resolvePorts(envPath, clientEnvPath, mongoCfgPath) {
  const env = parseEnvFile(envPath);

  // ── MongoDB port ──────────────────────────────────────────────────
  const mongoUri  = env.MONGODB_URI || 'mongodb://localhost:27017';
  const mongoHost = (mongoUri.match(/\/\/([^:/]+)/) || [])[1] || '127.0.0.1';
  let   mongoPort = parseInt((mongoUri.match(/:(\d+)(\/|$)/) || [])[1] || '27017', 10);

  if (await isPortOccupied(mongoPort)) {
    const alt = await findFreePort(mongoPort + 1);
    warn(`Port ${mongoPort} (MongoDB) is in use — switching to ${alt}`);

    const cfg = fs.readFileSync(mongoCfgPath, 'utf8');
    fs.writeFileSync(mongoCfgPath, cfg.replace(/^(\s*port:\s*)\d+/m, `$1${alt}`));

    const newUri = mongoUri.replace(/:(\d+)(\/|$)/, `:${alt}$2`);
    updateEnvKey(envPath, 'MONGODB_URI', newUri);

    mongoPort = alt;
    ok(`MongoDB → port ${mongoPort}`);
  } else {
    ok(`Port ${mongoPort}  MongoDB`);
  }

  // ── Server port ───────────────────────────────────────────────────
  let serverPort = parseInt(env.PORT || '5000', 10);

  if (await isPortOccupied(serverPort)) {
    const alt = await findFreePort(serverPort + 1);
    warn(`Port ${serverPort} (API server) is in use — switching to ${alt}`);
    updateEnvKey(envPath, 'PORT', String(alt));
    updateEnvKey(clientEnvPath, 'VITE_API_URL', `http://localhost:${alt}/api`);
    serverPort = alt;
    ok(`API server → port ${serverPort}`);
  } else {
    ok(`Port ${serverPort}  API server`);
  }

  const vitePort = 5173;
  if (await isPortOccupied(vitePort)) {
    warn(`Port ${vitePort} (Vite) is in use — Vite will auto-select the next free port at startup`);
  } else {
    ok(`Port ${vitePort}  Vite (client)`);
  }

  return { mongoPort, mongoHost, serverPort };
}

// ── MongoDB auto-start for seeding ────────────────────────────────────────────

function spawnMongod(cfgPath) {
  return new Promise((resolve, reject) => {
    const proc = spawn('mongod', ['--config', cfgPath], {
      cwd: ROOT,
      stdio: 'pipe', 
    });
    proc.on('error', err => {
      if (err.code === 'ENOENT') {
        reject(new Error('mongod not found in PATH. Start MongoDB manually, then run npm run setup:fresh again.'));
      } else {
        reject(err);
      }
    });

    setTimeout(() => resolve(proc), 300);
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {


  const nodeMajor = parseInt(process.versions.node.split('.')[0], 10);
  if (nodeMajor < 18) {
    fail(`Node.js 18+ required — you have ${process.versions.node}`);
    fail('Download the LTS release from https://nodejs.org');
    process.exit(1);
  }
  ok(`Node.js ${process.versions.node}`);

  const envPath       = path.join(ROOT, '.env');
  const envExample    = path.join(ROOT, '.env.example');
  const clientEnvPath = path.join(ROOT, 'client', '.env');
  const mongoCfgPath  = path.join(ROOT, 'mongod.cfg');

  if (!fs.existsSync(envPath)) {
    if (fs.existsSync(envExample)) {
      fs.copyFileSync(envExample, envPath);
      ok('Created .env from .env.example');
      warn('Review .env and update any values before running the app.');
    } else {
      warn('.env.example not found — skipping .env creation');
    }
  } else {
    ok('.env already exists');
  }

  for (const dir of [
    path.join(ROOT, 'data', 'db'),
    path.join(ROOT, 'data', 'uploads', 'avatars'),
  ]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      ok(`Created  ${path.relative(ROOT, dir)}`);
    }
  }

  console.log('');
  log('Checking ports…');
  const { mongoPort, mongoHost, serverPort } = await resolvePorts(envPath, clientEnvPath, mongoCfgPath);

  console.log('');
  log('Installing dependencies (root + server + client)…');
  try {
    run('npm install');
    ok('Dependencies up to date');
  } catch {
    fail('npm install failed — fix the errors above, then run setup again.');
    process.exit(1);
  }

  if (!SEED) {
    printDone(false, serverPort);
    return;
  }

  console.log('');
  let mongodProc = null; 
  
  const alreadyUp = await isServiceUp(mongoPort, mongoHost);
  if (alreadyUp) {
    ok('MongoDB is already running');
  } else {
    log(`MongoDB not running — starting it on port ${mongoPort}…`);
    try {
      mongodProc = await spawnMongod(mongoCfgPath);
    } catch (err) {
      fail(err.message);
      process.exit(1);
    }

    const ready = await waitForService(mongoPort, mongoHost);
    if (!ready) {
      mongodProc.kill();
      fail(`MongoDB did not become ready on port ${mongoPort} within 12 s.`);
      fail('Check that the data/db directory exists and mongod has permission to use it.');
      process.exit(1);
    }
    ok('MongoDB started');
  }

  log('Seeding database (existing data will be replaced)…');
  try {
    run('node server/scripts/seed.js');
    ok('Database seeded');
  } catch {
    if (mongodProc) mongodProc.kill();
    fail('Seeding failed — check the output above.');
    process.exit(1);
  }

  if (mongodProc) {
    mongodProc.kill();
    ok('MongoDB stopped (was started only for seeding)');
  }

  printDone(true, serverPort);
}

function printDone(seeded, serverPort = 5000) {
  console.log('');
  console.log('\x1b[32m✔ Setup complete!\x1b[0m');
  console.log('');
  if (!seeded) {
    console.log('  Seed the DB:       npm run setup:fresh   (auto-starts MongoDB if needed)');
  }
  console.log(`  API server will run on: http://localhost:${serverPort}`);
  console.log('');
  console.log('  Start MongoDB:     npm run db');
  console.log('  Start dev:         npm run dev       (MongoDB must be running)');
  console.log('  Start everything:  npm run dev:all   (MongoDB + server + client)');
  console.log('');
}

main().catch(err => { fail(err.message); process.exit(1); });
