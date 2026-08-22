#!/usr/bin/env node
/**
 * SQLite backup helper for Sitaram Earthmovers.
 *
 * Usage:   node scripts/backup-db.mjs
 * Copies prisma/dev.db to backups/dev-<timestamp>.db (keeping the last 20).
 *
 * NOTE: For a live server, prefer running while traffic is paused, or switch
 * to Postgres where pg_dump is the correct tool. See README "Production".
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'prisma', 'dev.db');
const OUT_DIR = path.join(ROOT, 'backups');
const KEEP = 20;

if (!fs.existsSync(SRC)) {
  console.error('No database found at', SRC);
  process.exit(1);
}
fs.mkdirSync(OUT_DIR, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const dest = path.join(OUT_DIR, 'dev-' + stamp + '.db');
fs.copyFileSync(SRC, dest);

const files = fs.readdirSync(OUT_DIR)
  .filter((f) => f.startsWith('dev-') && f.endsWith('.db'))
  .sort()
  .reverse();
for (const old of files.slice(KEEP)) {
  fs.unlinkSync(path.join(OUT_DIR, old));
}

console.log('Backup written:', dest);
console.log('Backups kept:', Math.min(files.length, KEEP), 'of', files.length);
