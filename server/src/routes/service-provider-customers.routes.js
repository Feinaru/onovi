const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { auth, requireRole } = require('../middleware/auth');

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
 * GET /api/service-provider/customers
 * Get customer list aggregated from bookings for provider's business
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

    // Get all bookings for this business
    const bookings = await prisma.booking.findMany({
      where: { businessId: business.id },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Aggregate customers
    const customerMap = new Map();

    bookings.forEach(booking => {
      let key;
      let customerData;

      // Group by customerId if exists, otherwise by phone/name (legacy fallback)
      if (booking.customerId) {
        key = `user_${booking.customerId}`;
        customerData = {
          customerId: booking.customerId,
          customerName: booking.customer?.fullName || booking.customerName || 'לקוח לא זמין',
          customerPhone: booking.customer?.phone || booking.customerPhone || 'טלפון לא זמין',
          email: booking.customer?.email || null
        };
      } else {
        // Legacy booking without customerId - group by phone/name
        key = `legacy_${booking.customerPhone}_${booking.customerName}`;
        customerData = {
          customerId: null,
          customerName: booking.customerName || 'לקוח לא זמין',
          customerPhone: booking.customerPhone || 'טלפון לא זמין',
          email: null
        };
      }

      if (!customerMap.has(key)) {
        customerMap.set(key, {
          ...customerData,
          totalBookings: 0,
          cancelledCount: 0,
          noShowCount: 0,
          lastBookingDate: null,
          bookings: []
        });
      }

      const customer = customerMap.get(key);
      customer.totalBookings++;
      customer.bookings.push(booking);

      // Count cancelled and no-show
      if (booking.status === 'CANCELLED_BY_CUSTOMER' || booking.status === 'CANCELLED_BY_BUSINESS' || booking.status === 'CANCELLED') {
        customer.cancelledCount++;
      }
      if (booking.status === 'NO_SHOW') {
        customer.noShowCount++;
      }

      // Track last booking date (from slot or createdAt)
      const bookingDate = booking.slot?.date || booking.createdAt;
      if (bookingDate && (!customer.lastBookingDate || new Date(bookingDate) > new Date(customer.lastBookingDate))) {
        customer.lastBookingDate = bookingDate;
      }
    });

    // Convert map to array and clean up
    const customers = Array.from(customerMap.values()).map(customer => {
      const { bookings, ...customerData } = customer;
      return {
        ...customerData,
        lastBookingDate: customer.lastBookingDate ? new Date(customer.lastBookingDate).toISOString().split('T')[0] : null
      };
    });

    // Sort by total bookings descending
    customers.sort((a, b) => b.totalBookings - a.totalBookings);

    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error('Get provider customers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get customers',
      details: error.message
    });
  }
});

module.exports = router;
