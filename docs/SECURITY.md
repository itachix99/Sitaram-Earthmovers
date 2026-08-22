# Security Runbook

Procedures for credential hygiene, secret rotation, and database safety. Read this before any production deployment.

## 1. Context: exposed demo credentials

Git history (commits before `1862c72`) contained predictable privileged credentials:

- `owner@sitaram.co.in / owner123` (OWNER)
- `admin@sitaram.co.in / admin123` (ADMIN)
- `+919876543210 / operator123` (OPERATOR)

The login page also displayed and auto-filled them. As of the Phase 0 fix:

- The login page no longer shows or fills any credentials.
- `prisma/seed.mjs` refuses to run in production and requires an explicit
  `SEED_DEMO_DATA=true` opt-in; seeded accounts get **random** passwords printed once.
- Never set `SEED_DEMO_DATA` in production hosting environment variables.

## 2. Pre-deployment checklist

1. **Confirm the production database was never seeded with demo data.**
   ```sql
   SELECT phone, email, role, status FROM "User" WHERE phone LIKE '+9190000000%' OR passwordHash IS NOT NULL AND role IN ('OWNER','ADMIN');
   ```
   Any `+91900000000x` account in production means it was seeded — treat those accounts as compromised.

2. **Take a verified backup and test a restore** (see §5) before migrations.

3. **Rotate secrets** (see §3) if demo credentials were ever valid against this database.

## 3. Secret & credential rotation

### AUTH_SECRET (invalidates all sessions immediately)

JWT sessions are signed with `AUTH_SECRET`. Rotating it instantly invalidates every existing session (all users must log in again).

1. Generate: `openssl rand -base64 32`
2. Update `AUTH_SECRET` in the hosting provider's environment (e.g. Neon/Vercel dashboard or deployment platform).
3. Redeploy/restart the app.

Do this if there is any chance the old value leaked (it should never be committed).

### User passwords

```bash
# Random one-time password (printed to terminal):
node scripts/reset-user-password.mjs owner@sitaram.co.in

# Specific password:
node scripts/reset-user-password.mjs +919876543210 'correct-horse-battery'
```

Rotate at minimum every OWNER/ADMIN/OPERATOR account that ever used a demo password. Verify the script targets the intended database via `DATABASE_URL` first (`echo $DATABASE_URL` — check host).

### Deactivating a user instead of rotating

Set status to `INACTIVE` from the admin Operators screen. Until server-side session revalidation ships (Phase 1), also rotate `AUTH_SECRET` to cut their live JWT sessions.

## 4. Session policy

- JWT strategy, max age 30 days, refreshed daily on activity (`src/auth.ts`).
- There is no per-user revocation list; global invalidation = rotate `AUTH_SECRET`.

## 5. Backup & restore (PostgreSQL / Neon)

```bash
# Backup (Neon pooled connection string):
pg_dump "$DATABASE_URL" --no-owner --format=custom --file "backups/sitaram-$(date +%Y%m%d-%H%M%S).dump"

# Restore into a scratch/staging database:
createdb sitaram_restore
pg_restore --dbname=sitaram_restore --no-owner "backups/sitaram-<stamp>.dump"
```

On Neon, prefer branching for point-in-time copies:

```bash
neon branches add --name pre-migration-check   # instant copy for staging validation
```

Verify restores by row-counting key tables (`User`, `Machine`, `FuelLog`, `Expense`, `Revenue`) against source.

`scripts/backup-db.mjs` is legacy SQLite-only and does not apply to the current PostgreSQL schema.

## 6. Reporting a suspected compromise

1. Rotate `AUTH_SECRET` (cuts all sessions).
2. Rotate all privileged passwords (§3).
3. Snapshot the database (§5) before remediation for forensics.
4. Review audit trails (audit logging ships in a later phase).
