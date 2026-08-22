# Sitaram Earthmovers — Machinery Management

Production-grade machinery management for an earthmover fleet: machines, operators, hour-meters, fuel, maintenance, breakdowns, job sites, expenses and revenue. Owner/admin dashboard plus a mobile-first operator workflow (start/end work, fuel logging, issue reporting) with PWA install + offline shell.

> **Powering Every Move.**

## Stack

- Next.js 16 (App Router, Turbopack), React 19, TypeScript strict
- Tailwind CSS v4 (`@theme inline` tokens), shadcn-style components
- Prisma 6 + SQLite (`file:./dev.db`) — Postgres-ready switch documented below
- NextAuth v5 (credentials: phone/email + bcrypt), JWT sessions, RBAC via middleware + server-action guards
- Recharts for dashboard/analytics charts; hand-rolled service worker for offline operator pages

## Getting started

```bash
pnpm install
node node_modules/prisma/build/index.js migrate dev   # apply schema to the dev database
SEED_DEMO_DATA=true node prisma/seed.mjs              # optional demo data (dev only, random passwords)
pnpm dev                                              # http://localhost:3000
```

Seeding is development-only and double-guarded: it refuses to run in production
and requires an explicit `SEED_DEMO_DATA=true`. Seeded accounts get random
passwords printed once to the terminal — no credentials are stored in source.
See [docs/SECURITY.md](docs/SECURITY.md) for rotation procedures.

## Scripts

```bash
pnpm dev                        # dev server (Turbopack)
pnpm build                      # production build
pnpm lint                       # eslint
pnpm typecheck                  # tsc --noEmit
node scripts/backup-db.mjs      # timestamped SQLite backup into backups/ (keeps last 20)
```

Note: in this environment the Prisma CLI is invoked as `node node_modules/prisma/build/index.js …` because `pnpm prisma` fails here; on a normal machine `npx prisma …` works.

## Environment

Copy `.env.example` → `.env`:

- `DATABASE_URL` — `file:./dev.db` (SQLite) or a Postgres URL
- `AUTH_SECRET` / `NEXTAUTH_SECRET` — required in production (sessions are signed with it)
- `NEXTAUTH_URL` — public origin in production

`src/lib/env.ts` validates these at boot and fails fast with actionable errors.

## Production hardening included

- Login rate limiting: 5 failed attempts per identifier+IP per 15 min (in-memory; swap for Redis when scaling horizontally)
- Security headers: `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` (see `next.config.ts`)
- JWT session max age 30 days, refreshed daily on activity
- Every mutating server action re-checks the session role (`requireAdmin()` or ownership checks); `/admin/*` additionally gated by middleware
- Branded global error boundary, not-found page, operator route loading skeletons

## Migrating SQLite → Postgres

1. Provision Postgres and set `DATABASE_URL=postgres://...`
2. In `prisma/schema.prisma`: change `provider = "sqlite"` → `"postgresql"`; keep `url = env("DATABASE_URL")`
3. SQLite enums are stored as strings — after switching, convert fields to native Prisma enums if desired (optional)
4. `npx prisma migrate dev --name postgres_init`, then `node prisma/seed.mjs`
5. Backups: replace `scripts/backup-db.mjs` usage with `pg_dump`
6. Deploy note: Prisma needs an OpenSSL-compatible runtime image (`node:20-slim` + `apt-get install -y openssl`)

## Known scope decisions

- Revenue/profit figures are labeled estimates until invoices are fully reconciled
- Photo/receipt uploads are stubbed (toast placeholder) pending storage choice
- Service worker intentionally never caches `/admin/*` or `/api/*` — admin data is always fetched live
- Offline write buffering (queue Start Work/Fuel while offline) is future work
