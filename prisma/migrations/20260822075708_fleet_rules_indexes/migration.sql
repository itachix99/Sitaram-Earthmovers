-- Fleet rules: guarantee at most one ACTIVE assignment per machine and one
-- ACTIVE work session per machine / per operator, enforced by the database
-- (partial unique indexes) rather than check-then-create application logic.

-- 1. Pre-clean existing violations so the indexes can be created.

-- Close duplicate ACTIVE assignments (keep the most recent per machine).
UPDATE "Assignment" SET "status" = 'COMPLETED', "endedAt" = COALESCE("endedAt", NOW())
WHERE "status" = 'ACTIVE'
  AND "id" NOT IN (
    SELECT DISTINCT ON ("machineId") "id"
    FROM "Assignment"
    WHERE "status" = 'ACTIVE'
    ORDER BY "machineId", "assignedAt" DESC, "id" DESC
  );

-- Close duplicate ACTIVE work sessions (keep the most recent per machine),
-- backfilling closing meter/endTime so historical hours stay consistent.
UPDATE "WorkSession" SET
    "status" = 'COMPLETED',
    "endTime" = COALESCE("endTime", NOW()),
    "closingHourMeter" = COALESCE("closingHourMeter", "openingHourMeter")
WHERE "status" = 'ACTIVE'
  AND "id" NOT IN (
    SELECT DISTINCT ON ("machineId") "id"
    FROM "WorkSession"
    WHERE "status" = 'ACTIVE'
    ORDER BY "machineId", "startTime" DESC, "id" DESC
  );

-- Close duplicate ACTIVE work sessions (keep the most recent per operator).
UPDATE "WorkSession" SET
    "status" = 'COMPLETED',
    "endTime" = COALESCE("endTime", NOW()),
    "closingHourMeter" = COALESCE("closingHourMeter", "openingHourMeter")
WHERE "status" = 'ACTIVE'
  AND "id" NOT IN (
    SELECT DISTINCT ON ("operatorId") "id"
    FROM "WorkSession"
    WHERE "status" = 'ACTIVE'
    ORDER BY "operatorId", "startTime" DESC, "id" DESC
  );

-- 2. Enforcing indexes.

CREATE UNIQUE INDEX "assignment_one_active_per_machine"
  ON "Assignment"("machineId")
  WHERE "status" = 'ACTIVE';

CREATE UNIQUE INDEX "work_session_one_active_per_machine"
  ON "WorkSession"("machineId")
  WHERE "status" = 'ACTIVE';

CREATE UNIQUE INDEX "work_session_one_active_per_operator"
  ON "WorkSession"("operatorId")
  WHERE "status" = 'ACTIVE';
