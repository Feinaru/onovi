-- Backfill SlotAllowedService from existing Slot.serviceId
-- For each existing Slot, create a SlotAllowedService record linking to its service
INSERT INTO "SlotAllowedService" ("slotId", "businessServiceId")
SELECT
  s.id AS "slotId",
  s."serviceId" AS "businessServiceId"
FROM "Slot" s
WHERE s."serviceId" IS NOT NULL
ON CONFLICT DO NOTHING;

-- Backfill Booking.businessServiceId from Booking.serviceId
-- Map old serviceId (ServiceTemplate) to BusinessService
UPDATE "Booking" b
SET "businessServiceId" = b."serviceId"
WHERE b."businessServiceId" IS NULL AND b."serviceId" IS NOT NULL;

-- Backfill Booking.startTime and endTime from Slot times (temporary)
-- This will be regenerated when bookings are rescheduled, but needed for data integrity
UPDATE "Booking" b
SET
  "startTime" = s."startTime",
  "endTime" = s."endTime"
FROM "Slot" s
WHERE b."slotId" = s.id
  AND (b."startTime" IS NULL OR b."endTime" IS NULL);

-- Verification: Check that all backfills succeeded
DO $$
DECLARE
  slot_count INTEGER;
  junction_count INTEGER;
  booking_null_business_service INTEGER;
  booking_null_times INTEGER;
BEGIN
  -- Verify SlotAllowedService backfill
  SELECT COUNT(*) INTO slot_count FROM "Slot" WHERE "serviceId" IS NOT NULL;
  SELECT COUNT(*) INTO junction_count FROM "SlotAllowedService";

  IF junction_count < slot_count THEN
    RAISE EXCEPTION 'SlotAllowedService backfill incomplete: % slots but only % junction records', slot_count, junction_count;
  END IF;

  -- Verify Booking.businessServiceId backfill
  SELECT COUNT(*) INTO booking_null_business_service
  FROM "Booking"
  WHERE "businessServiceId" IS NULL AND "serviceId" IS NOT NULL;

  IF booking_null_business_service > 0 THEN
    RAISE EXCEPTION 'Booking.businessServiceId backfill incomplete: % bookings still NULL', booking_null_business_service;
  END IF;

  -- Verify Booking times backfill
  SELECT COUNT(*) INTO booking_null_times
  FROM "Booking"
  WHERE "startTime" IS NULL OR "endTime" IS NULL;

  IF booking_null_times > 0 THEN
    RAISE EXCEPTION 'Booking times backfill incomplete: % bookings missing times', booking_null_times;
  END IF;

  RAISE NOTICE 'All backfills verified successfully';
  RAISE NOTICE 'Slots with serviceId: %', slot_count;
  RAISE NOTICE 'SlotAllowedService records: %', junction_count;
END $$;
