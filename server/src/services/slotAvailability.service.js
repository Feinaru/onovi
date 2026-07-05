const prisma = require('../lib/prisma');
const { ACTIVE_BOOKING_STATUSES } = require('../constants/bookingStatuses');

/**
 * Slot Availability Service
 *
 * Handles legal start-time calculation for multi-booking slots.
 * Implements no-dead-edge rule and free interval analysis.
 *
 * CRITICAL: All functions accept a transaction client (tx) for concurrency safety.
 */

/**
 * Calculate GCD (Greatest Common Divisor)
 */
function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

function gcdArray(arr) {
  if (arr.length === 0) return 15; // Default to 15 if no services
  return arr.reduce((acc, val) => gcd(acc, val));
}

/**
 * Convert "HH:MM" time string to minutes since midnight
 */
function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Convert minutes since midnight to "HH:MM" time string
 */
function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Get legal start times for a service in a slot
 *
 * CRITICAL: Must be called with transaction client for concurrency safety
 *
 * @param {PrismaClient} tx - Transaction client
 * @param {number} slotId - Slot ID
 * @param {number} businessServiceId - BusinessService ID
 * @param {number|null} excludeBookingId - Booking ID to exclude (for reschedule)
 * @returns {Promise<Array<{startTime: string, endTime: string}>>}
 */
async function getLegalStartTimes(tx, slotId, businessServiceId, excludeBookingId = null) {
  // 1. Fetch slot with allowed services and active bookings
  const slot = await tx.slot.findUnique({
    where: { id: slotId },
    include: {
      allowedServices: {
        include: {
          businessService: {
            include: { serviceTemplate: true }
          }
        }
      },
      bookings: {
        where: {
          status: { in: ACTIVE_BOOKING_STATUSES },
          ...(excludeBookingId && { id: { not: excludeBookingId } }) // Exclude booking being rescheduled
        },
        orderBy: { startTime: 'asc' }
      }
    }
  });

  if (!slot) throw new Error('Slot not found');

  // 2. Verify service is allowed in this slot
  const allowedServiceIds = slot.allowedServices.map(as => as.businessServiceId);
  if (!allowedServiceIds.includes(businessServiceId)) {
    throw new Error('Service not allowed in this slot');
  }

  // 3. Get selected service duration
  const selectedService = slot.allowedServices
    .find(as => as.businessServiceId === businessServiceId)
    .businessService;
  const selectedDuration = selectedService.serviceTemplate
    ? selectedService.serviceTemplate.defaultDurationMinutes
    : selectedService.durationMinutes;

  // 4. Calculate shortest allowed service duration (for no-dead-edge rule)
  const allowedDurations = slot.allowedServices.map(as => {
    const bs = as.businessService;
    return bs.serviceTemplate ? bs.serviceTemplate.defaultDurationMinutes : bs.durationMinutes;
  });
  const shortestDuration = Math.min(...allowedDurations);

  // 5. Calculate time step (GCD, min 5, max 15 for MVP)
  const timeStep = Math.max(5, Math.min(15, gcdArray(allowedDurations)));

  // 6. Convert slot boundaries to minutes
  const slotStart = timeToMinutes(slot.startTime);
  const slotEnd = timeToMinutes(slot.endTime);

  // 7. Build occupied intervals from existing bookings (excluding the one being rescheduled)
  const occupiedIntervals = slot.bookings
    .filter(b => b.startTime && b.endTime) // Only include bookings with times
    .map(b => ({
      start: timeToMinutes(b.startTime),
      end: timeToMinutes(b.endTime)
    }))
    .sort((a, b) => a.start - b.start);

  // 8. Calculate free intervals by inverting occupied intervals
  const freeIntervals = [];
  let lastEnd = slotStart;

  for (const occupied of occupiedIntervals) {
    if (occupied.start > lastEnd) {
      freeIntervals.push({ start: lastEnd, end: occupied.start });
    }
    lastEnd = Math.max(lastEnd, occupied.end);
  }

  // Add final free interval after last booking
  if (lastEnd < slotEnd) {
    freeIntervals.push({ start: lastEnd, end: slotEnd });
  }

  // 9. Generate candidate start times within each free interval
  const legalTimes = [];

  for (const freeInterval of freeIntervals) {
    // Iterate through free interval with time step
    for (
      let candidateStart = freeInterval.start;
      candidateStart < freeInterval.end;
      candidateStart += timeStep
    ) {
      const candidateEnd = candidateStart + selectedDuration;

      // Check 1: Booking fits within this free interval
      if (candidateEnd > freeInterval.end) continue;

      // Check 2: No dead edge BEFORE booking (within this free interval)
      const gapBefore = candidateStart - freeInterval.start;
      if (gapBefore > 0 && gapBefore < shortestDuration) {
        continue; // Dead edge before
      }

      // Check 3: No dead edge AFTER booking (within this free interval)
      const gapAfter = freeInterval.end - candidateEnd;
      if (gapAfter > 0 && gapAfter < shortestDuration) {
        continue; // Dead edge after
      }

      // Valid start time found
      legalTimes.push({
        startTime: minutesToTime(candidateStart),
        endTime: minutesToTime(candidateEnd)
      });
    }
  }

  return legalTimes;
}

/**
 * Check if slot has any remaining capacity
 *
 * @param {PrismaClient} tx - Transaction client
 * @param {number} slotId - Slot ID
 * @returns {Promise<boolean>}
 */
async function hasRemainingCapacity(tx, slotId) {
  const slot = await tx.slot.findUnique({
    where: { id: slotId },
    include: {
      allowedServices: {
        include: {
          businessService: { include: { serviceTemplate: true } }
        }
      }
    }
  });

  if (!slot) return false;

  // Check if any allowed service has legal start times
  for (const allowedService of slot.allowedServices) {
    const legalTimes = await getLegalStartTimes(tx, slotId, allowedService.businessServiceId);
    if (legalTimes.length > 0) return true;
  }

  return false;
}

/**
 * Recalculate slot status based on remaining capacity
 *
 * @param {PrismaClient} tx - Transaction client
 * @param {number} slotId - Slot ID
 */
async function recalculateSlotStatus(tx, slotId) {
  const slot = await tx.slot.findUnique({
    where: { id: slotId },
    include: {
      bookings: {
        where: {
          status: { in: ACTIVE_BOOKING_STATUSES }
        }
      }
    }
  });

  if (!slot) return;

  // If no active bookings, set to OPEN
  if (slot.bookings.length === 0) {
    await tx.slot.update({
      where: { id: slotId },
      data: { status: 'OPEN' }
    });
    return;
  }

  // Check if any capacity remains
  const hasCapacity = await hasRemainingCapacity(tx, slotId);

  await tx.slot.update({
    where: { id: slotId },
    data: { status: hasCapacity ? 'OPEN' : 'FULL' }
  });
}

module.exports = {
  getLegalStartTimes,
  hasRemainingCapacity,
  recalculateSlotStatus,
  timeToMinutes,
  minutesToTime,
  gcd,
  gcdArray
};
