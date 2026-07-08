/**
 * Admin Bookings Routes
 * Admin-only endpoint for viewing and managing all bookings across the marketplace
 */

const router = require('express').Router();
const prisma = require('../lib/prisma');
const { auth, requireRole } = require('../middleware/auth');

router.use(auth());
router.use(requireRole('ADMIN'));

/**
 * GET /api/admin/bookings - List all bookings with admin-specific filters
 */
router.get('/', async (req, res, next) => {
  try {
    const {
      status,
      businessId,
      customerId,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 50
    } = req.query;

    const where = {};

    // Status filter
    if (status) {
      where.status = status;
    }

    // Business filter
    if (businessId) {
      where.businessId = Number(businessId);
    }

    // Customer filter
    if (customerId) {
      where.customerId = Number(customerId);
    }

    // Date range filter (on slot.date)
    if (startDate || endDate) {
      where.slot = {};
      if (startDate && endDate) {
        where.slot.date = {
          gte: startDate,
          lte: endDate
        };
      } else if (startDate) {
        where.slot.date = { gte: startDate };
      } else if (endDate) {
        where.slot.date = { lte: endDate };
      }
    }

    // Search filter (customerName or customerPhone)
    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search } }
      ];
    }

    // Pagination
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Execute queries in parallel
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          business: {
            select: {
              id: true,
              name: true,
              phone: true,
              city: true,
              cityNameHebrew: true,
              status: true,
              owner: {
                select: {
                  id: true,
                  fullName: true,
                  phone: true,
                  email: true
                }
              }
            }
          },
          businessService: {
            select: {
              id: true,
              name: true,
              description: true,
              durationMinutes: true,
              regularPrice: true
            }
          },
          slot: {
            select: {
              id: true,
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
        },
        orderBy: [
          { createdAt: 'desc' }
        ],
        skip,
        take: limitNum
      }),
      prisma.booking.count({ where })
    ]);

    res.json({
      bookings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
