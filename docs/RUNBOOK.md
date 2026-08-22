# Runbook — Backup, Restore, Migration, Rollback

## Backup (logical + physical)

```bash
# Logical (any host, via Prisma)
node scripts/backup-db.mjs  # -> backups/sitaram-YYYY-MM-DDTHH-MM-SS.json

# Physical (requires postgresql-client)
pg_dump "$DATABASE_URL" --no-owner --format=custom --file backups/sitaram-$(date +%Y%m%d-%H%M%S).dump

# Neon branching (instant PITR, preferred for pre-migration)
neon branches create --name pre-migration-$(date +%Y%m%d) --parent
```

## Restore

```bash
# Logical restore — requires TARGET_IS_SCRATCH=true and verified DATABASE_URL
TARGET_IS_SCRATCH=true DATABASE_URL=<scratch-branch-url> node scripts/restore-db.mjs backups/sitaram-....json

# Physical restore
pg_restore --dbname=<scratch> --no-owner backups/sitaram-....dump
# or neon branches restore
```

## Migration

```bash
# Validate
node node_modules/prisma/build/index.js validate
node node_modules/prisma/build/index.js migrate status

# Apply (staging branch first)
DATABASE_URL=<branch-url> node node_modules/prisma/build/index.js migrate deploy

# Create new migration (dev)
node node_modules/prisma/build/index.js migrate dev --name <name>
```

## Rollback

- **If migration fails on branch:** `neon branches delete <branch>` — prod untouched.
- **If migration fails on prod:** 
  1. `neon branches restore --branch pre-migration-YYYYMMDD` (Neon) or `pg_restore` from dump
  2. `node node_modules/prisma/build/index.js migrate resolve --rolled-back <migration-name>`
  3. Redeploy previous app build (`pnpm build` of prior commit)
- Logical backups are additive — older backups can be restored into older schema via `referenceId`/`source` being optional (new columns default NULL).

## Verification Checklist (Phase 4)

- [x] FKs: Assignment_operatorId_fkey, Revenue_machineId_fkey, AuditLog_actorId_fkey — verified via pg_constraint
- [x] Decimal: numeric(10,2)/12,2/14,2 — verified via information_schema
- [x] Partial unique indexes — verified
- [x] AuditLog table + indexes — verified
- [x] Source/reference fields added via 20260822084505_add_source_fields after backup 2026-08-22T08-44-10.json
- [x] prisma validate && migrate status = up to date
- [x] pnpm build passes
