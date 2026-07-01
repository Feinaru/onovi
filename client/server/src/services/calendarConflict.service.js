const prisma = require('../lib/prisma');

/**
 * Calendar Conflict Detection Service
 * Prevents double-booking and time conflicts
 */

/**
 * Check if a slot can be modified (no active bookings)
 */
async function canModifySlot(slotId) {
  const slot = await prisma.slot.findUnique({
    where: { id: slotId },
    include: {
      bookings: {
        where: {
          status: {
            notIn: ['CANCELLED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_BUSINESS']
          }
        }
      }
    }
  });

  if (!slot) {
    return { canModify: false, reason: 'Slot not found' };
  }

  const activeBookings = slot.bookings || [];

  if (activeBookings.length > 0) {
    return {
      canModify: false,
      reason: 'Cannot modify slot with active bookings',
      bookings: activeBookings
    };
  }

  return { canModify: true };
}

/**
 * Check for slot conflicts
 */
async function checkSlotConflicts(businessId, date, startTime, endTime, excludeSlotId = null) {
  const conflicts = [];

  // Check for overlapping slots
  const slots = await prisma.slot.findMany({
    where: {
      businessId,
      date,
      id: excludeSlotId ? { not: excludeSlotId } : undefined,
      OR: [
        {
          AND: [
            { startTime: { lt: endTime } },
            { endTime: { gt: startTime } }
          ]
        }
      ]
    }
  });

  if (slots.length > 0) {
    conflicts.push({
      type: 'SLOT_OVERLAP',
      severity: 'ERROR',
      message: \`Overlaps with \${slots.length} existing slot(s)\`,
      slots
    });
  }

  return conflicts;
}

/**
 * Check for calendar event conflicts
 */
async function checkCalendarEventConflicts(businessId, date, startTime, endTime, excludeEventId = null) {
  const conflicts = [];

  // Check for other calendar events
  const events = await prisma.calendarEvent.findMany({
    where: {
      businessId,
      date,
      id: excludeEventId ? { not: excludeEventId } : undefined,
      isBlocker: true,
      OR: [
        {
          AND: [
            { startTime: { lt: endTime } },
            { endTime: { gt: startTime } }
          ]
        }
      ]
    }
  });

  if (events.length > 0) {
    conflicts.push({
      type: 'EVENT_OVERLAP',
      severity: 'WARNING',
      message: \`Overlaps with \${events.length} calendar event(s)\`,
      events
    });
  }

  return conflicts;
}

/**
 * Check for time block conflicts
 */
async function checkTimeBlockConflicts(businessId, date, startTime, endTime, excludeBlockId = null) {
  const conflicts = [];

  // Check for slots
  const slots = await prisma.slot.findMany({
    where: {
      businessId,
      date,
      status: 'OPEN',
      OR: [
        {
          AND: [
            { startTime: { lt: endTime } },
            { endTime: { gt: startTime } }
          ]
        }
      ]
    }
  });

  if (slots.length > 0) {
    conflicts.push({
      type: 'SLOT_OVERLAP',
      severity: 'WARNING',
      message: \`Overlaps with \${slots.length} open slot(s)\`,
      slots
    });
  }

  return conflicts;
}

/**
 * Check for vacation conflicts
 */
async function checkVacationConflicts(businessId, startDate, endDate) {
  const conflicts = [];

  // Check for active bookings in the vacation period
  const bookings = await prisma.booking.findMany({
    where: {
      businessId,
      status: {
        notIn: ['CANCELLED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_BUSINESS']
      },
      slot: {
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    },
    include: {
      slot: true,
      service: true
    }
  });

  if (bookings.length > 0) {
    conflicts.push({
      type: 'BOOKING_CONFLICT',
      severity: 'ERROR',
      message: \`\${bookings.length} active booking(s) exist during this period\`,
      bookings
    });
  }

  // Check for open slots
  const slots = await prisma.slot.findMany({
    where: {
      businessId,
      status: 'OPEN',
      date: {
        gte: startDate,
        lte: endDate
      }
    }
  });

  if (slots.length > 0) {
    conflicts.push({
      type: 'SLOT_CONFLICT',
      severity: 'WARNING',
      message: \`\${slots.length} open slot(s) exist during this period\`,
      slots
    });
  }

  return conflicts;
}

module.exports = {
  canModifySlot,
  checkSlotConflicts,
  checkCalendarEventConflicts,
  checkTimeBlockConflicts,
  checkVacationConflicts
};
