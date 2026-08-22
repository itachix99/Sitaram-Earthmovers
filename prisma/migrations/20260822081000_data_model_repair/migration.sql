-- Data model repair: missing foreign keys, exact-decimal money/meter columns,
-- audit log table, and compound indexes matching report filters.

-- 1. Missing foreign keys ---------------------------------------------------

ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_operatorId_fkey"
  FOREIGN KEY ("operatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Revenue" ADD CONSTRAINT "Revenue_machineId_fkey"
  FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 2. Binary floats -> exact numerics (money and meter values) ---------------

ALTER TABLE "Operator" ALTER COLUMN "salaryAmount" TYPE DECIMAL(12,2) USING "salaryAmount"::DECIMAL(12,2);

ALTER TABLE "Machine" ALTER COLUMN "purchasePrice" TYPE DECIMAL(14,2) USING "purchasePrice"::DECIMAL(14,2);
ALTER TABLE "Machine" ALTER COLUMN "currentHourMeter" TYPE DECIMAL(10,2) USING "currentHourMeter"::DECIMAL(10,2);
ALTER TABLE "Machine" ALTER COLUMN "expectedFuelEfficiency" TYPE DECIMAL(6,2) USING "expectedFuelEfficiency"::DECIMAL(6,2);
ALTER TABLE "Machine" ALTER COLUMN "lastServiceMeter" TYPE DECIMAL(10,2) USING "lastServiceMeter"::DECIMAL(10,2);

ALTER TABLE "JobSite" ALTER COLUMN "rate" TYPE DECIMAL(12,2) USING "rate"::DECIMAL(12,2);

ALTER TABLE "WorkSession" ALTER COLUMN "openingHourMeter" TYPE DECIMAL(10,2) USING "openingHourMeter"::DECIMAL(10,2);
ALTER TABLE "WorkSession" ALTER COLUMN "closingHourMeter" TYPE DECIMAL(10,2) USING "closingHourMeter"::DECIMAL(10,2);
ALTER TABLE "WorkSession" ALTER COLUMN "workingHours" TYPE DECIMAL(8,2) USING "workingHours"::DECIMAL(8,2);
ALTER TABLE "WorkSession" ALTER COLUMN "idleHours" TYPE DECIMAL(8,2) USING "idleHours"::DECIMAL(8,2);
ALTER TABLE "WorkSession" ALTER COLUMN "fuelUsed" TYPE DECIMAL(10,2) USING "fuelUsed"::DECIMAL(10,2);

ALTER TABLE "FuelLog" ALTER COLUMN "litres" TYPE DECIMAL(10,2) USING "litres"::DECIMAL(10,2);
ALTER TABLE "FuelLog" ALTER COLUMN "costPerLitre" TYPE DECIMAL(10,2) USING "costPerLitre"::DECIMAL(10,2);
ALTER TABLE "FuelLog" ALTER COLUMN "totalCost" TYPE DECIMAL(12,2) USING "totalCost"::DECIMAL(12,2);
ALTER TABLE "FuelLog" ALTER COLUMN "meterReading" TYPE DECIMAL(10,2) USING "meterReading"::DECIMAL(10,2);

ALTER TABLE "MaintenanceRecord" ALTER COLUMN "meterReading" TYPE DECIMAL(10,2) USING "meterReading"::DECIMAL(10,2);
ALTER TABLE "MaintenanceRecord" ALTER COLUMN "nextServiceHours" TYPE DECIMAL(10,2) USING "nextServiceHours"::DECIMAL(10,2);
ALTER TABLE "MaintenanceRecord" ALTER COLUMN "partsCost" TYPE DECIMAL(12,2) USING COALESCE("partsCost", 0)::DECIMAL(12,2),
                            ALTER COLUMN "partsCost" SET NOT NULL;
ALTER TABLE "MaintenanceRecord" ALTER COLUMN "laborCost" TYPE DECIMAL(12,2) USING COALESCE("laborCost", 0)::DECIMAL(12,2),
                            ALTER COLUMN "laborCost" SET NOT NULL;
ALTER TABLE "MaintenanceRecord" ALTER COLUMN "totalCost" TYPE DECIMAL(12,2) USING COALESCE("totalCost", 0)::DECIMAL(12,2),
                            ALTER COLUMN "totalCost" SET NOT NULL;

ALTER TABLE "Expense" ALTER COLUMN "amount" TYPE DECIMAL(12,2) USING "amount"::DECIMAL(12,2);

ALTER TABLE "Revenue" ALTER COLUMN "amount" TYPE DECIMAL(14,2) USING "amount"::DECIMAL(14,2);
ALTER TABLE "Revenue" ALTER COLUMN "amountReceived" TYPE DECIMAL(14,2) USING "amountReceived"::DECIMAL(14,2);

-- 3. Audit log --------------------------------------------------------------

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorRole" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 4. Compound indexes matching report/analytics filters ---------------------

CREATE INDEX "Assignment_operatorId_status_idx" ON "Assignment"("operatorId", "status");
CREATE INDEX "WorkSession_jobSiteId_status_idx" ON "WorkSession"("jobSiteId", "status");
CREATE INDEX "FuelLog_machineId_date_idx" ON "FuelLog"("machineId", "date");
CREATE INDEX "MaintenanceRecord_serviceDate_idx" ON "MaintenanceRecord"("serviceDate");
CREATE INDEX "Expense_jobSiteId_date_idx" ON "Expense"("jobSiteId", "date");
CREATE INDEX "Revenue_paymentStatus_idx" ON "Revenue"("paymentStatus");
