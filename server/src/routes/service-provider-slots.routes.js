const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { auth, requireRole } = require('../middleware/auth');
const prisma = new PrismaClient();

// Apply authentication and service provider role to all routes
router.use(auth());
router.use(requireRole('SERVICE_PROVIDER'));

/**
 * Active booking statuses (block editing/deleting availability)
 */
const ACTIVE_BOOKING_STATUSES = ['PENDING', 'APPROVED', 'CONFIRMED', 'COMPLETED', 'NO_SHOW'];

/**
 * Helper: Get active bookings from bookings array
 */
function getActiveBookings(bookings = []) {
  return bookings.filter(b => ACTIVE_BOOKING_STATUSES.includes(b.status));
}

/**
 * Helper: Get provider's business from authenticated user
 */
async function getProviderBusiness(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      businesses: {
        where: { status: { in: ['PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED'] } },
        take: 1
      }
    }
  });

  if (!user || !user.businesses || user.businesses.length === 0) {
    return null;
  }

  return user.businesses[0];
}

/**
 * GET /api/service-provider/slots
 * Get all slots for the service provider's business
 */
router.get('/', async (req, res) => {
  try {
    const business = await getProviderBusiness(req.user.id);

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'No business found for this user'
      });
    }

    const slots = await prisma.slot.findMany({
      where: { businessId: business.id },
      include: {
        service: true,
        allowedServices: {
          include: {
            businessService: {
              include: { serviceTemplate: true }
            }
          }
        },
        bookings: {
          where: {
            status: { notIn: ['CANCELLED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_BUSINESS'] }
          }
        }
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }]
    });

    // Format slots to include allowed services in simpler structure
    const formattedSlots = slots.map(slot => ({
      ...slot,
      allowedServices: slot.allowedServices.map(as => ({
        id: as.businessService.id,
        name: as.businessService.name,
        durationMinutes: as.businessService.durationMinutes,
        regularPrice: as.businessService.regularPrice,
        serviceTemplateId: as.businessService.serviceTemplateId
      }))
    }));

    res.json({
      success: true,
      data: formattedSlots
    });
  } catch (error) {
    console.error('Get provider slots error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get slots',
      details: error.message
    });
  }
});

/**
 * POST /api/service-provider/slots
 * Create a new slot for the service provider's business
 *
 * Body: { date, startTime, endTime, regularPrice, dealPrice?, note?, allowedServiceIds }
 */
router.post('/', async (req, res) => {
  try {
    const { date, startTime, endTime, regularPrice, dealPrice, note, allowedServiceIds } = req.body;

    // Validation
    if (!date || !startTime || !endTime || !regularPrice) {
      return res.status(400).json({
        success: false,
        error: 'date, startTime, endTime, and regularPrice are required'
      });
    }

    if (regularPrice <= 0) {
      return res.status(400).json({
        success: false,
        error: 'regularPrice must be positive'
      });
    }

    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        error: 'startTime must be before endTime'
      });
    }

    // Get provider's business
    const business = await getProviderBusiness(req.user.id);

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'No business found for this user'
      });
    }

    const businessId = business.id;

    // Validate and prepare allowedServiceIds
    let allowedServiceIdsToUse = allowedServiceIds;

    // If no allowedServiceIds provided, default to all active + customer-visible services
    if (!allowedServiceIdsToUse || allowedServiceIdsToUse.length === 0) {
      const activeServices = await prisma.businessService.findMany({
        where: {
          businessId,
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
          businessId,
          active: true,
          visibleToCustomers: true
        },
        select: { id: true }
      });

      if (validServices.length !== serviceIds.length) {
        return res.status(400).json({
          success: false,
          error: 'Invalid allowedServiceIds: all services must belong to your business and be active + visible to customers'
        });
      }
    }

    // Determine serviceId for legacy compatibility
    const legacyServiceId = allowedServiceIdsToUse.length > 0 ? allowedServiceIdsToUse[0] : null;

    if (!legacyServiceId) {
      return res.status(400).json({
        success: false,
        error: 'No services available for this slot. Please add services to your business first.'
      });
    }

    // Create slot with status: OPEN by default (immediately visible to customers)
    const slot = await prisma.slot.create({
      data: {
        businessId,
        serviceId: Number(legacyServiceId), // Legacy field for backward compatibility
        date,
        startTime,
        endTime,
        regularPrice: Number(regularPrice),
        dealPrice: dealPrice ? Number(dealPrice) : null,
        note,
        status: 'OPEN'
      }
    });

    // Create SlotAllowedService records
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
        service: true,
        allowedServices: {
          include: {
            businessService: {
              include: { serviceTemplate: true }
            }
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Slot created successfully',
      data: {
        ...slotWithServices,
        allowedServices: slotWithServices.allowedServices.map(as => ({
          id: as.businessService.id,
          name: as.businessService.name,
          durationMinutes: as.businessService.durationMinutes,
          regularPrice: as.businessService.regularPrice,
          serviceTemplateId: as.businessService.serviceTemplateId
        }))
      }
    });
  } catch (error) {
    console.error('Create provider slot error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create slot',
      details: error.message
    });
  }
});

/**
 * PATCH /api/service-provider/slots/:id
 * Update a slot owned by the service provider
 */
router.patch('/:id', async (req, res) => {
  try {
    const slotId = Number(req.params.id);
    const { date, startTime, endTime, regularPrice, dealPrice, note, status } = req.body;

    // Get provider's business
    const business = await getProviderBusiness(req.user.id);

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'No business found for this user'
      });
    }

    // Verify slot ownership and fetch with bookings
    const existing = await prisma.slot.findFirst({
      where: {
        id: slotId,
        businessId: business.id
      },
      include: {
        bookings: true
      }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Slot not found or does not belong to your business'
      });
    }

    // Check for active bookings
    const activeBookings = getActiveBookings(existing.bookings);
    const hasActiveBookings = activeBookings.length > 0;

    // If active bookings exist, block dangerous field changes
    if (hasActiveBookings) {
      const tryingToChangeDate = date !== undefined && date !== existing.date;
      const tryingToChangeStartTime = startTime !== undefined && startTime !== existing.startTime;
      const tryingToChangeEndTime = endTime !== undefined && endTime !== existing.endTime;

      // Normalize price comparison
      const tryingToChangeRegularPrice = regularPrice !== undefined && Number(regularPrice) !== Number(existing.regularPrice);

      // Normalize dealPrice (null, undefined, empty string all treated as null)
      const normalizeDealPrice = (val) => {
        if (val === null || val === undefined || val === '') return null;
        return Number(val);
      };
      const tryingToChangeDealPrice = dealPrice !== undefined && normalizeDealPrice(dealPrice) !== normalizeDealPrice(existing.dealPrice);

      const tryingToChangeStatus = status !== undefined && status !== existing.status;

      if (tryingToChangeDate || tryingToChangeStartTime || tryingToChangeEndTime ||
          tryingToChangeRegularPrice || tryingToChangeDealPrice || tryingToChangeStatus) {
        return res.status(400).json({
          success: false,
          error: `לא ניתן לשנות זמינות עם הזמנות פעילות. יש ${activeBookings.length} הזמנות פעילות.`
        });
      }

      // Only note is allowed to be updated when active bookings exist
    }

    const updateData = {};
    if (date !== undefined) updateData.date = date;
    if (startTime !== undefined) updateData.startTime = startTime;
    if (endTime !== undefined) updateData.endTime = endTime;
    if (regularPrice !== undefined) {
      if (regularPrice <= 0) {
        return res.status(400).json({
          success: false,
          error: 'regularPrice must be positive'
        });
      }
      updateData.regularPrice = Number(regularPrice);
    }
    if (dealPrice !== undefined) updateData.dealPrice = dealPrice ? Number(dealPrice) : null;
    if (note !== undefined) updateData.note = note;
    if (status !== undefined) updateData.status = status;

    // Validate time range if both are being updated
    const finalStartTime = startTime !== undefined ? startTime : existing.startTime;
    const finalEndTime = endTime !== undefined ? endTime : existing.endTime;
    if (finalStartTime >= finalEndTime) {
      return res.status(400).json({
        success: false,
        error: 'startTime must be before endTime'
      });
    }

    const slot = await prisma.slot.update({
      where: { id: slotId },
      data: updateData,
      include: {
        service: true,
        allowedServices: {
          include: {
            businessService: {
              include: { serviceTemplate: true }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Slot updated successfully',
      data: {
        ...slot,
        allowedServices: slot.allowedServices.map(as => ({
          id: as.businessService.id,
          name: as.businessService.name,
          durationMinutes: as.businessService.durationMinutes,
          regularPrice: as.businessService.regularPrice,
          serviceTemplateId: as.businessService.serviceTemplateId
        }))
      }
    });
  } catch (error) {
    console.error('Update provider slot error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update slot',
      details: error.message
    });
  }
});

/**
 * DELETE /api/service-provider/slots/:id
 * Delete a slot owned by the service provider
 */
router.delete('/:id', async (req, res) => {
  try {
    const slotId = Number(req.params.id);

    // Get provider's business
    const business = await getProviderBusiness(req.user.id);

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'No business found for this user'
      });
    }

    // Verify slot ownership and fetch with bookings
    const existing = await prisma.slot.findFirst({
      where: {
        id: slotId,
        businessId: business.id
      },
      include: {
        bookings: true
      }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Slot not found or does not belong to your business'
      });
    }

    // Check for active bookings
    const activeBookings = getActiveBookings(existing.bookings);
    if (activeBookings.length > 0) {
      return res.status(400).json({
        success: false,
        error: `לא ניתן למחוק זמינות עם הזמנות פעילות. יש ${activeBookings.length} הזמנות פעילות. יש לטפל בהזמנות תחילה.`
      });
    }

    await prisma.slot.delete({ where: { id: slotId } });

    res.json({
      success: true,
      message: 'Slot deleted successfully'
    });
  } catch (error) {
    console.error('Delete provider slot error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete slot',
      details: error.message
    });
  }
});

module.exports = router;
