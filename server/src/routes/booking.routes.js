/**
 * Booking Routes - Epic 2 Sprint C
 *
 * Implements atomic booking creation with row locking, legal time validation,
 * status management, cancellation, and reschedule.
 */

const router = require('express').Router();
const prisma = require('../lib/prisma');
const { auth, requireRole } = require('../middleware/auth');
const { getLegalStartTimes } = require('../services/slotAvailability.service');
const { recalculateSlotStatus } = require('../services/slotStatus.service');
const { ACTIVE_BOOKING_STATUSES, CANCELLED_BOOKING_STATUSES } = require('../constants/bookingStatuses');
const {
  canCustomerRescheduleBooking,
  getRescheduleBlockedReasonMessage,
  RESCHEDULABLE_BOOKING_STATUSES
} = require('../lib/bookingLifecycle');

/**
 * Helper: Calculate end time from start time and duration
 */
function calculateEndTime(startTime, durationMinutes) {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
}

/**
 * Helper: Parse time string to minutes
 */
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * GET /bookings - List bookings with role-based access control
 */
router.get('/', auth(), async (req, res, next) => {
  try {
    const where = {};

    // Role-based access control
    if (req.user.role === 'CUSTOMER') {
      // CUSTOMER: Can only see their own bookings
      where.customerId = req.user.id;

    } else if (req.user.role === 'SERVICE_PROVIDER' || req.user.role === 'BUSINESS') {
      // SERVICE_PROVIDER/BUSINESS: Can only see bookings for businesses they own

      // Get all businesses owned by this user
      const ownedBusinesses = await prisma.business.findMany({
        where: { ownerId: req.user.id },
        select: { id: true }
      });

      const ownedBusinessIds = ownedBusinesses.map(b => b.id);

      if (ownedBusinessIds.length === 0) {
        // User owns no businesses, return empty array
        return res.json([]);
      }

      // If businessId filter is provided, verify ownership
      if (req.query.businessId) {
        const requestedBusinessId = Number(req.query.businessId);
        if (!ownedBusinessIds.includes(requestedBusinessId)) {
          // User doesn't own this business
          return res.status(403).json({ message: 'Forbidden: You do not own this business' });
        }
        where.businessId = requestedBusinessId;
      } else {
        // No specific business requested, filter to all owned businesses
        where.businessId = { in: ownedBusinessIds };
      }

    } else if (req.user.role === 'ADMIN') {
      // ADMIN: Can see all bookings, apply optional filters
      if (req.query.businessId) {
        where.businessId = Number(req.query.businessId);
      }
      if (req.query.customerId) {
        where.customerId = Number(req.query.customerId);
      }

    } else {
      // Unknown role, deny access
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Optional slot filter (available to all roles)
    if (req.query.slotId) {
      where.slotId = Number(req.query.slotId);
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        business: true,
        businessService: {
          include: { serviceTemplate: true }
        },
        slot: true,
        customer: {
          select: { id: true, fullName: true, phone: true, email: true }
        }
      },
      orderBy: [
        { createdAt: 'desc' }
      ]
    });

    res.json(bookings);
  } catch (e) {
    next(e);
  }
});

/**
 * GET /bookings/:id - Get single booking details (CUSTOMER-only)
 * Service providers should use /api/service-provider/bookings/:id instead
 */
router.get('/:id', auth(), requireRole('CUSTOMER'), async (req, res, next) => {
  try {
    const bookingId = Number(req.params.id);

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        business: {
          select: {
            id: true,
            publicId: true,
            name: true,
            phone: true,
            city: true,
            cityNameHebrew: true,
            street: true,
            streetNameHebrew: true,
            houseNumber: true,
            formattedAddress: true,
            status: true
          }
        },
        businessService: {
          include: {
            serviceTemplate: {
              select: {
                id: true,
                name: true,
                defaultDurationMinutes: true
              }
            }
          }
        },
        slot: {
          select: {
            id: true,
            publicId: true,
            date: true,
            startTime: true,
            endTime: true,
            status: true
          }
        },
        customer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true
          }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // CUSTOMER can only see their own bookings
    if (booking.customerId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Add reschedule readiness metadata
    const reschedulePolicy = canCustomerRescheduleBooking(booking, req.user.id);
    const bookingWithReschedule = {
      ...booking,
      reschedule: {
        canReschedule: reschedulePolicy.canReschedule,
        blockedReason: reschedulePolicy.blockedReason,
        blockedReasonMessage: reschedulePolicy.blockedReason
          ? getRescheduleBlockedReasonMessage(reschedulePolicy.blockedReason)
          : null,
        allowedStatuses: RESCHEDULABLE_BOOKING_STATUSES
      }
    };

    res.json(bookingWithReschedule);
  } catch (e) {
    next(e);
  }
});

/**
 * GET /bookings/:id/reschedule-options - Get reschedule options for a booking
 * CUSTOMER-only endpoint that returns available alternative times
 * Does NOT mutate the booking or reserve slots
 */
router.get('/:id/reschedule-options', auth(), requireRole('CUSTOMER'), async (req, res, next) => {
  try {
    const bookingId = Number(req.params.id);
    const { startDate, endDate, limit = 50 } = req.query;

    // Get booking with all necessary relationships
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        business: true,
        businessService: {
          include: {
            serviceTemplate: true
          }
        },
        slot: true
      }
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify ownership
    if (booking.customerId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Check reschedule eligibility
    const reschedulePolicy = canCustomerRescheduleBooking(booking, req.user.id);
    if (!reschedulePolicy.canReschedule) {
      return res.status(400).json({
        message: getRescheduleBlockedReasonMessage(reschedulePolicy.blockedReason),
        blockedReason: reschedulePolicy.blockedReason
      });
    }

    // Determine service duration
    const durationMinutes = booking.businessService?.serviceTemplate?.defaultDurationMinutes
      || booking.businessService?.durationMinutes
      || 30;

    // Calculate date range (default to next 14 days)
    const today = new Date().toISOString().split('T')[0];
    const defaultEndDate = new Date();
    defaultEndDate.setDate(defaultEndDate.getDate() + 14);
    const dateStart = startDate || today;
    const dateEnd = endDate || defaultEndDate.toISOString().split('T')[0];

    // Find available slots for the same business and service
    const availableSlots = await prisma.slot.findMany({
      where: {
        businessId: booking.businessId,
        date: {
          gte: dateStart,
          lte: dateEnd
        },
        status: {
          in: ['OPEN', 'PARTIALLY_BOOKED']
        },
        allowedServices: {
          some: {
            businessServiceId: booking.businessServiceId
          }
        }
      },
      include: {
        allowedServices: {
          where: {
            businessServiceId: booking.businessServiceId
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ],
      take: Number(limit)
    });

    // Build options array with legal start times for each slot
    const options = [];
    for (const slot of availableSlots) {
      // Skip the current slot (customer already has this time)
      if (slot.id === booking.slotId) {
        continue;
      }

      try {
        // Use transaction for legal time calculation
        const legalTimes = await prisma.$transaction(async (tx) => {
          return getLegalStartTimes(tx, slot.id, booking.businessServiceId, bookingId);
        });

        // Add each legal time as an option
        for (const legalTime of legalTimes) {
          const startTime = typeof legalTime === 'string' ? legalTime : legalTime.startTime;

          // Calculate end time
          const [hours, minutes] = startTime.split(':').map(Number);
          const totalMinutes = hours * 60 + minutes + durationMinutes;
          const endHours = Math.floor(totalMinutes / 60);
          const endMinutes = totalMinutes % 60;
          const endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;

          options.push({
            slotId: slot.id,
            date: slot.date,
            slotStartTime: slot.startTime,
            slotEndTime: slot.endTime,
            startTime,
            endTime,
            price: booking.businessService?.regularPrice || booking.price
          });
        }
      } catch (err) {
        // Skip slots with errors (e.g., calculation issues)
        console.error(`Error calculating legal times for slot ${slot.id}:`, err.message);
        continue;
      }
    }

    // Return response
    res.json({
      bookingId: booking.id,
      businessId: booking.businessId,
      businessServiceId: booking.businessServiceId,
      serviceName: booking.businessService?.name || 'שירות',
      durationMinutes,
      current: {
        slotId: booking.slotId,
        date: booking.slot?.date,
        startTime: booking.startTime,
        endTime: booking.endTime
      },
      options,
      policy: {
        canReschedule: true,
        blockedReason: null
      }
    });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /bookings - Create booking with atomic locking and legal time validation
 * Requires authenticated CUSTOMER role
 */
router.post('/', auth(), requireRole('CUSTOMER'), async (req, res, next) => {
  try {
    const {
      slotId,
      businessServiceId,
      startTime,
      customerName,
      customerPhone,
      customerEmail,
      customerNote
    } = req.body;

    // Validation: User must be authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        message: 'Authentication required'
      });
    }

    // Validation
    if (!slotId || !businessServiceId || !startTime || !customerName || !customerPhone) {
      return res.status(400).json({
        message: 'slotId, businessServiceId, startTime, customerName, customerPhone are required'
      });
    }

    // Execute in transaction with row locking
    const result = await prisma.$transaction(async (tx) => {
      // 1. Lock the slot row using SELECT ... FOR UPDATE
      const slot = await tx.$queryRaw`
        SELECT * FROM "Slot"
        WHERE "id" = ${Number(slotId)}
        FOR UPDATE
      `;

      if (!slot || slot.length === 0) {
        const err = new Error('Slot not found');
        err.status = 404;
        throw err;
      }

      const lockedSlot = slot[0];

      // 2. Get full slot details with allowed services
      const slotDetails = await tx.slot.findUnique({
        where: { id: Number(slotId) },
        include: {
          allowedServices: {
            where: { businessServiceId: Number(businessServiceId) },
            include: {
              businessService: {
                include: { serviceTemplate: true }
              }
            }
          }
        }
      });

      // 3. Verify service is allowed in this slot
      if (!slotDetails.allowedServices || slotDetails.allowedServices.length === 0) {
        const err = new Error('השירות הזה לא זמין בתור הזה');
        err.status = 400;
        throw err;
      }

      const allowedService = slotDetails.allowedServices[0];
      const businessService = allowedService.businessService;

      // Get service duration
      const durationMinutes = businessService.serviceTemplate
        ? businessService.serviceTemplate.defaultDurationMinutes
        : businessService.durationMinutes;

      // 4. Recalculate legal start times inside transaction
      const legalTimes = await getLegalStartTimes(
        tx,
        Number(slotId),
        Number(businessServiceId),
        null // no excludeBookingId for new booking
      );

      // 5. Verify requested time is legal
      const requestedTime = startTime;
      const isLegal = legalTimes.some(t => {
        const tStr = typeof t === 'string' ? t : t.startTime;
        return tStr === requestedTime;
      });

      if (!isLegal) {
        const err = new Error('השעה המבוקשת כבר לא זמינה. אנא רענן את הדף ובחר שעה אחרת');
        err.status = 409;
        err.availableTimes = legalTimes.map(t => typeof t === 'string' ? t : t.startTime);
        throw err;
      }

      // 6. Calculate end time
      const endTime = calculateEndTime(startTime, durationMinutes);

      // 7. Create booking
      const booking = await tx.booking.create({
        data: {
          customerId: req.user.id,
          businessId: lockedSlot.businessId,
          businessServiceId: Number(businessServiceId),
          slotId: Number(slotId),
          startTime,
          endTime,
          price: businessService.regularPrice,
          customerName,
          customerPhone,
          customerNote,
          status: 'PENDING'
        }
      });

      // 8. Recalculate slot status
      await recalculateSlotStatus(tx, Number(slotId));

      // 9. Return complete booking with all fields
      return tx.booking.findUnique({
        where: { id: booking.id },
        include: {
          businessService: {
            include: { serviceTemplate: true }
          },
          slot: true,
          business: true
        }
      });
    }, {
      timeout: 10000, // 10 second timeout
      isolationLevel: 'Serializable' // Highest isolation level for concurrency safety
    });

    res.status(201).json(result);
  } catch (e) {
    // Enhanced error handling for conflicts
    if (e.status === 409) {
      return res.status(409).json({
        message: e.message,
        availableTimes: e.availableTimes
      });
    }

    // Handle Postgres serialization failures from concurrent bookings
    if (e.code === '40001' || e.message?.includes('could not serialize')) {
      return res.status(409).json({
        message: 'השעה המבוקשת כבר לא זמינה. אנא רענן את הדף ובחר שעה אחרת'
      });
    }

    next(e);
  }
});

/**
 * PATCH /bookings/:id/status - Update booking status
 */
router.patch('/:id/status', auth(), requireRole('BUSINESS', 'SERVICE_PROVIDER', 'ADMIN'), async (req, res, next) => {
  try {
    const bookingId = Number(req.params.id);
    const { status } = req.body;

    // Validate status
    const validStatuses = [
      'CONFIRMED',
      'REJECTED',
      'CANCELLED_BY_BUSINESS',
      'COMPLETED',
      'NO_SHOW'
    ];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Valid status required: ${validStatuses.join(', ')}`
      });
    }

    // Get booking and verify ownership
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { business: true }
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Prevent modification of terminal states (Bundle 6: Hardening)
    const terminalStatuses = ['COMPLETED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_BUSINESS', 'CANCELLED', 'NO_SHOW', 'REJECTED'];
    if (terminalStatuses.includes(booking.status)) {
      return res.status(400).json({
        message: `Cannot modify booking in ${booking.status} state. Terminal states cannot be changed.`
      });
    }

    // Authorization check
    if (req.user.role !== 'ADMIN') {
      const business = await prisma.business.findUnique({
        where: { id: booking.businessId }
      });

      if (!business || business.ownerId !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }

    // Update booking in transaction
    const result = await prisma.$transaction(async (tx) => {
      const updateData = { status };

      // Set timestamps based on status
      if (status === 'CONFIRMED') {
        updateData.confirmedAt = new Date();
      } else if (CANCELLED_BOOKING_STATUSES.includes(status)) {
        updateData.cancelledAt = new Date();
      }

      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: updateData
      });

      // Recalculate slot status if booking was cancelled/rejected
      if (CANCELLED_BOOKING_STATUSES.includes(status)) {
        await recalculateSlotStatus(tx, booking.slotId);
      }

      // Return complete booking with all fields
      return tx.booking.findUnique({
        where: { id: bookingId },
        include: {
          businessService: {
            include: { serviceTemplate: true }
          },
          slot: true,
          business: true
        }
      });
    });

    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * PATCH /bookings/:id/cancel - Cancel booking
 * Requires authentication. Guest cancellation not allowed without token/code mechanism.
 */
router.patch('/:id/cancel', auth(), async (req, res, next) => {
  try {
    const bookingId = Number(req.params.id);

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { business: true }
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Prevent cancellation of terminal states (Bundle 6: Hardening)
    const nonCancellableStatuses = ['COMPLETED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_BUSINESS', 'CANCELLED', 'NO_SHOW', 'REJECTED'];
    if (nonCancellableStatuses.includes(booking.status)) {
      return res.status(400).json({
        message: `Cannot cancel booking in ${booking.status} state. Booking is already finalized.`
      });
    }

    // Determine cancellation type based on user role
    let status = 'CANCELLED_BY_CUSTOMER';

    if (req.user.role === 'ADMIN') {
      status = 'CANCELLED_BY_BUSINESS';
    } else if (req.user.role === 'BUSINESS' || req.user.role === 'SERVICE_PROVIDER') {
      // Verify ownership
      const business = await prisma.business.findUnique({
        where: { id: booking.businessId }
      });

      if (!business || business.ownerId !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      status = 'CANCELLED_BY_BUSINESS';
    } else if (req.user.role === 'CUSTOMER') {
      // Verify customer owns this booking
      if (booking.customerId !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status,
          cancelledAt: new Date()
        }
      });

      // Recalculate slot status to potentially reopen
      await recalculateSlotStatus(tx, booking.slotId);

      // Return complete booking with all fields
      return tx.booking.findUnique({
        where: { id: bookingId },
        include: {
          businessService: {
            include: { serviceTemplate: true }
          },
          slot: true,
          business: true
        }
      });
    });

    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * PATCH /bookings/:id/reschedule - Reschedule booking atomically
 * Requires authentication. Guest reschedule not allowed without token/code mechanism.
 */
router.patch('/:id/reschedule', auth(), async (req, res, next) => {
  try {
    const bookingId = Number(req.params.id);
    const { newSlotId, newBusinessServiceId, newStartTime } = req.body;

    if (!newSlotId || !newBusinessServiceId || !newStartTime) {
      return res.status(400).json({
        message: 'newSlotId, newBusinessServiceId, newStartTime are required'
      });
    }

    // Get original booking
    const originalBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { business: true }
    });

    if (!originalBooking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Authorization: Customer can only manage own bookings, Provider can manage business bookings
    if (req.user.role === 'CUSTOMER' && originalBooking.customerId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    } else if (req.user.role === 'BUSINESS' || req.user.role === 'SERVICE_PROVIDER') {
      const business = await prisma.business.findUnique({
        where: { id: originalBooking.businessId }
      });

      if (!business || business.ownerId !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }

    // Execute reschedule in transaction
    const result = await prisma.$transaction(async (tx) => {
      const oldSlotId = originalBooking.slotId;
      const newSlotIdNum = Number(newSlotId);

      // Lock both slots one-by-one in deterministic order to prevent deadlocks
      // Collect unique slot IDs and sort ascending
      const slotIdsSet = new Set([oldSlotId, newSlotIdNum]);
      const slotIds = Array.from(slotIdsSet).sort((a, b) => a - b);

      // Lock each slot individually in order
      for (const slotId of slotIds) {
        await tx.$queryRaw`
          SELECT * FROM "Slot"
          WHERE "id" = ${slotId}
          FOR UPDATE
        `;
      }

      // Get new slot details
      const newSlot = await tx.slot.findUnique({
        where: { id: newSlotIdNum },
        include: {
          allowedServices: {
            where: { businessServiceId: Number(newBusinessServiceId) },
            include: {
              businessService: {
                include: { serviceTemplate: true }
              }
            }
          }
        }
      });

      if (!newSlot) {
        const err = new Error('New slot not found');
        err.status = 404;
        throw err;
      }

      // Verify service is allowed
      if (!newSlot.allowedServices || newSlot.allowedServices.length === 0) {
        const err = new Error('השירות הזה לא זמין בתור החדש');
        err.status = 400;
        throw err;
      }

      const businessService = newSlot.allowedServices[0].businessService;
      const durationMinutes = businessService.serviceTemplate
        ? businessService.serviceTemplate.defaultDurationMinutes
        : businessService.durationMinutes;

      // Get legal times for new slot, excluding THIS booking
      const legalTimes = await getLegalStartTimes(
        tx,
        newSlotIdNum,
        Number(newBusinessServiceId),
        bookingId // Exclude this booking so it doesn't block itself
      );

      // Verify new time is legal
      const isLegal = legalTimes.some(t => {
        const tStr = typeof t === 'string' ? t : t.startTime;
        return tStr === newStartTime;
      });

      if (!isLegal) {
        const err = new Error('השעה החדשה לא זמינה');
        err.status = 409;
        err.availableTimes = legalTimes.map(t => typeof t === 'string' ? t : t.startTime);
        throw err;
      }

      // Calculate new end time
      const newEndTime = calculateEndTime(newStartTime, durationMinutes);

      // Update booking
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          slotId: newSlotIdNum,
          businessServiceId: Number(newBusinessServiceId),
          startTime: newStartTime,
          endTime: newEndTime,
          price: businessService.regularPrice
        }
      });

      // Recalculate status for BOTH old and new slots
      await recalculateSlotStatus(tx, oldSlotId, bookingId);
      await recalculateSlotStatus(tx, newSlotIdNum);

      // Return complete booking with all fields
      return tx.booking.findUnique({
        where: { id: bookingId },
        include: {
          businessService: {
            include: { serviceTemplate: true }
          },
          slot: true,
          business: true
        }
      });

    }, {
      timeout: 10000,
      isolationLevel: 'Serializable'
    });

    res.json(result);
  } catch (e) {
    if (e.status === 409) {
      return res.status(409).json({
        message: e.message,
        availableTimes: e.availableTimes
      });
    }
    next(e);
  }
});

module.exports = router;
