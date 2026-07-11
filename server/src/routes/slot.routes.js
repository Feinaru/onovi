const router = require('express').Router();
const prisma = require('../lib/prisma');
const { auth, requireRole } = require('../middleware/auth');
const { getLegalStartTimes } = require('../services/slotAvailability.service');

async function assertOwnBusiness(user, businessId) {
  if (user.role === 'ADMIN') return true;
  const business = await prisma.business.findUnique({ where: { id: Number(businessId) } });
  return business && business.ownerId === user.id;
}

/**
 * GET /slots - Customer slot discovery
 *
 * ⚠️ CRITICAL BUSINESS RULE: Opt-In Availability Model
 * ====================================================
 * Customers should ONLY see explicitly published slots.
 *
 * ✅ DO: Show slots with status: OPEN (explicitly published by business)
 * ❌ DON'T: Calculate availability from working hours
 * ❌ DON'T: Show external appointments
 * ❌ DON'T: Auto-generate slots from calendar
 *
 * Lomea is a gap-filling platform, not a general booking platform.
 * See: /AVAILABILITY_MODEL.md for full documentation
 *
 * Epic 2 - Sprint B: Now includes allowed services for multi-booking support
 */
router.get('/', async (req, res, next) => {
  try {
    const { categoryId, city, cityCode, date, includeAll } = req.query;

    console.log('[SlotRoutes] GET /slots query params:', JSON.stringify({ categoryId, city, cityCode, date, includeAll }));

    // CRITICAL: Only show OPEN slots to customers (unless includeAll for admin/business)
    const where = includeAll === 'true' ? {} : { status: 'OPEN' };
    if (date) {
      where.date = date;
    } else if (includeAll !== 'true') {
      // Filter out past dates for customer-facing queries (unless includeAll for admin/business)
      const today = new Date().toISOString().split('T')[0];
      where.date = { gte: today };
    }

    // Build business filter
    if (cityCode || city || categoryId) {
      where.business = {};

      // PREFER cityCode over city name (cityCode is more reliable)
      if (cityCode) {
        where.business.cityCode = Number(cityCode);
        console.log('[SlotRoutes] Filtering by cityCode:', cityCode);
      } else if (city) {
        // Fallback to city name for backwards compatibility
        where.business.city = city;
        console.log('[SlotRoutes] WARNING: Filtering by city name (deprecated):', city);
      }

      if (categoryId) {
        where.business.categoryId = Number(categoryId);
      }
    }

    console.log('[SlotRoutes] Prisma where clause:', JSON.stringify(where, null, 2));

    // Get all slots (before filter for debugging)
    const allSlots = await prisma.slot.findMany({
      where: includeAll === 'true' ? {} : { status: 'OPEN' },
      include: {
        business: { include: { category: true } },
        service: true,
        allowedServices: {
          include: {
            businessService: {
              include: { serviceTemplate: true }
            }
          }
        }
      },
    });

    console.log('[SlotRoutes] Total slots in DB (status filter only):', allSlots.length);

    // Get filtered slots
    const slots = await prisma.slot.findMany({
      where,
      include: {
        business: { include: { category: true } },
        service: true,
        allowedServices: {
          include: {
            businessService: {
              include: { serviceTemplate: true }
            }
          }
        }
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }]
    });

    console.log('[SlotRoutes] Slots after all filters:', slots.length);

    // Debug: Show business cities and cityCodes
    if (cityCode || city) {
      const businessInfo = slots.map(s => ({
        businessId: s.business.id,
        businessName: s.business.name,
        city: s.business.city,
        cityCode: s.business.cityCode,
        cityNameHebrew: s.business.cityNameHebrew
      }));
      console.log('[SlotRoutes] Business info in results:', JSON.stringify(businessInfo, null, 2));

      // Show what was filtered out
      const filteredOutCount = allSlots.length - slots.length;
      if (filteredOutCount > 0) {
        console.log('[SlotRoutes] Filtered out', filteredOutCount, 'slots');
        const filteredOut = allSlots.filter(s => !slots.find(slot => slot.id === s.id));
        const filteredBusinesses = filteredOut.map(s => ({
          businessName: s.business.name,
          city: s.business.city,
          cityCode: s.business.cityCode
        }));
        console.log('[SlotRoutes] Filtered out businesses:', JSON.stringify(filteredBusinesses, null, 2));
      }
    }

    // Format response to include allowed services
    const slotsWithServices = slots.map(slot => ({
      ...slot,
      allowedServices: slot.allowedServices.map(as => ({
        id: as.businessService.id,
        name: as.businessService.name,
        durationMinutes: as.businessService.durationMinutes,
        regularPrice: as.businessService.regularPrice,
        serviceTemplateId: as.businessService.serviceTemplateId
      }))
    }));

    res.json(slotsWithServices);
  } catch (e) { next(e); }
});

/**
 * POST /slots - Business explicitly publishes a slot
 *
 * This is the ONLY way slots become visible to customers.
 * The business owner manually creates each slot - this is an opt-in action.
 *
 * Typical use cases:
 * - Last-minute cancellation → publish the gap with a discount
 * - Unexpected free time → publish to fill the slot
 * - Slow hours → publish with special pricing
 *
 * This is NOT for:
 * - Syncing working hours
 * - Auto-generating availability
 * - Importing calendar events
 *
 * Epic 2 - Sprint B: Now supports allowedServiceIds for multi-booking
 *
 * IMPORTANT: serviceId is kept ONLY for backward compatibility with legacy slots.
 * New flow should use allowedServiceIds (array of BusinessService IDs).
 */
router.post('/', auth(), requireRole('BUSINESS', 'SERVICE_PROVIDER', 'ADMIN'), async (req, res, next) => {
  try {
    const { businessId, serviceId, date, startTime, endTime, regularPrice, dealPrice, note, allowedServiceIds } = req.body;
    if (!businessId || !date || !startTime || !endTime || !regularPrice) {
      return res.status(400).json({ message: 'businessId, date, startTime, endTime and regularPrice are required' });
    }
    if (regularPrice <= 0) return res.status(400).json({ message: 'regularPrice must be positive' });
    if (startTime >= endTime) return res.status(400).json({ message: 'startTime must be before endTime' });
    if (!(await assertOwnBusiness(req.user, businessId))) return res.status(403).json({ message: 'Forbidden for this business' });

    // Epic 2 - Sprint B: Validate and prepare allowedServiceIds
    let allowedServiceIdsToUse = allowedServiceIds;

    // If no allowedServiceIds provided, default to all active + customer-visible services
    if (!allowedServiceIdsToUse || allowedServiceIdsToUse.length === 0) {
      const activeServices = await prisma.businessService.findMany({
        where: {
          businessId: Number(businessId),
          active: true,
          visibleToCustomers: true,
          approvalStatus: 'APPROVED'
        },
        select: { id: true }
      });
      allowedServiceIdsToUse = activeServices.map(s => s.id);
    } else {
      // Validate all allowedServiceIds belong to this business and are active + visible
      const serviceIds = allowedServiceIdsToUse.map(id => Number(id));
      const validServices = await prisma.businessService.findMany({
        where: {
          id: { in: serviceIds },
          businessId: Number(businessId),
          active: true,
          visibleToCustomers: true
        },
        select: { id: true }
      });

      if (validServices.length !== serviceIds.length) {
        return res.status(400).json({
          message: 'Invalid allowedServiceIds: all services must belong to this business and be active + visible to customers'
        });
      }
    }

    // Determine serviceId for legacy compatibility
    // Use first allowed service or provided serviceId
    const legacyServiceId = serviceId || (allowedServiceIdsToUse.length > 0 ? allowedServiceIdsToUse[0] : null);

    if (!legacyServiceId) {
      return res.status(400).json({ message: 'No services available for this slot. Please add services to your business first.' });
    }

    // Create slot with status: OPEN by default (immediately visible to customers)
    const slot = await prisma.slot.create({
      data: {
        businessId: Number(businessId),
        serviceId: Number(legacyServiceId), // Legacy field for backward compatibility
        date,
        startTime,
        endTime,
        regularPrice: Number(regularPrice),
        dealPrice: dealPrice ? Number(dealPrice) : null,
        note
      }
    });

    // Epic 2 - Sprint B: Create SlotAllowedService records
    if (allowedServiceIdsToUse && allowedServiceIdsToUse.length > 0) {
      await prisma.slotAllowedService.createMany({
        data: allowedServiceIdsToUse.map(sid => ({
          slotId: slot.id,
          businessServiceId: Number(sid)
        }))
      });
    }

    // Fetch and return slot with allowed services
    const slotWithServices = await prisma.slot.findUnique({
      where: { id: slot.id },
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

    res.status(201).json(slotWithServices);
  } catch (e) { next(e); }
});

router.patch('/:id', auth(), requireRole('BUSINESS', 'SERVICE_PROVIDER', 'ADMIN'), async (req, res, next) => {
  try {
    const slotId = Number(req.params.id);
    const { date, startTime, endTime, regularPrice, dealPrice, note, status } = req.body;

    const existing = await prisma.slot.findUnique({ where: { id: slotId }, include: { business: true } });
    if (!existing) return res.status(404).json({ message: 'Slot not found' });
    if (!(await assertOwnBusiness(req.user, existing.businessId))) return res.status(403).json({ message: 'Forbidden for this business' });

    const updateData = {};
    if (date !== undefined) updateData.date = date;
    if (startTime !== undefined) updateData.startTime = startTime;
    if (endTime !== undefined) updateData.endTime = endTime;
    if (regularPrice !== undefined) {
      if (regularPrice <= 0) return res.status(400).json({ message: 'regularPrice must be positive' });
      updateData.regularPrice = Number(regularPrice);
    }
    if (dealPrice !== undefined) updateData.dealPrice = dealPrice ? Number(dealPrice) : null;
    if (note !== undefined) updateData.note = note;
    if (status !== undefined) updateData.status = status;

    // Validate time range if both are being updated
    const finalStartTime = startTime !== undefined ? startTime : existing.startTime;
    const finalEndTime = endTime !== undefined ? endTime : existing.endTime;
    if (finalStartTime >= finalEndTime) return res.status(400).json({ message: 'startTime must be before endTime' });

    const slot = await prisma.slot.update({ where: { id: slotId }, data: updateData });
    res.json(slot);
  } catch (e) { next(e); }
});

router.delete('/:id', auth(), requireRole('BUSINESS', 'SERVICE_PROVIDER', 'ADMIN'), async (req, res, next) => {
  try {
    const slotId = Number(req.params.id);
    const existing = await prisma.slot.findUnique({ where: { id: slotId }, include: { business: true } });
    if (!existing) return res.status(404).json({ message: 'Slot not found' });
    if (!(await assertOwnBusiness(req.user, existing.businessId))) return res.status(403).json({ message: 'Forbidden for this business' });

    await prisma.slot.delete({ where: { id: slotId } });
    res.json({ message: 'Slot deleted' });
  } catch (e) { next(e); }
});

/**
 * GET /slots/:slotId/available-times - Get available booking times for a service in a slot
 *
 * Epic 2 - Sprint B: Multi-booking support
 *
 * Returns legal start times for a specific service in a slot, accounting for:
 * - Existing bookings
 * - No-dead-edge rule
 * - Service duration
 *
 * Query params:
 * - businessServiceId (required): The service to check availability for
 * - excludeBookingId (optional): Booking ID to exclude (for reschedule)
 */
router.get('/:slotId/available-times', async (req, res, next) => {
  try {
    const slotId = Number(req.params.slotId);
    const { businessServiceId, excludeBookingId } = req.query;

    if (!businessServiceId) {
      return res.status(400).json({ message: 'businessServiceId is required' });
    }

    // Verify slot exists
    const slot = await prisma.slot.findUnique({
      where: { id: slotId },
      include: {
        allowedServices: {
          where: { businessServiceId: Number(businessServiceId) }
        }
      }
    });

    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }

    // Verify service is allowed in this slot
    if (slot.allowedServices.length === 0) {
      return res.status(400).json({ message: 'Service not allowed in this slot' });
    }

    // Get legal start times using slotAvailability service
    const legalTimes = await getLegalStartTimes(
      prisma,
      slotId,
      Number(businessServiceId),
      excludeBookingId ? Number(excludeBookingId) : null
    );

    res.json({
      slotId,
      businessServiceId: Number(businessServiceId),
      availableTimes: legalTimes
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
