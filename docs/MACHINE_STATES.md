# Machine State Transitions

## States

- ACTIVE — available, no active session
- WORKING — active WorkSession running
- IDLE — available, last session completed
- BROKEN_DOWN — flagged by HIGH/CRITICAL breakdown (only from ACTIVE/WORKING/IDLE)
- UNDER_MAINTENANCE — set by maintenance flow (manual admin)
- RETIRED — terminal, no new assignments or sessions

## Transitions

```
ACTIVE ──startWork──> WORKING ──endWork──> IDLE
  │                      │
  └─ HIGH/CRITICAL ─────> BROKEN_DOWN ──resolve last incident──> IDLE  (only if no ACTIVE WorkSession && status==BROKEN_DOWN)
                           ^
                           │  endWork preserves: if current==BROKEN_DOWN||UNDER_MAINTENANCE, status stays BROKEN_DOWN/UNDER_MAINTENANCE

UNDER_MAINTENANCE ── manual admin ──> IDLE/ACTIVE
RETIRED ── no outgoing transitions (blocked in assignments/work)
```

## Rules

- **startWork:** blocked if `RETIRED`; sets status to WORKING inside transaction.
- **endWork:** updates `currentHourMeter` to closing; if status was BROKEN_DOWN or UNDER_MAINTENANCE it is preserved, otherwise set to IDLE. Meter validation: `closing >= opening`, `workingHours <=24`, `opening >= currentHourMeter -0.5`.
- **createBreakdown:** only sets BROKEN_DOWN when prior status in {ACTIVE,WORKING,IDLE} and severity HIGH/CRITICAL.
- **resolve Breakdown:** only sets IDLE when (1) no other OPEN/IN_PROGRESS breakdowns for machine, (2) no ACTIVE WorkSession, (3) current status is BROKEN_DOWN.
- **Assignments:** blocked if machine RETIRED.

## Code References

- `src/lib/actions/work-sessions.ts: startWork/endWork`
- `src/lib/actions/breakdowns.ts: createBreakdown/updateBreakdown`
- `src/lib/actions/assignments.ts`
