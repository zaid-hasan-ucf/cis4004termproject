#!/usr/bin/env node

// NOTE: The most of this script was developed with the assistance of Claude AI

const { execSync, spawn } = require('child_process');
const net  = require('net');
const fs   = require('fs');
const path = require('path');

const ROOT = __dirname;
const SEED        = process.argv.includes('--seed');
const CLEAR_PORTS = process.argv.includes('--clear-ports');

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

function killPort(port) {
  try {
    if (process.platform === 'win32') {
      const out = execSync('netstat -ano', { encoding: 'utf8', stdio: 'pipe' });
      const pids = new Set();
      for (const line of out.split('\n')) {
        if (new RegExp(`:${port}\\s`).test(line) && /LISTENING/i.test(line)) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (/^\d+$/.test(pid) && pid !== '0') pids.add(pid);
        }
      }
      if (pids.size === 0) return false;
      for (const pid of pids) {
        try { execSync(`taskkill /PID ${pid} /F`, { stdio: 'pipe' }); } catch { /* protected process */ }
      }
      return pids.size > 0;
    } else {
      const out = execSync(`lsof -ti :${port}`, { encoding: 'utf8', stdio: 'pipe' }).trim();
      if (!out) return false;
      const pids = out.split('\n').filter(Boolean);
      execSync(`kill -9 ${pids.join(' ')}`, { stdio: 'pipe' });
      return true;
    }
  } catch {
    return false;
  }
}

function isServiceUp(port, host = '127.0.0.1', timeoutMs = 1500) {
  return new Promise(resolve => {
    const sock  = net.createConnection({ port, host });
    const timer = setTimeout(() => { sock.destroy(); resolve(false); }, timeoutMs);
    sock.once('connect', () => { clearTimeout(timer); sock.destroy(); resolve(true); });
    sock.once('error',   () => { clearTimeout(timer); resolve(false); });
  });
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

async function clearPort(port, label) {
  if (!(await isPortOccupied(port))) { ok(`Port ${port}  ${label}`); return; }
  warn(`Port ${port} (${label}) is in use — killing process…`);
  killPort(port);
  await new Promise(r => setTimeout(r, 600));
  if (!(await isPortOccupied(port))) { ok(`Port ${port} freed`); return; }
  warn(`Port ${port} still held — may be a protected system service. ${label} will try to start anyway.`);
}

async function resolvePorts(envPath) {
  const env = parseEnvFile(envPath);

  // Normalise 'localhost' → '127.0.0.1' (avoids IPv6 ambiguity on macOS)
  const rawUri = (env.MONGODB_URI || 'mongodb://localhost:27017').replace('localhost', '127.0.0.1');
  if (rawUri !== env.MONGODB_URI) updateEnvKey(envPath, 'MONGODB_URI', rawUri);

  const mongoHost = (rawUri.match(/\/\/([^:/]+)/) || [])[1] || '127.0.0.1';
  const mongoPort = parseInt((rawUri.match(/:(\d+)(\/|$)/) || [])[1] || '27017', 10);
  const serverPort = parseInt(env.PORT || '5000', 10);

  await clearPort(mongoPort,  'MongoDB');
  await clearPort(serverPort, 'API server');
  await clearPort(5173,       'Vite');

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

  if (CLEAR_PORTS) {
    const envPath = path.join(ROOT, '.env');
    const env     = parseEnvFile(envPath);
    const mongoPort  = parseInt((env.MONGODB_URI || '').match(/:(\d+)/)?.[1] || '27017', 10);
    const serverPort = parseInt(env.PORT || '5000', 10);
    log('Clearing dev ports…');
    await clearPort(mongoPort,  'MongoDB');
    await clearPort(serverPort, 'API server');
    await clearPort(5173,       'Vite');
    return;
  }

  const nodeMajor = parseInt(process.versions.node.split('.')[0], 10);
  if (nodeMajor < 18) {
    fail(`Node.js 18+ required — you have ${process.versions.node}`);
    fail('Download the LTS release from https://nodejs.org');
    process.exit(1);
  }
  ok(`Node.js ${process.versions.node}`);

  const envPath      = path.join(ROOT, '.env');
  const envExample   = path.join(ROOT, '.env.example');
  const mongoCfgPath = path.join(ROOT, 'mongod.cfg');

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
  const { mongoPort, mongoHost, serverPort } = await resolvePorts(envPath);

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
