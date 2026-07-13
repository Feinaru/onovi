const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { auth, requireRole } = require('../middleware/auth');
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
 * Helper: Calculate date ranges
 */
function calculateDateRange(period) {
  const today = new Date();
  const todayStr = formatDate(today);

  let fromDate, toDate;

  switch (period) {
    case 'week': {
      // Current week (Sunday to Saturday)
      const dayOfWeek = today.getDay();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - dayOfWeek);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      fromDate = formatDate(startOfWeek);
      toDate = formatDate(endOfWeek);
      break;
    }
    case 'month': {
      // Current month
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      fromDate = formatDate(startOfMonth);
      toDate = formatDate(endOfMonth);
      break;
    }
    default:
      // Today only
      fromDate = todayStr;
      toDate = todayStr;
  }

  return { fromDate, toDate };
}

/**
 * Helper: Format Date to YYYY-MM-DD
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * GET /api/service-provider/reports/summary
 * Get business reports summary
 *
 * Query params:
 * - period: 'week' | 'month' | 'custom'
 * - from: YYYY-MM-DD (if period=custom)
 * - to: YYYY-MM-DD (if period=custom)
 */
router.get('/summary', async (req, res) => {
  try {
    const business = await getProviderBusiness(req.user.id);

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'לא נמצא עסק למשתמש זה'
      });
    }

    // Parse query params
    const { period = 'week', from, to } = req.query;

    let fromDate, toDate;
    if (period === 'custom' && from && to) {
      fromDate = from;
      toDate = to;
    } else {
      const range = calculateDateRange(period);
      fromDate = range.fromDate;
      toDate = range.toDate;
    }

    // Fetch all bookings in date range
    const bookings = await prisma.booking.findMany({
      where: {
        businessId: business.id,
        slot: {
          date: {
            gte: fromDate,
            lte: toDate
          }
        }
      },
      include: {
        slot: { select: { date: true } },
        businessService: {
          select: {
            id: true,
            name: true,
            serviceTemplate: { select: { name: true } }
          }
        }
      }
    });

    // Fetch all slots in date range for availability metrics
    const slots = await prisma.slot.findMany({
      where: {
        businessId: business.id,
        date: {
          gte: fromDate,
          lte: toDate
        }
      },
      include: {
        bookings: { select: { status: true } }
      }
    });

    // --- Revenue Metrics ---
    // Realized revenue: COMPLETED bookings only
    const realizedRevenue = bookings
      .filter(b => b.status === 'COMPLETED')
      .reduce((sum, b) => sum + b.price, 0);

    // Expected revenue: CONFIRMED + APPROVED + COMPLETED bookings
    const expectedRevenue = bookings
      .filter(b => ['CONFIRMED', 'APPROVED', 'COMPLETED'].includes(b.status))
      .reduce((sum, b) => sum + b.price, 0);

    // --- Booking Counts by Status ---
    const statusCounts = {
      PENDING: 0,
      CONFIRMED: 0,
      APPROVED: 0,
      COMPLETED: 0,
      CANCELLED: 0,
      CANCELLED_BY_CUSTOMER: 0,
      CANCELLED_BY_BUSINESS: 0,
      REJECTED: 0,
      NO_SHOW: 0
    };

    bookings.forEach(b => {
      if (statusCounts[b.status] !== undefined) {
        statusCounts[b.status]++;
      }
    });

    const totalBookings = bookings.length;
    const activeBookings = statusCounts.PENDING + statusCounts.CONFIRMED + statusCounts.APPROVED;
    const completedBookings = statusCounts.COMPLETED;
    const cancelledBookings = statusCounts.CANCELLED +
                              statusCounts.CANCELLED_BY_CUSTOMER +
                              statusCounts.CANCELLED_BY_BUSINESS +
                              statusCounts.REJECTED;

    // --- Availability Utilization ---
    const totalSlots = slots.length;
    const activeSlots = slots.filter(s => {
      const activeBookings = s.bookings.filter(b =>
        ['PENDING', 'CONFIRMED', 'APPROVED', 'COMPLETED'].includes(b.status)
      );
      return activeBookings.length > 0;
    }).length;

    const utilizationRate = totalSlots > 0
      ? Math.round((activeSlots / totalSlots) * 100)
      : 0;

    // --- Service Performance ---
    const serviceStats = {};
    bookings.forEach(b => {
      if (!b.businessService) return;

      const serviceId = b.businessService.id;
      const serviceName = b.businessService.customName ||
                          b.businessService.name ||
                          b.businessService.serviceTemplate?.name ||
                          'שירות';

      if (!serviceStats[serviceId]) {
        serviceStats[serviceId] = {
          id: serviceId,
          name: serviceName,
          bookingCount: 0,
          completedCount: 0,
          revenue: 0
        };
      }

      serviceStats[serviceId].bookingCount++;
      if (b.status === 'COMPLETED') {
        serviceStats[serviceId].completedCount++;
        serviceStats[serviceId].revenue += b.price;
      }
    });

    const topServices = Object.values(serviceStats)
      .sort((a, b) => b.bookingCount - a.bookingCount)
      .slice(0, 5);

    // --- Response ---
    res.json({
      success: true,
      data: {
        period: {
          type: period,
          from: fromDate,
          to: toDate
        },
        revenue: {
          realized: realizedRevenue,
          expected: expectedRevenue
        },
        bookings: {
          total: totalBookings,
          active: activeBookings,
          completed: completedBookings,
          cancelled: cancelledBookings,
          statusBreakdown: statusCounts
        },
        availability: {
          totalSlots,
          slotsWithBookings: activeSlots,
          utilizationRate
        },
        services: topServices
      }
    });
  } catch (error) {
    console.error('Get reports summary error:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בטעינת דוחות',
      details: error.message
    });
  }
});

module.exports = router;
