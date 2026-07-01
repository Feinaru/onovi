-- AlterTable
ALTER TABLE "CalendarEvent" ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "externalSource" TEXT,
ADD COLUMN     "importedAt" TIMESTAMP(3),
ADD COLUMN     "isAllDay" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Slot" ADD COLUMN     "color" TEXT DEFAULT '#10b981',
ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "externalSource" TEXT,
ADD COLUMN     "importedAt" TIMESTAMP(3),
ADD COLUMN     "title" TEXT;

-- AlterTable
ALTER TABLE "TimeBlock" ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "externalSource" TEXT,
ADD COLUMN     "importedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Slot_businessId_date_idx" ON "Slot"("businessId", "date");
