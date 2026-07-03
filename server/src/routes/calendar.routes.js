const router = require('express').Router();
const prisma = require('../lib/prisma');
const { auth, requireRole } = require('../middleware/auth');
const conflictService = require('../services/calendarConflict.service');
const metricsService = require('../services/calendarMetrics.service');

/**
 * Calendar Routes - Unified calendar management
 *
 * The calendar is the main workspace for business owners.
 * It shows ALL events: Slots (Published Gaps), Bookings, Calendar Events, Time Blocks, Vacations
 *
 * IMPORTANT: Slot = Published Lomea Gap (customer-visible availability)
 */

async function assertOwnBusiness(user, businessId) {
  if (user.role === 'ADMIN') return true;
  const business = await prisma.business.findUnique({ where: { id: Number(businessId) } });
  return business && business.ownerId === user.id;
}

/**
 * GET /api/calendar/:businessId
 * Get unified calendar view for a date range
 *
 * Returns all event types with consistent structure:
 * - eventType: "SLOT" | "BOOKING" | "CALENDAR_EVENT" | "TIME_BLOCK" | "VACATION"
 */
router.get('/:businessId', auth(), async (req, res, next) => {
  try {
    const businessId = Number(req.params.businessId);
    const { from, to } = req.query;

    if (!businessId) return res.status(400).json({ message: 'businessId is required' });
    if (!(await assertOwnBusiness(req.user, businessId))) {
      return res.status(403).json({ message: 'Forbidden for this business' });
    }

    // Fetch all event types in parallel
    const [slots, bookings, calendarEvents, timeBlocks, vacations] = await Promise.all([
      // Slots (Published Gaps - customer-visible availability)
      prisma.slot.findMany({
        where: {
          businessId,
          ...(from && to ? { date: { gte: from, lte: to } } : {}),
        },
        include: { service: true, bookings: true },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }]
      }),

      // Lomea Bookings (confirmed appointments)
      prisma.booking.findMany({
        where: {
          businessId,
          status: { notIn: ['CANCELLED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_BUSINESS'] },
          ...(from && to ? {
            slot: {
              date: { gte: from, lte: to }
            }
          } : {})
        },
        include: { slot: true, service: true, customer: true },
        orderBy: { createdAt: 'asc' }
      }),

      // Calendar Events (internal appointments, meetings, etc.)
      prisma.calendarEvent.findMany({
        where: {
          businessId,
          ...(from && to ? { date: { gte: from, lte: to } } : {}),
        },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }]
      }),

      // Time Blocks (breaks, lunch, personal time)
      prisma.timeBlock.findMany({
        where: {
          businessId,
          ...(from && to ? { date: { gte: from, lte: to } } : {}),
        },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }]
      }),

      // Vacations (multi-day time off)
      prisma.vacation.findMany({
        where: {
          businessId,
          ...(from && to ? {
            OR: [
              { startDate: { gte: from, lte: to } },
              { endDate: { gte: from, lte: to } },
              { AND: [{ startDate: { lte: from } }, { endDate: { gte: to } }] }
            ]
          } : {})
        },
        orderBy: { startDate: 'asc' }
      })
    ]);

    // Transform to unified format
    const events = [
      // Slots (Published Gaps)
      ...slots.map(slot => {
        const activeBookings = slot.bookings.filter(b =>
          !['CANCELLED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_BUSINESS'].includes(b.status)
        );
        const hasBooking = activeBookings.length > 0;

        // DEBUG: Log booking data
        if (slot.bookings && slot.bookings.length > 0) {
          console.log('[Calendar API] Slot', slot.id, 'has', slot.bookings.length, 'total bookings');
          console.log('[Calendar API] Active bookings:', activeBookings.length);
          console.log('[Calendar API] Booking details:', activeBookings.map(b => ({
            id: b.id,
            status: b.status,
            customerName: b.customerName
          })));
        }

        // Calculate capacity dynamically
        const slotDuration = metricsService.calculateDuration(slot.startTime, slot.endTime);
        const serviceDuration = slot.service.durationMinutes;
        const capacity = metricsService.calculateSlotCapacity(slotDuration, serviceDuration);
        const bookedCount = activeBookings.length;

        return {
          id: `slot-${slot.id}`,
          originalId: slot.id,
          eventType: 'SLOT',
          businessId: slot.businessId,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          duration: slotDuration,
          title: slot.title || slot.service.name,
          serviceName: slot.service.name,
          serviceId: slot.serviceId,
          serviceDuration: serviceDuration,
          regularPrice: slot.regularPrice,
          dealPrice: slot.dealPrice,
          status: slot.status,
          note: slot.note,
          color: slot.color || '#10b981', // Green
          hasBooking,
          capacity,
          bookedCount,
          remainingCapacity: capacity - bookedCount,
          canModify: !hasBooking, // Can only modify if no booking
          bookings: activeBookings.map(b => ({
            id: b.id,
            customerName: b.customerName,
            customerPhone: b.customerPhone,
            serviceName: slot.service.name,
            startTime: slot.startTime,
            endTime: slot.endTime,
            price: b.price,
            status: b.status
          })),
          externalSource: slot.externalSource,
          externalId: slot.externalId
        };
      }),

      // Bookings (read-only in calendar)
      ...bookings.map(booking => ({
        id: `booking-${booking.id}`,
        originalId: booking.id,
        eventType: 'BOOKING',
        businessId: booking.businessId,
        date: booking.slot.date,
        startTime: booking.slot.startTime,
        endTime: booking.slot.endTime,
        title: `${booking.customerName}`,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        customerEmail: booking.customer?.email,
        serviceName: booking.service.name,
        price: booking.price,
        status: booking.status,
        color: '#3b82f6', // Blue
        canModify: false, // Bookings cannot be modified from calendar
        slotId: booking.slotId
      })),

      // Calendar Events
      ...calendarEvents.map(event => ({
        id: `event-${event.id}`,
        originalId: event.id,
        eventType: 'CALENDAR_EVENT',
        businessId: event.businessId,
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        title: event.title,
        description: event.description,
        customerName: event.customerName,
        customerPhone: event.customerPhone,
        isBlocker: event.isBlocker,
        isAllDay: event.isAllDay,
        location: event.location,
        notes: event.notes,
        color: event.color,
        category: event.category || event.eventType, // Category for icon mapping
        subType: event.eventType,
        canModify: true,
        externalSource: event.externalSource,
        externalId: event.externalId
      })),

      // Time Blocks
      ...timeBlocks.map(block => ({
        id: `block-${block.id}`,
        originalId: block.id,
        eventType: 'TIME_BLOCK',
        businessId: block.businessId,
        date: block.date,
        startTime: block.startTime,
        endTime: block.endTime,
        title: block.title,
        description: block.description,
        blockType: block.blockType,
        isRecurring: block.isRecurring,
        recurringPattern: block.recurringPattern ? JSON.parse(block.recurringPattern) : null,
        notes: block.notes,
        color: block.color,
        canModify: true,
        externalSource: block.externalSource,
        externalId: block.externalId
      })),
    ];

    // Calculate KPIs if viewing a single day
    let metrics = null;
    let heatMap = null;
    if (from === to) {
      metrics = await metricsService.getTodayMetrics(businessId, from);
      heatMap = await metricsService.getHeatMapData(businessId, from);
    }

    res.json({
      events: events.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.startTime.localeCompare(b.startTime);
      }),
      vacations: vacations.map(v => ({
        id: `vacation-${v.id}`,
        originalId: v.id,
        eventType: 'VACATION',
        businessId: v.businessId,
        startDate: v.startDate,
        endDate: v.endDate,
        title: v.title,
        description: v.description,
        notes: v.notes,
        color: v.color,
        canModify: true
      })),
      metrics,
      heatMap
    });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/calendar/:businessId/slots
 * Create a new slot (published gap)
 */
router.post('/:businessId/slots', auth(), requireRole('BUSINESS', 'ADMIN'), async (req, res, next) => {
  try {
    const businessId = Number(req.params.businessId);
    const { serviceId, date, startTime, endTime, regularPrice, dealPrice, note, title, color } = req.body;

    if (!serviceId || !date || !startTime || !endTime || !regularPrice) {
      return res.status(400).json({ message: 'serviceId, date, startTime, endTime, and regularPrice are required' });
    }

    if (!(await assertOwnBusiness(req.user, businessId))) {
      return res.status(403).json({ message: 'Forbidden for this business' });
    }

    // Check for conflicts
    const conflicts = await conflictService.checkSlotConflicts(businessId, date, startTime, endTime);
    if (conflicts.some(c => c.severity === 'ERROR')) {
      return res.status(409).json({ message: 'Slot conflicts detected', conflicts });
    }

    const slot = await prisma.slot.create({
      data: {
        businessId,
        serviceId: Number(serviceId),
        date,
        startTime,
        endTime,
        regularPrice: Number(regularPrice),
        dealPrice: dealPrice ? Number(dealPrice) : null,
        note,
        title,
        color: color || '#10b981',
        status: 'OPEN'
      },
      include: { service: true }
    });

    res.status(201).json(slot);
  } catch (e) {
    next(e);
  }
});

/**
 * PATCH /api/calendar/:businessId/slots/:id
 * Update a slot
 */
router.patch('/:businessId/slots/:id', auth(), requireRole('BUSINESS', 'ADMIN'), async (req, res, next) => {
  try {
    const businessId = Number(req.params.businessId);
    const slotId = Number(req.params.id);

    if (!(await assertOwnBusiness(req.user, businessId))) {
      return res.status(403).json({ message: 'Forbidden for this business' });
    }

    // Check if slot can be modified
    const modifyCheck = await conflictService.canModifySlot(slotId);
    if (!modifyCheck.canModify) {
      return res.status(403).json({ message: modifyCheck.reason, bookings: modifyCheck.bookings });
    }

    const existing = await prisma.slot.findUnique({ where: { id: slotId } });
    if (!existing || existing.businessId !== businessId) {
      return res.status(404).json({ message: 'Slot not found' });
    }

    // If time/date changed, check conflicts
    if (req.body.date || req.body.startTime || req.body.endTime) {
      const date = req.body.date || existing.date;
      const startTime = req.body.startTime || existing.startTime;
      const endTime = req.body.endTime || existing.endTime;

      const conflicts = await conflictService.checkSlotConflicts(businessId, date, startTime, endTime, slotId);
      if (conflicts.some(c => c.severity === 'ERROR')) {
        return res.status(409).json({ message: 'Slot conflicts detected', conflicts });
      }
    }

    const slot = await prisma.slot.update({
      where: { id: slotId },
      data: req.body,
      include: { service: true }
    });

    res.json(slot);
  } catch (e) {
    next(e);
  }
});

/**
 * DELETE /api/calendar/:businessId/slots/:id
 * Delete a slot (only if no booking exists)
 */
router.delete('/:businessId/slots/:id', auth(), requireRole('BUSINESS', 'ADMIN'), async (req, res, next) => {
  try {
    const businessId = Number(req.params.businessId);
    const slotId = Number(req.params.id);

    if (!(await assertOwnBusiness(req.user, businessId))) {
      return res.status(403).json({ message: 'Forbidden for this business' });
    }

    // Check if slot can be modified
    const modifyCheck = await conflictService.canModifySlot(slotId);
    if (!modifyCheck.canModify) {
      return res.status(403).json({ message: 'Cannot delete slot with active bookings', bookings: modifyCheck.bookings });
    }

    const existing = await prisma.slot.findUnique({ where: { id: slotId } });
    if (!existing || existing.businessId !== businessId) {
      return res.status(404).json({ message: 'Slot not found' });
    }

    await prisma.slot.delete({ where: { id: slotId } });
    res.json({ message: 'Slot deleted' });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/calendar/:businessId/calendar-events
 * Create a new calendar event
 */
router.post('/:businessId/calendar-events', auth(), requireRole('BUSINESS', 'ADMIN'), async (req, res, next) => {
  try {
    const businessId = Number(req.params.businessId);
    const {
      title,
      description,
      date,
      startTime,
      endTime,
      color = '#9ca3af',
      eventType = 'APPOINTMENT',
      customerName,
      customerPhone,
      customerEmail,
      isBlocker = true,
      isAllDay = false,
      location,
      notes
    } = req.body;

    if (!title || !date || (!isAllDay && (!startTime || !endTime))) {
      return res.status(400).json({ message: 'title, date, and time are required' });
    }

    if (!(await assertOwnBusiness(req.user, businessId))) {
      return res.status(403).json({ message: 'Forbidden for this business' });
    }

    // Check for conflicts
    if (!isAllDay) {
      await conflictService.checkCalendarEventConflicts(businessId, date, startTime, endTime);
      // Only show warnings, don't block creation
    }

    const event = await prisma.calendarEvent.create({
      data: {
        businessId,
        title,
        description,
        date,
        startTime: startTime || '00:00',
        endTime: endTime || '23:59',
        color,
        eventType,
        customerName,
        customerPhone,
        customerEmail,
        isBlocker,
        isAllDay,
        location,
        notes
      }
    });

    res.status(201).json(event);
  } catch (e) {
    next(e);
  }
});

/**
 * PATCH /api/calendar/:businessId/calendar-events/:id
 * Update a calendar event
 */
router.patch('/:businessId/calendar-events/:id', auth(), requireRole('BUSINESS', 'ADMIN'), async (req, res, next) => {
  try {
    const businessId = Number(req.params.businessId);
    const eventId = Number(req.params.id);

    if (!(await assertOwnBusiness(req.user, businessId))) {
      return res.status(403).json({ message: 'Forbidden for this business' });
    }

    const existing = await prisma.calendarEvent.findUnique({ where: { id: eventId } });
    if (!existing || existing.businessId !== businessId) {
      return res.status(404).json({ message: 'Calendar event not found' });
    }

    const event = await prisma.calendarEvent.update({
      where: { id: eventId },
      data: req.body
    });

    res.json(event);
  } catch (e) {
    next(e);
  }
});

/**
 * DELETE /api/calendar/:businessId/calendar-events/:id
 * Delete a calendar event
 */
router.delete('/:businessId/calendar-events/:id', auth(), requireRole('BUSINESS', 'ADMIN'), async (req, res, next) => {
  try {
    const businessId = Number(req.params.businessId);
    const eventId = Number(req.params.id);

    if (!(await assertOwnBusiness(req.user, businessId))) {
      return res.status(403).json({ message: 'Forbidden for this business' });
    }

    const existing = await prisma.calendarEvent.findUnique({ where: { id: eventId } });
    if (!existing || existing.businessId !== businessId) {
      return res.status(404).json({ message: 'Calendar event not found' });
    }

    await prisma.calendarEvent.delete({ where: { id: eventId } });
    res.json({ message: 'Calendar event deleted' });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/calendar/:businessId/time-blocks
 * Create a new time block
 */
router.post('/:businessId/time-blocks', auth(), requireRole('BUSINESS', 'ADMIN'), async (req, res, next) => {
  try {
    const businessId = Number(req.params.businessId);
    const {
      title,
      description,
      date,
      startTime,
      endTime,
      color = '#eab308',
      blockType = 'BREAK',
      isRecurring = false,
      recurringPattern,
      notes
    } = req.body;

    if (!title || !date || !startTime || !endTime) {
      return res.status(400).json({ message: 'title, date, startTime, and endTime are required' });
    }

    if (!(await assertOwnBusiness(req.user, businessId))) {
      return res.status(403).json({ message: 'Forbidden for this business' });
    }

    // Check for conflicts
    await conflictService.checkTimeBlockConflicts(businessId, date, startTime, endTime);
    // Only show warnings, don't block creation

    const block = await prisma.timeBlock.create({
      data: {
        businessId,
        title,
        description,
        date,
        startTime,
        endTime,
        color,
        blockType,
        isRecurring,
        recurringPattern: recurringPattern ? JSON.stringify(recurringPattern) : null,
        notes
      }
    });

    res.status(201).json(block);
  } catch (e) {
    next(e);
  }
});

/**
 * PATCH /api/calendar/:businessId/time-blocks/:id
 * Update a time block
 */
router.patch('/:businessId/time-blocks/:id', auth(), requireRole('BUSINESS', 'ADMIN'), async (req, res, next) => {
  try {
    const businessId = Number(req.params.businessId);
    const blockId = Number(req.params.id);

    if (!(await assertOwnBusiness(req.user, businessId))) {
      return res.status(403).json({ message: 'Forbidden for this business' });
    }

    const existing = await prisma.timeBlock.findUnique({ where: { id: blockId } });
    if (!existing || existing.businessId !== businessId) {
      return res.status(404).json({ message: 'Time block not found' });
    }

    const updateData = { ...req.body };
    if (req.body.recurringPattern) {
      updateData.recurringPattern = JSON.stringify(req.body.recurringPattern);
    }

    const block = await prisma.timeBlock.update({
      where: { id: blockId },
      data: updateData
    });

    res.json(block);
  } catch (e) {
    next(e);
  }
});

/**
 * DELETE /api/calendar/:businessId/time-blocks/:id
 * Delete a time block
 */
router.delete('/:businessId/time-blocks/:id', auth(), requireRole('BUSINESS', 'ADMIN'), async (req, res, next) => {
  try {
    const businessId = Number(req.params.businessId);
    const blockId = Number(req.params.id);

    if (!(await assertOwnBusiness(req.user, businessId))) {
      return res.status(403).json({ message: 'Forbidden for this business' });
    }

    const existing = await prisma.timeBlock.findUnique({ where: { id: blockId } });
    if (!existing || existing.businessId !== businessId) {
      return res.status(404).json({ message: 'Time block not found' });
    }

    await prisma.timeBlock.delete({ where: { id: blockId } });
    res.json({ message: 'Time block deleted' });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/calendar/:businessId/vacations
 * Create a new vacation
 */
router.post('/:businessId/vacations', auth(), requireRole('BUSINESS', 'ADMIN'), async (req, res, next) => {
  try {
    const businessId = Number(req.params.businessId);
    const {
      title,
      description,
      startDate,
      endDate,
      color = '#a855f7',
      notes
    } = req.body;

    if (!title || !startDate || !endDate) {
      return res.status(400).json({ message: 'title, startDate, and endDate are required' });
    }

    if (!(await assertOwnBusiness(req.user, businessId))) {
      return res.status(403).json({ message: 'Forbidden for this business' });
    }

    // Check for conflicts (slots and bookings)
    const conflicts = await conflictService.checkVacationConflicts(businessId, startDate, endDate);

    // If there are ERROR-level conflicts (bookings), don't allow creation
    const errorConflicts = conflicts.filter(c => c.severity === 'ERROR');
    if (errorConflicts.length > 0) {
      return res.status(409).json({
        message: 'Cannot create vacation: active bookings exist',
        conflicts: errorConflicts
      });
    }

    // Return warnings about open slots
    const warnings = conflicts.filter(c => c.severity === 'WARNING');

    const vacation = await prisma.vacation.create({
      data: {
        businessId,
        title,
        description,
        startDate,
        endDate,
        color,
        notes
      }
    });

    res.status(201).json({ vacation, warnings });
  } catch (e) {
    next(e);
  }
});

/**
 * PATCH /api/calendar/:businessId/vacations/:id
 * Update a vacation
 */
router.patch('/:businessId/vacations/:id', auth(), requireRole('BUSINESS', 'ADMIN'), async (req, res, next) => {
  try {
    const businessId = Number(req.params.businessId);
    const vacationId = Number(req.params.id);

    if (!(await assertOwnBusiness(req.user, businessId))) {
      return res.status(403).json({ message: 'Forbidden for this business' });
    }

    const existing = await prisma.vacation.findUnique({ where: { id: vacationId } });
    if (!existing || existing.businessId !== businessId) {
      return res.status(404).json({ message: 'Vacation not found' });
    }

    const vacation = await prisma.vacation.update({
      where: { id: vacationId },
      data: req.body
    });

    res.json(vacation);
  } catch (e) {
    next(e);
  }
});

/**
 * DELETE /api/calendar/:businessId/vacations/:id
 * Delete a vacation
 */
router.delete('/:businessId/vacations/:id', auth(), requireRole('BUSINESS', 'ADMIN'), async (req, res, next) => {
  try {
    const businessId = Number(req.params.businessId);
    const vacationId = Number(req.params.id);

    if (!(await assertOwnBusiness(req.user, businessId))) {
      return res.status(403).json({ message: 'Forbidden for this business' });
    }

    const existing = await prisma.vacation.findUnique({ where: { id: vacationId } });
    if (!existing || existing.businessId !== businessId) {
      return res.status(404).json({ message: 'Vacation not found' });
    }

    await prisma.vacation.delete({ where: { id: vacationId } });
    res.json({ message: 'Vacation deleted' });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/calendar/:businessId/convert
 * Convert event between types
 *
 * Supports:
 * - SLOT → CALENDAR_EVENT (customer called to book directly)
 * - CALENDAR_EVENT → SLOT (customer cancelled, republish the gap)
 * - TIME_BLOCK → SLOT (decided to open the time)
 */
router.post('/:businessId/convert', auth(), requireRole('BUSINESS', 'ADMIN'), async (req, res, next) => {
  try {
    const businessId = Number(req.params.businessId);
    const { fromType, fromId, toType, data } = req.body;

    if (!fromType || !fromId || !toType) {
      return res.status(400).json({ message: 'fromType, fromId, and toType are required' });
    }

    if (!(await assertOwnBusiness(req.user, businessId))) {
      return res.status(403).json({ message: 'Forbidden for this business' });
    }

    // SLOT → CALENDAR_EVENT
    if (fromType === 'SLOT' && toType === 'CALENDAR_EVENT') {
      const slot = await prisma.slot.findUnique({
        where: { id: fromId },
        include: { service: true }
      });

      if (!slot || slot.businessId !== businessId) {
        return res.status(404).json({ message: 'Slot not found' });
      }

      // Check if slot can be modified
      const modifyCheck = await conflictService.canModifySlot(fromId);
      if (!modifyCheck.canModify) {
        return res.status(403).json({ message: 'Cannot convert slot with active bookings' });
      }

      // Create calendar event
      const event = await prisma.calendarEvent.create({
        data: {
          businessId,
          title: data.title || `${slot.service.name} (תור טלפוני)`,
          description: data.description,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          color: data.color || '#9ca3af',
          eventType: data.eventType || 'PHONE_BOOKING',
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          isBlocker: true,
          notes: slot.note
        }
      });

      // Delete slot
      await prisma.slot.delete({ where: { id: fromId } });

      return res.json({ message: 'Converted slot to calendar event', event });
    }

    // CALENDAR_EVENT → SLOT
    if (fromType === 'CALENDAR_EVENT' && toType === 'SLOT') {
      const event = await prisma.calendarEvent.findUnique({ where: { id: fromId } });

      if (!event || event.businessId !== businessId) {
        return res.status(404).json({ message: 'Calendar event not found' });
      }

      if (!data.serviceId || !data.regularPrice) {
        return res.status(400).json({ message: 'serviceId and regularPrice are required for slot creation' });
      }

      // Check for conflicts
      const conflicts = await conflictService.checkSlotConflicts(businessId, event.date, event.startTime, event.endTime);
      if (conflicts.some(c => c.severity === 'ERROR')) {
        return res.status(409).json({ message: 'Slot conflicts detected', conflicts });
      }

      // Create slot
      const slot = await prisma.slot.create({
        data: {
          businessId,
          serviceId: Number(data.serviceId),
          date: event.date,
          startTime: event.startTime,
          endTime: event.endTime,
          regularPrice: Number(data.regularPrice),
          dealPrice: data.dealPrice ? Number(data.dealPrice) : null,
          note: event.notes,
          title: event.title,
          status: 'OPEN'
        },
        include: { service: true }
      });

      // Delete calendar event
      await prisma.calendarEvent.delete({ where: { id: fromId } });

      return res.json({ message: 'Converted calendar event to slot', slot });
    }

    // TIME_BLOCK → SLOT
    if (fromType === 'TIME_BLOCK' && toType === 'SLOT') {
      const block = await prisma.timeBlock.findUnique({ where: { id: fromId } });

      if (!block || block.businessId !== businessId) {
        return res.status(404).json({ message: 'Time block not found' });
      }

      if (!data.serviceId || !data.regularPrice) {
        return res.status(400).json({ message: 'serviceId and regularPrice are required for slot creation' });
      }

      // Check for conflicts
      const conflicts = await conflictService.checkSlotConflicts(businessId, block.date, block.startTime, block.endTime);
      if (conflicts.some(c => c.severity === 'ERROR')) {
        return res.status(409).json({ message: 'Slot conflicts detected', conflicts });
      }

      // Create slot
      const slot = await prisma.slot.create({
        data: {
          businessId,
          serviceId: Number(data.serviceId),
          date: block.date,
          startTime: block.startTime,
          endTime: block.endTime,
          regularPrice: Number(data.regularPrice),
          dealPrice: data.dealPrice ? Number(data.dealPrice) : null,
          note: block.notes,
          title: block.title,
          status: 'OPEN'
        },
        include: { service: true }
      });

      // Delete time block
      await prisma.timeBlock.delete({ where: { id: fromId } });

      return res.json({ message: 'Converted time block to slot', slot });
    }

    res.status(400).json({ message: 'Invalid conversion type' });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/calendar/:businessId/check-conflicts
 * Check for conflicts before creating/editing an event
 */
router.post('/:businessId/check-conflicts', auth(), async (req, res, next) => {
  try {
    const businessId = Number(req.params.businessId);
    const { eventType, date, startTime, endTime, excludeId } = req.body;

    if (!eventType || !date || !startTime || !endTime) {
      return res.status(400).json({ message: 'eventType, date, startTime, and endTime are required' });
    }

    if (!(await assertOwnBusiness(req.user, businessId))) {
      return res.status(403).json({ message: 'Forbidden for this business' });
    }

    let conflicts = [];

    switch (eventType) {
      case 'SLOT':
        conflicts = await conflictService.checkSlotConflicts(businessId, date, startTime, endTime, excludeId);
        break;
      case 'CALENDAR_EVENT':
        conflicts = await conflictService.checkCalendarEventConflicts(businessId, date, startTime, endTime, excludeId);
        break;
      case 'TIME_BLOCK':
        conflicts = await conflictService.checkTimeBlockConflicts(businessId, date, startTime, endTime, excludeId);
        break;
      default:
        return res.status(400).json({ message: 'Invalid event type' });
    }

    res.json({ conflicts });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
