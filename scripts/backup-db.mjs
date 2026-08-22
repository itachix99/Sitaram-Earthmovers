#!/usr/bin/env node
/**
 * Logical backup of the PostgreSQL database (via DATABASE_URL).
 *
 * Usage: node scripts/backup-db.mjs
 * Writes backups/sitaram-<timestamp>.json containing every row of every model,
 * plus a manifest with row counts. Restorable via scripts/restore-db.mjs.
 *
 * For binary/physical backups prefer pg_dump when available:
 *   pg_dump "$DATABASE_URL" --format=custom --file backups/x.dump
 */
import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';

const prisma = new PrismaClient();
const MODELS = [
  'user', 'operator', 'machine', 'jobSite', 'assignment', 'workSession',
  'fuelLog', 'maintenanceRecord', 'breakdownReport', 'expense', 'revenue',
];

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'backups');
fs.mkdirSync(OUT_DIR, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const dest = path.join(OUT_DIR, `sitaram-${stamp}.json`);

const data = {};
const counts = {};
for (const m of MODELS) {
  const rows = await prisma[m].findMany();
  data[m] = rows;
  counts[m] = rows.length;
}

fs.writeFileSync(dest, JSON.stringify({ backupAt: new Date().toISOString(), counts, tables: data }, null, 2));
console.log('Backup written:', dest);
console.log('Row counts:', Object.entries(counts).map(([k, v]) => `${k}=${v}`).join(' '));
await prisma.$disconnect();
