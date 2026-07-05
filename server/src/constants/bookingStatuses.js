/**
 * Booking Status Constants
 *
 * Centralized definitions for booking statuses used throughout the application.
 * This ensures consistency in queries and status checks.
 */

/**
 * Booking statuses that indicate an active booking
 * (used for slot capacity calculation and overlap detection)
 */
const ACTIVE_BOOKING_STATUSES = [
  'PENDING',    // Customer submitted, awaiting business confirmation
  'CONFIRMED',  // Business confirmed (canonical status for MVP)
  'APPROVED'    // Legacy support - treat as active for backward compatibility
];

/**
 * Booking statuses that indicate booking was cancelled or rejected
 */
const CANCELLED_BOOKING_STATUSES = [
  'CANCELLED',
  'CANCELLED_BY_CUSTOMER',
  'CANCELLED_BY_BUSINESS',
  'REJECTED'
];

/**
 * All valid booking statuses
 */
const ALL_BOOKING_STATUSES = [
  ...ACTIVE_BOOKING_STATUSES,
  ...CANCELLED_BOOKING_STATUSES,
  'COMPLETED',
  'NO_SHOW'
];

module.exports = {
  ACTIVE_BOOKING_STATUSES,
  CANCELLED_BOOKING_STATUSES,
  ALL_BOOKING_STATUSES
};
