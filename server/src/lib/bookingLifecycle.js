/**
 * Booking Lifecycle Policy
 *
 * Central policy for booking lifecycle management and reschedule eligibility.
 * Used to determine which bookings can be rescheduled by customers.
 */

const { CANCELLED_BOOKING_STATUSES } = require('../constants/bookingStatuses');

/**
 * Booking statuses that are terminal (cannot be changed)
 */
const TERMINAL_BOOKING_STATUSES = [
  'COMPLETED',
  'NO_SHOW',
  ...CANCELLED_BOOKING_STATUSES  // CANCELLED, CANCELLED_BY_CUSTOMER, CANCELLED_BY_BUSINESS, REJECTED
];

/**
 * Booking statuses that allow customer rescheduling
 * Policy: Only active, non-terminal bookings can be rescheduled
 */
const RESCHEDULABLE_BOOKING_STATUSES = [
  'PENDING',
  'CONFIRMED'
  // APPROVED is legacy and not included in reschedulable list for v1
];

/**
 * Reschedule blocked reasons
 */
const RESCHEDULE_BLOCKED_REASONS = {
  BOOKING_NOT_FOUND: 'BOOKING_NOT_FOUND',
  BOOKING_NOT_OWNED_BY_CUSTOMER: 'BOOKING_NOT_OWNED_BY_CUSTOMER',
  BOOKING_STATUS_NOT_RESCHEDULABLE: 'BOOKING_STATUS_NOT_RESCHEDULABLE',
  BOOKING_ALREADY_CANCELLED: 'BOOKING_ALREADY_CANCELLED',
  BOOKING_ALREADY_COMPLETED: 'BOOKING_ALREADY_COMPLETED',
  BOOKING_NO_SHOW: 'BOOKING_NO_SHOW',
  MISSING_SLOT: 'MISSING_SLOT',
  MISSING_SERVICE: 'MISSING_SERVICE'
};

/**
 * Check if a booking status is terminal (cannot be changed)
 */
function isTerminalBookingStatus(status) {
  return TERMINAL_BOOKING_STATUSES.includes(status);
}

/**
 * Check if a booking can be rescheduled by a customer
 * Returns { canReschedule: boolean, blockedReason: string | null }
 */
function canCustomerRescheduleBooking(booking, customerId) {
  if (!booking) {
    return {
      canReschedule: false,
      blockedReason: RESCHEDULE_BLOCKED_REASONS.BOOKING_NOT_FOUND
    };
  }

  // Verify ownership
  if (booking.customerId !== customerId) {
    return {
      canReschedule: false,
      blockedReason: RESCHEDULE_BLOCKED_REASONS.BOOKING_NOT_OWNED_BY_CUSTOMER
    };
  }

  // Check status
  if (!RESCHEDULABLE_BOOKING_STATUSES.includes(booking.status)) {
    // Provide specific reason for common terminal states
    if (booking.status === 'COMPLETED') {
      return {
        canReschedule: false,
        blockedReason: RESCHEDULE_BLOCKED_REASONS.BOOKING_ALREADY_COMPLETED
      };
    }
    if (booking.status === 'NO_SHOW') {
      return {
        canReschedule: false,
        blockedReason: RESCHEDULE_BLOCKED_REASONS.BOOKING_NO_SHOW
      };
    }
    if (CANCELLED_BOOKING_STATUSES.includes(booking.status)) {
      return {
        canReschedule: false,
        blockedReason: RESCHEDULE_BLOCKED_REASONS.BOOKING_ALREADY_CANCELLED
      };
    }
    return {
      canReschedule: false,
      blockedReason: RESCHEDULE_BLOCKED_REASONS.BOOKING_STATUS_NOT_RESCHEDULABLE
    };
  }

  // Check required relationships
  if (!booking.slotId) {
    return {
      canReschedule: false,
      blockedReason: RESCHEDULE_BLOCKED_REASONS.MISSING_SLOT
    };
  }

  if (!booking.businessServiceId) {
    return {
      canReschedule: false,
      blockedReason: RESCHEDULE_BLOCKED_REASONS.MISSING_SERVICE
    };
  }

  return {
    canReschedule: true,
    blockedReason: null
  };
}

/**
 * Get human-friendly reschedule blocked reason message (Hebrew)
 */
function getRescheduleBlockedReasonMessage(reason) {
  const messages = {
    [RESCHEDULE_BLOCKED_REASONS.BOOKING_NOT_FOUND]: 'התור לא נמצא',
    [RESCHEDULE_BLOCKED_REASONS.BOOKING_NOT_OWNED_BY_CUSTOMER]: 'התור אינו שייך לך',
    [RESCHEDULE_BLOCKED_REASONS.BOOKING_STATUS_NOT_RESCHEDULABLE]: 'לא ניתן לשנות את התור במצב הנוכחי',
    [RESCHEDULE_BLOCKED_REASONS.BOOKING_ALREADY_CANCELLED]: 'התור בוטל ולא ניתן לשנותו',
    [RESCHEDULE_BLOCKED_REASONS.BOOKING_ALREADY_COMPLETED]: 'התור הושלם ולא ניתן לשנותו',
    [RESCHEDULE_BLOCKED_REASONS.BOOKING_NO_SHOW]: 'התור סומן כאי-הגעה ולא ניתן לשנותו',
    [RESCHEDULE_BLOCKED_REASONS.MISSING_SLOT]: 'חסר מידע על התור המקורי',
    [RESCHEDULE_BLOCKED_REASONS.MISSING_SERVICE]: 'חסר מידע על השירות'
  };
  return messages[reason] || 'לא ניתן לשנות את התור';
}

module.exports = {
  TERMINAL_BOOKING_STATUSES,
  RESCHEDULABLE_BOOKING_STATUSES,
  RESCHEDULE_BLOCKED_REASONS,
  isTerminalBookingStatus,
  canCustomerRescheduleBooking,
  getRescheduleBlockedReasonMessage
};
