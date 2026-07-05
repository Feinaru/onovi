-- AlterEnum
ALTER TYPE "SlotStatus" ADD VALUE 'FULL';

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_slotId_fkey";

-- DropForeignKey
ALTER TABLE "Slot" DROP CONSTRAINT "Slot_serviceId_fkey";

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "businessServiceId" INTEGER,
ADD COLUMN     "endTime" TEXT,
ADD COLUMN     "startTime" TEXT,
ALTER COLUMN "serviceId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Slot" ALTER COLUMN "serviceId" DROP NOT NULL,
ALTER COLUMN "regularPrice" DROP NOT NULL;

-- CreateTable
CREATE TABLE "SlotAllowedService" (
    "id" SERIAL NOT NULL,
    "slotId" INTEGER NOT NULL,
    "businessServiceId" INTEGER NOT NULL,

    CONSTRAINT "SlotAllowedService_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SlotAllowedService_slotId_idx" ON "SlotAllowedService"("slotId");

-- CreateIndex
CREATE UNIQUE INDEX "SlotAllowedService_slotId_businessServiceId_key" ON "SlotAllowedService"("slotId", "businessServiceId");

-- CreateIndex
CREATE INDEX "Booking_businessId_status_idx" ON "Booking"("businessId", "status");

-- CreateIndex
CREATE INDEX "Booking_slotId_status_idx" ON "Booking"("slotId", "status");

-- CreateIndex
CREATE INDEX "Booking_slotId_startTime_idx" ON "Booking"("slotId", "startTime");

-- CreateIndex
CREATE INDEX "Slot_businessId_date_status_idx" ON "Slot"("businessId", "date", "status");

-- AddForeignKey
ALTER TABLE "Slot" ADD CONSTRAINT "Slot_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlotAllowedService" ADD CONSTRAINT "SlotAllowedService_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "Slot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlotAllowedService" ADD CONSTRAINT "SlotAllowedService_businessServiceId_fkey" FOREIGN KEY ("businessServiceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_businessServiceId_fkey" FOREIGN KEY ("businessServiceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "Slot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
