/**
 * Slot Status Recalculation Service
 *
 * Epic 2 Sprint C: Recalculates slot status based on remaining booking capacity
 * using legal start times and active bookings.
 */

const { getLegalStartTimes } = require('./slotAvailability.service');
const { ACTIVE_BOOKING_STATUSES } = require('../constants/bookingStatuses');

/**
 * Recalculate and update slot status based on remaining capacity
 *
 * @param {Object} tx - Prisma transaction client
 * @param {number} slotId - Slot ID to recalculate
 * @param {number|null} excludeBookingId - Booking ID to exclude (for reschedule)
 * @returns {Promise<string>} New slot status ('OPEN' or 'FULL')
 */
async function recalculateSlotStatus(tx, slotId, excludeBookingId = null) {
  // Get slot with allowed services
  const slot = await tx.slot.findUnique({
    where: { id: slotId },
    include: {
      allowedServices: {
        include: {
          businessService: {
            include: { serviceTemplate: true }
          }
        }
      }
    }
  });

  if (!slot) {
    throw new Error(`Slot ${slotId} not found`);
  }

  // If no allowed services, slot cannot accept bookings
  if (!slot.allowedServices || slot.allowedServices.length === 0) {
    return 'FULL';
  }

  // Check if ANY allowed service has legal start times remaining
  let hasCapacity = false;

  for (const allowedService of slot.allowedServices) {
    const legalTimes = await getLegalStartTimes(
      tx,
      slotId,
      allowedService.businessServiceId,
      excludeBookingId
    );

    if (legalTimes.length > 0) {
      hasCapacity = true;
      break; // At least one service has capacity
    }
  }

  const newStatus = hasCapacity ? 'OPEN' : 'FULL';

  // Update slot status
  await tx.slot.update({
    where: { id: slotId },
    data: { status: newStatus }
  });

  return newStatus;
}

module.exports = {
  recalculateSlotStatus
};
