const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { auth, requireRole } = require('../middleware/auth');
const { recalculateSlotStatus } = require('../services/slotStatus.service');
const { CANCELLED_BOOKING_STATUSES } = require('../constants/bookingStatuses');
const prisma = new PrismaClient();

// Apply authentication and service provider role to all routes
router.use(auth());
router.use(requireRole('SERVICE_PROVIDER'));

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
 * GET /api/service-provider/bookings
 * Get all bookings for the service provider's business
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

    const bookings = await prisma.booking.findMany({
      where: { businessId: business.id },
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
      orderBy: [{ createdAt: 'desc' }]
    });

    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error('Get provider bookings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get bookings',
      details: error.message
    });
  }
});

/**
 * GET /api/service-provider/bookings/:id
 * Get a single booking detail for the service provider's business
 */
router.get('/:id', async (req, res) => {
  try {
    const bookingId = Number(req.params.id);

    // Get provider's business
    const business = await getProviderBusiness(req.user.id);

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'No business found for this user'
      });
    }

    // Get booking and verify ownership
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
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Verify booking belongs to provider's business
    if (booking.businessId !== business.id) {
      return res.status(403).json({
        success: false,
        error: 'Booking does not belong to your business'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Get provider booking detail error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get booking details',
      details: error.message
    });
  }
});

/**
 * PATCH /api/service-provider/bookings/:id/status
 * Update booking status for a booking belonging to the service provider's business
 */
router.patch('/:id/status', async (req, res) => {
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
        success: false,
        error: `Valid status required: ${validStatuses.join(', ')}`
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

    // Get booking and verify ownership
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { business: true }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    if (booking.businessId !== business.id) {
      return res.status(403).json({
        success: false,
        error: 'Booking does not belong to your business'
      });
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
          business: true,
          customer: {
            select: { id: true, fullName: true, phone: true, email: true }
          }
        }
      });
    });

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: result
    });
  } catch (error) {
    console.error('Update provider booking status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update booking status',
      details: error.message
    });
  }
});

/**
 * PATCH /api/service-provider/bookings/:id/cancel
 * Cancel a booking belonging to the service provider's business
 */
router.patch('/:id/cancel', async (req, res) => {
  try {
    const bookingId = Number(req.params.id);

    // Get provider's business
    const business = await getProviderBusiness(req.user.id);

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'No business found for this user'
      });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { business: true }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    if (booking.businessId !== business.id) {
      return res.status(403).json({
        success: false,
        error: 'Booking does not belong to your business'
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CANCELLED_BY_BUSINESS',
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
          business: true,
          customer: {
            select: { id: true, fullName: true, phone: true, email: true }
          }
        }
      });
    });

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: result
    });
  } catch (error) {
    console.error('Cancel provider booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel booking',
      details: error.message
    });
  }
});

module.exports = router;
