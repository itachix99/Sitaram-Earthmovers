-- AlterTable
ALTER TABLE "public"."Expense" ADD COLUMN     "referenceId" TEXT,
ADD COLUMN     "source" TEXT;

-- AlterTable
ALTER TABLE "public"."Revenue" ADD COLUMN     "referenceId" TEXT,
ADD COLUMN     "source" TEXT;
