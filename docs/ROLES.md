# Role / Resource Matrix

Source of truth: `src/lib/auth-guards.ts` + `src/lib/actions/*` + `prisma/schema.prisma` partial indexes.

Every privileged action re-checks `User.status === ACTIVE` and `User.role` from the database — JWT claims are not trusted.

## Roles

- **OWNER** — full admin, same as ADMIN plus org-owner semantics in UI
- **ADMIN** — fleet manager, can assign machines, manage money, resolve breakdowns
- **OPERATOR** — field operator, strictly scoped to own ACTIVE assignment

## Matrix

| Action | OWNER | ADMIN | OPERATOR (assigned) | OPERATOR (unassigned) | DB Guard |
|---|---|---|---|---|---|
| Start WorkSession (`startWork`) | allow any machine | allow any machine | allow — jobSiteId forced to assignment.jobSiteId | deny | transaction + partial unique indexes `work_session_one_active_per_machine` + `work_session_one_active_per_operator` |
| End WorkSession (`endWork`) | allow own or any | allow own or any | allow own session only | deny | transaction, meter validation |
| Log Fuel (`createFuelLog`) | allow any | allow any | allow — ACTIVE assignment required, jobSiteId forced to assignment site | deny | assignment check |
| Report Breakdown (`createBreakdown`) | allow any | allow any | allow — ACTIVE assignment required | deny | status BROKEN_DOWN only if ACTIVE/WORKING/IDLE + HIGH/CRITICAL |
| Resolve Breakdown (`updateBreakdown`) | allow | allow | deny — OWNER/ADMIN only | deny | safety-aware: only IDLE when last incident + no ACTIVE WorkSession + BROKEN_DOWN |
| Assign Machine (`createAssignment`) | allow | allow | deny | deny | transaction + `assignment_one_active_per_machine` backstop P2002 |
| Expenses/Revenue/Maintenance/Machines/Projects/Operators | allow | allow | deny | deny | `getActionAdmin()` |
| View Admin Pages (`/admin/*`) | allow | allow | redirect to /operator/today | redirect to /login | `admin/layout.tsx: requireAdmin()` |
| Export Reports (`/api/reports/export`) | allow | allow | deny 401 | deny | `getSessionUser` + role check |

## Assignment Scoping

- Source of truth: `Assignment` status=ACTIVE. One ACTIVE per machine via DB.
- Fuel/Work: OPERATOR effectiveJobSiteId = assignment.jobSiteId; mismatch → error.
- UI: `getActiveAssignments(userId)` scopes operator dropdowns.

## Concurrency

- Check-then-create not trusted. Partial unique indexes are backstop; app does findFirst for UX then transaction + P2002 catch.
- Migration `20260822075708_fleet_rules_indexes`.
