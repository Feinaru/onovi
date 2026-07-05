-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "defaultAppointmentBufferMins" INTEGER DEFAULT 0,
ADD COLUMN     "defaultBookingBehavior" TEXT DEFAULT 'manual',
ADD COLUMN     "language" TEXT DEFAULT 'he',
ADD COLUMN     "timezone" TEXT DEFAULT 'Asia/Jerusalem';
