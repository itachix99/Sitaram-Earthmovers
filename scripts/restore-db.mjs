#!/usr/bin/env node
/**
 * Restore a logical backup produced by scripts/backup-db.mjs.
 *
 * Usage: node scripts/restore-db.mjs backups/sitaram-<timestamp>.json
 *
 * SAFETY: refuses to run unless TARGET_IS_SCRATCH=true is set — restoring
 * overwrites rows by id. Verify DATABASE_URL points where you intend.
 */
import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';

if (process.env.TARGET_IS_SCRATCH !== 'true') {
  console.error('REFUSING TO RESTORE: set TARGET_IS_SCRATCH=true after verifying DATABASE_URL points at a scratch database.');
  process.exit(1);
}

const file = process.argv[2];
if (!file || !fs.existsSync(file)) {
  console.error('Usage: node scripts/restore-db.mjs <backup.json>');
  process.exit(1);
}

const prisma = new PrismaClient();
const { tables } = JSON.parse(fs.readFileSync(file, 'utf8'));

// Child-first deletion respects FKs; insert in reverse order.
const ORDER = ['user', 'operator', 'machine', 'jobSite', 'assignment', 'workSession', 'fuelLog', 'maintenanceRecord', 'breakdownReport', 'expense', 'revenue'];

for (const m of [...ORDER].reverse()) {
  await prisma[m].deleteMany();
}
for (const m of ORDER) {
  const rows = tables[m] ?? [];
  for (const row of rows) {
    await prisma[m].create({ data: row });
  }
  console.log(`restored ${m}: ${rows.length}`);
}
console.log('Restore complete.');
await prisma.$disconnect();
