-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "calendarColor" TEXT,
ADD COLUMN     "visibleToCustomers" BOOLEAN NOT NULL DEFAULT true;
