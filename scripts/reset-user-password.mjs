#!/usr/bin/env node
/**
 * Rotate a user's password (credential rotation / incident response).
 *
 * Usage:
 *   node scripts/reset-user-password.mjs <phone-or-email>                # generate a random password
 *   node scripts/reset-user-password.mjs <phone-or-email> 'new-secret'   # set a specific password
 *
 * Works against whatever DATABASE_URL points at — verify the target before
 * running (see docs/SECURITY.md).
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';

const identifier = process.argv[2];
if (!identifier) {
  console.error('Usage: node scripts/reset-user-password.mjs <phone-or-email> [new-password]');
  process.exit(1);
}

const provided = process.argv[3];
const password =
  provided ?? randomBytes(14).toString('base64url');
if (password.length < 8) {
  console.error('Refusing to set a password shorter than 8 characters.');
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  const user = await prisma.user.findFirst({
    where: { OR: [{ phone: identifier }, { email: identifier }] },
    select: { id: true, name: true, phone: true, email: true, role: true, status: true },
  });
  if (!user) {
    console.error(`No user found for "${identifier}".`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  console.log(`Password rotated for ${user.name} (${user.role}, ${user.status}) <${user.email ?? user.phone}>`);
  if (!provided) console.log(`New one-time password: ${password}`);
  console.log('\nReminder: rotate AUTH_SECRET as well to invalidate all existing JWT sessions.');
} finally {
  await prisma.$disconnect();
}
