-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('OWNER', 'ADMIN', 'OPERATOR');

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "public"."MachineType" AS ENUM ('JCB', 'EXCAVATOR', 'BACKHOE_LOADER', 'BULLDOZER', 'LOADER', 'TIPPER', 'DUMP_TRUCK', 'CRANE', 'TRACTOR', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."MachineStatus" AS ENUM ('ACTIVE', 'WORKING', 'IDLE', 'UNDER_MAINTENANCE', 'BROKEN_DOWN', 'RETIRED');

-- CreateEnum
CREATE TYPE "public"."SalaryType" AS ENUM ('MONTHLY', 'DAILY', 'HOURLY');

-- CreateEnum
CREATE TYPE "public"."JobSiteStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "public"."BillingType" AS ENUM ('HOURLY', 'DAILY', 'FIXED', 'QUANTITY');

-- CreateEnum
CREATE TYPE "public"."AssignmentStatus" AS ENUM ('ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."WorkSessionStatus" AS ENUM ('ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."MaintenanceType" AS ENUM ('SCHEDULED', 'UNSCHEDULED', 'REPAIR');

-- CreateEnum
CREATE TYPE "public"."Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."IssueStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED');

-- CreateEnum
CREATE TYPE "public"."ExpenseCategory" AS ENUM ('FUEL', 'MAINTENANCE', 'REPAIR', 'OPERATOR_PAYMENT', 'TRANSPORT', 'SPARE_PARTS', 'PERMITS', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'OPERATOR',
    "status" "public"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Operator" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "licenseNumber" TEXT,
    "licenseExpiry" TIMESTAMP(3),
    "joiningDate" TIMESTAMP(3),
    "salaryType" "public"."SalaryType" NOT NULL DEFAULT 'MONTHLY',
    "salaryAmount" DOUBLE PRECISION,
    "status" "public"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Operator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Machine" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "machineType" "public"."MachineType" NOT NULL,
    "manufacturer" TEXT,
    "model" TEXT,
    "manufacturingYear" INTEGER,
    "purchaseDate" TIMESTAMP(3),
    "purchasePrice" DOUBLE PRECISION,
    "currentHourMeter" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "expectedFuelEfficiency" DOUBLE PRECISION,
    "serviceIntervalHours" INTEGER DEFAULT 500,
    "serviceIntervalDays" INTEGER,
    "lastServiceAt" TIMESTAMP(3),
    "lastServiceMeter" DOUBLE PRECISION,
    "status" "public"."MachineStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Machine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JobSite" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "clientName" TEXT,
    "clientPhone" TEXT,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3),
    "expectedEndDate" TIMESTAMP(3),
    "status" "public"."JobSiteStatus" NOT NULL DEFAULT 'ACTIVE',
    "billingType" "public"."BillingType" NOT NULL DEFAULT 'HOURLY',
    "rate" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobSite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Assignment" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "jobSiteId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "status" "public"."AssignmentStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkSession" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "jobSiteId" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "openingHourMeter" DOUBLE PRECISION NOT NULL,
    "closingHourMeter" DOUBLE PRECISION,
    "workingHours" DOUBLE PRECISION,
    "idleHours" DOUBLE PRECISION,
    "fuelUsed" DOUBLE PRECISION,
    "notes" TEXT,
    "startPhotoUrl" TEXT,
    "endPhotoUrl" TEXT,
    "status" "public"."WorkSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FuelLog" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "jobSiteId" TEXT,
    "litres" DOUBLE PRECISION NOT NULL,
    "costPerLitre" DOUBLE PRECISION,
    "totalCost" DOUBLE PRECISION,
    "meterReading" DOUBLE PRECISION,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receiptUrl" TEXT,
    "fuelStation" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FuelLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MaintenanceRecord" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "serviceType" "public"."MaintenanceType" NOT NULL DEFAULT 'SCHEDULED',
    "description" TEXT,
    "meterReading" DOUBLE PRECISION,
    "serviceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextServiceHours" DOUBLE PRECISION,
    "nextServiceDate" TIMESTAMP(3),
    "partsCost" DOUBLE PRECISION DEFAULT 0,
    "laborCost" DOUBLE PRECISION DEFAULT 0,
    "totalCost" DOUBLE PRECISION DEFAULT 0,
    "serviceProvider" TEXT,
    "receiptUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BreakdownReport" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "severity" "public"."Severity" NOT NULL DEFAULT 'MEDIUM',
    "issue" TEXT NOT NULL,
    "description" TEXT,
    "photoUrl" TEXT,
    "location" TEXT,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "status" "public"."IssueStatus" NOT NULL DEFAULT 'OPEN',
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BreakdownReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Expense" (
    "id" TEXT NOT NULL,
    "category" "public"."ExpenseCategory" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "machineId" TEXT,
    "jobSiteId" TEXT,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receiptUrl" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Revenue" (
    "id" TEXT NOT NULL,
    "jobSiteId" TEXT,
    "machineId" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "amountReceived" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentStatus" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "billingStart" TIMESTAMP(3),
    "billingEnd" TIMESTAMP(3),
    "clientName" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Revenue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "public"."User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Operator_userId_key" ON "public"."Operator"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Machine_registrationNumber_key" ON "public"."Machine"("registrationNumber");

-- CreateIndex
CREATE INDEX "Assignment_machineId_idx" ON "public"."Assignment"("machineId");

-- CreateIndex
CREATE INDEX "Assignment_jobSiteId_idx" ON "public"."Assignment"("jobSiteId");

-- CreateIndex
CREATE INDEX "Assignment_status_idx" ON "public"."Assignment"("status");

-- CreateIndex
CREATE INDEX "WorkSession_machineId_idx" ON "public"."WorkSession"("machineId");

-- CreateIndex
CREATE INDEX "WorkSession_operatorId_idx" ON "public"."WorkSession"("operatorId");

-- CreateIndex
CREATE INDEX "WorkSession_status_idx" ON "public"."WorkSession"("status");

-- CreateIndex
CREATE INDEX "FuelLog_machineId_idx" ON "public"."FuelLog"("machineId");

-- CreateIndex
CREATE INDEX "FuelLog_date_idx" ON "public"."FuelLog"("date");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_machineId_idx" ON "public"."MaintenanceRecord"("machineId");

-- CreateIndex
CREATE INDEX "BreakdownReport_machineId_idx" ON "public"."BreakdownReport"("machineId");

-- CreateIndex
CREATE INDEX "BreakdownReport_status_idx" ON "public"."BreakdownReport"("status");

-- CreateIndex
CREATE INDEX "Expense_category_idx" ON "public"."Expense"("category");

-- CreateIndex
CREATE INDEX "Expense_date_idx" ON "public"."Expense"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Revenue_invoiceNumber_key" ON "public"."Revenue"("invoiceNumber");

-- AddForeignKey
ALTER TABLE "public"."Operator" ADD CONSTRAINT "Operator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Assignment" ADD CONSTRAINT "Assignment_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "public"."Machine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Assignment" ADD CONSTRAINT "Assignment_jobSiteId_fkey" FOREIGN KEY ("jobSiteId") REFERENCES "public"."JobSite"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkSession" ADD CONSTRAINT "WorkSession_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "public"."Machine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkSession" ADD CONSTRAINT "WorkSession_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkSession" ADD CONSTRAINT "WorkSession_jobSiteId_fkey" FOREIGN KEY ("jobSiteId") REFERENCES "public"."JobSite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FuelLog" ADD CONSTRAINT "FuelLog_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "public"."Machine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FuelLog" ADD CONSTRAINT "FuelLog_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FuelLog" ADD CONSTRAINT "FuelLog_jobSiteId_fkey" FOREIGN KEY ("jobSiteId") REFERENCES "public"."JobSite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "public"."Machine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BreakdownReport" ADD CONSTRAINT "BreakdownReport_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "public"."Machine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BreakdownReport" ADD CONSTRAINT "BreakdownReport_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Expense" ADD CONSTRAINT "Expense_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "public"."Machine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Expense" ADD CONSTRAINT "Expense_jobSiteId_fkey" FOREIGN KEY ("jobSiteId") REFERENCES "public"."JobSite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Expense" ADD CONSTRAINT "Expense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Revenue" ADD CONSTRAINT "Revenue_jobSiteId_fkey" FOREIGN KEY ("jobSiteId") REFERENCES "public"."JobSite"("id") ON DELETE SET NULL ON UPDATE CASCADE;
