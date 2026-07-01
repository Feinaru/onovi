const prisma = require('../lib/prisma');

/**
 * Calendar Conflict Detection Service
 *
 * Prevents overlapping events and protects customer-facing availability
 */

/**
 * Check if two time ranges overlap
 */
function timeRangesOverlap(date1, start1, end1, date2, start2, end2) {
  // Different dates = no overlap
  if (date1 !== date2) return false;

  // Same date - check time overlap
  // Overlap occurs if: start1 < end2 AND end1 > start2
  return start1 < end2 && end1 > start2;
}

/**
 * Get all events in a date range for conflict detection
 */
async function getEventsInRange(businessId, date, startTime, endTime, excludeId = null, excludeType = null) {
  const [slots, bookings, calendarEvents, timeBlocks, vacations] = await Promise.all([
    // Get slots
    prisma.slot.findMany({
      where: {
        businessId,
        date,
        ...(excludeType === 'slot' && excludeId ? { id: { not: excludeId } } : {})
      },
      include: { bookings: true }
    }),

    // Get bookings
    prisma.booking.findMany({
      where: {
        businessId,
        status: { notIn: ['CANCELLED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_BUSINESS'] },
        slot: { date }
      },
      include: { slot: true }
    }),

    // Get calendar events (only blockers)
    prisma.calendarEvent.findMany({
      where: {
        businessId,
        date,
        isBlocker: true,
        ...(excludeType === 'calendarEvent' && excludeId ? { id: { not: excludeId } } : {})
      }
    }),

    // Get time blocks
    prisma.timeBlock.findMany({
      where: {
        businessId,
        date,
        ...(excludeType === 'timeBlock' && excludeId ? { id: { not: excludeId } } : {})
      }
    }),

    // Get vacations
    prisma.vacation.findMany({
      where: {
        businessId,
        startDate: { lte: date },
        endDate: { gte: date },
        ...(excludeType === 'vacation' && excludeId ? { id: { not: excludeId } } : {})
      }
    })
  ]);

  return { slots, bookings, calendarEvents, timeBlocks, vacations };
}

/**
 * Check for conflicts when creating/editing a Slot
 */
async function checkSlotConflicts(businessId, date, startTime, endTime, slotId = null) {
  const events = await getEventsInRange(businessId, date, startTime, endTime, slotId, 'slot');
  const conflicts = [];

  // Check against other slots
  for (const slot of events.slots) {
    if (timeRangesOverlap(date, startTime, endTime, slot.date, slot.startTime, slot.endTime)) {
      conflicts.push({
        type: 'SLOT',
        id: slot.id,
        message: `חלון פנוי קיים: ${slot.startTime}-${slot.endTime}`,
        severity: 'ERROR' // Cannot have overlapping slots
      });
    }
  }

  // Check against bookings
  for (const booking of events.bookings) {
    if (timeRangesOverlap(date, startTime, endTime, booking.slot.date, booking.slot.startTime, booking.slot.endTime)) {
      conflicts.push({
        type: 'BOOKING',
        id: booking.id,
        message: `תור קיים: ${booking.customerName} (${booking.slot.startTime}-${booking.slot.endTime})`,
        severity: 'ERROR' // Cannot overlap with bookings
      });
    }
  }

  // Check against calendar events
  for (const event of events.calendarEvents) {
    if (timeRangesOverlap(date, startTime, endTime, event.date, event.startTime, event.endTime)) {
      conflicts.push({
        type: 'CALENDAR_EVENT',
        id: event.id,
        message: `אירוע קיים: ${event.title} (${event.startTime}-${event.endTime})`,
        severity: 'ERROR' // Cannot overlap with blocker events
      });
    }
  }

  // Check against time blocks
  for (const block of events.timeBlocks) {
    if (timeRangesOverlap(date, startTime, endTime, block.date, block.startTime, block.endTime)) {
      conflicts.push({
        type: 'TIME_BLOCK',
        id: block.id,
        message: `זמן חסום: ${block.title} (${block.startTime}-${block.endTime})`,
        severity: 'ERROR' // Cannot overlap with time blocks
      });
    }
  }

  // Check against vacations
  for (const vacation of events.vacations) {
    conflicts.push({
      type: 'VACATION',
      id: vacation.id,
      message: `חופשה: ${vacation.title} (${vacation.startDate} - ${vacation.endDate})`,
      severity: 'ERROR' // Cannot create slot during vacation
    });
  }

  return conflicts;
}

/**
 * Check for conflicts when creating/editing a CalendarEvent
 */
async function checkCalendarEventConflicts(businessId, date, startTime, endTime, eventId = null) {
  const events = await getEventsInRange(businessId, date, startTime, endTime, eventId, 'calendarEvent');
  const conflicts = [];

  // CalendarEvents can overlap with slots (they block them)
  // But warn about existing bookings
  for (const booking of events.bookings) {
    if (timeRangesOverlap(date, startTime, endTime, booking.slot.date, booking.slot.startTime, booking.slot.endTime)) {
      conflicts.push({
        type: 'BOOKING',
        id: booking.id,
        message: `תור קיים: ${booking.customerName} (${booking.slot.startTime}-${booking.slot.endTime})`,
        severity: 'WARNING' // Warn but allow
      });
    }
  }

  // Warn about other calendar events
  for (const event of events.calendarEvents) {
    if (timeRangesOverlap(date, startTime, endTime, event.date, event.startTime, event.endTime)) {
      conflicts.push({
        type: 'CALENDAR_EVENT',
        id: event.id,
        message: `אירוע קיים: ${event.title} (${event.startTime}-${event.endTime})`,
        severity: 'WARNING'
      });
    }
  }

  return conflicts;
}

/**
 * Check for conflicts when creating/editing a TimeBlock
 */
async function checkTimeBlockConflicts(businessId, date, startTime, endTime, blockId = null) {
  const events = await getEventsInRange(businessId, date, startTime, endTime, blockId, 'timeBlock');
  const conflicts = [];

  // TimeBlocks block availability but can overlap with slots
  // Warn about existing bookings
  for (const booking of events.bookings) {
    if (timeRangesOverlap(date, startTime, endTime, booking.slot.date, booking.slot.startTime, booking.slot.endTime)) {
      conflicts.push({
        type: 'BOOKING',
        id: booking.id,
        message: `תור קיים: ${booking.customerName} (${booking.slot.startTime}-${booking.slot.endTime})`,
        severity: 'WARNING'
      });
    }
  }

  // Warn about other time blocks
  for (const block of events.timeBlocks) {
    if (timeRangesOverlap(date, startTime, endTime, block.date, block.startTime, block.endTime)) {
      conflicts.push({
        type: 'TIME_BLOCK',
        id: block.id,
        message: `זמן חסום: ${block.title} (${block.startTime}-${block.endTime})`,
        severity: 'WARNING'
      });
    }
  }

  return conflicts;
}

/**
 * Check for conflicts when creating/editing a Vacation
 */
async function checkVacationConflicts(businessId, startDate, endDate, vacationId = null) {
  const conflicts = [];

  // Get all dates in range
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dates = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split('T')[0]);
  }

  // Check each date for slots and bookings
  for (const date of dates) {
    const [slots, bookings] = await Promise.all([
      prisma.slot.findMany({
        where: {
          businessId,
          date,
          status: 'OPEN'
        },
        include: { bookings: true }
      }),
      prisma.booking.findMany({
        where: {
          businessId,
          status: { notIn: ['CANCELLED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_BUSINESS'] },
          slot: { date }
        },
        include: { slot: true }
      })
    ]);

    // Warn about open slots
    for (const slot of slots) {
      if (slot.bookings.length === 0) {
        conflicts.push({
          type: 'SLOT',
          id: slot.id,
          date,
          message: `חלון פנוי: ${date} ${slot.startTime}-${slot.endTime}`,
          severity: 'WARNING', // Warn - can unpublish
          action: 'UNPUBLISH_SLOT'
        });
      }
    }

    // Error on existing bookings
    for (const booking of bookings) {
      conflicts.push({
        type: 'BOOKING',
        id: booking.id,
        date,
        message: `תור קיים: ${booking.customerName} (${date} ${booking.slot.startTime}-${booking.slot.endTime})`,
        severity: 'ERROR', // Cannot delete bookings
        action: 'MANUAL_HANDLING'
      });
    }
  }

  return conflicts;
}

/**
 * Check if a slot can be safely deleted/edited
 */
async function canModifySlot(slotId) {
  const slot = await prisma.slot.findUnique({
    where: { id: slotId },
    include: { bookings: true }
  });

  if (!slot) {
    return { canModify: false, reason: 'Slot not found' };
  }

  const activeBookings = slot.bookings.filter(b =>
    !['CANCELLED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_BUSINESS'].includes(b.status)
  );

  if (activeBookings.length > 0) {
    return {
      canModify: false,
      reason: 'Slot has active bookings',
      bookings: activeBookings
    };
  }

  return { canModify: true };
}

module.exports = {
  checkSlotConflicts,
  checkCalendarEventConflicts,
  checkTimeBlockConflicts,
  checkVacationConflicts,
  canModifySlot,
  timeRangesOverlap
};
