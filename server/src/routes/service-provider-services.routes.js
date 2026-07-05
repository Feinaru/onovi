const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { auth, requireRole } = require('../middleware/auth');
const prisma = new PrismaClient();

// Apply authentication and service provider role to all routes
router.use(auth());
router.use(requireRole('SERVICE_PROVIDER'));

/**
 * GET /api/service-provider/services
 * Get all services for the service provider
 */
router.get('/', async (req, res) => {
  try {
    // Get user's business
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        businesses: {
          where: { status: { in: ['PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED'] } },
          take: 1
        }
      }
    });

    if (!user || !user.businesses || user.businesses.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No business found for this user'
      });
    }

    const businessId = user.businesses[0].id;

    // Get all BusinessService records with template info
    const services = await prisma.businessService.findMany({
      where: { businessId },
      include: {
        serviceTemplate: {
          include: {
            profession: {
              include: {
                field: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format response
    const formattedServices = services.map(s => ({
      id: s.id,
      publicId: s.publicId,
      name: s.customName || s.name,
      description: s.description,
      durationMinutes: s.durationMinutes,
      regularPrice: s.regularPrice,
      active: s.active,
      visibleToCustomers: s.visibleToCustomers,
      calendarColor: s.calendarColor,
      approvalStatus: s.approvalStatus,
      // Template info
      serviceTemplateId: s.serviceTemplateId,
      templateName: s.serviceTemplate?.nameHebrew,
      professionName: s.serviceTemplate?.profession?.nameHebrew,
      fieldName: s.serviceTemplate?.profession?.field?.nameHebrew,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt
    }));

    res.json({
      success: true,
      data: formattedServices
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get services',
      details: error.message
    });
  }
});

/**
 * PUT /api/service-provider/services/:serviceId
 * Update a service
 */
router.put('/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params;
    const {
      customName,
      description,
      durationMinutes,
      regularPrice,
      active,
      visibleToCustomers,
      calendarColor
    } = req.body;

    // Validate
    if (durationMinutes !== undefined && (durationMinutes <= 0 || durationMinutes > 1440)) {
      return res.status(400).json({
        success: false,
        error: 'Duration must be between 1 and 1440 minutes'
      });
    }

    if (regularPrice !== undefined && regularPrice < 0) {
      return res.status(400).json({
        success: false,
        error: 'Price cannot be negative'
      });
    }

    // Get user's business
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        businesses: {
          where: { status: { in: ['PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED'] } },
          take: 1
        }
      }
    });

    if (!user || !user.businesses || user.businesses.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No business found for this user'
      });
    }

    const businessId = user.businesses[0].id;

    // Verify service ownership
    const service = await prisma.businessService.findFirst({
      where: {
        id: parseInt(serviceId),
        businessId
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }

    // Build update data
    const updateData = {};
    if (customName !== undefined) updateData.customName = customName || null;
    if (description !== undefined) updateData.description = description || null;
    if (durationMinutes !== undefined) updateData.durationMinutes = durationMinutes;
    if (regularPrice !== undefined) updateData.regularPrice = regularPrice;
    if (active !== undefined) updateData.active = active;
    if (visibleToCustomers !== undefined) updateData.visibleToCustomers = visibleToCustomers;
    if (calendarColor !== undefined) updateData.calendarColor = calendarColor || null;

    // Update service
    const updatedService = await prisma.businessService.update({
      where: { id: service.id },
      data: updateData,
      include: {
        serviceTemplate: {
          include: {
            profession: {
              include: {
                field: true
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Service updated successfully',
      data: {
        id: updatedService.id,
        name: updatedService.customName || updatedService.name,
        description: updatedService.description,
        durationMinutes: updatedService.durationMinutes,
        regularPrice: updatedService.regularPrice,
        active: updatedService.active,
        visibleToCustomers: updatedService.visibleToCustomers,
        calendarColor: updatedService.calendarColor,
        updatedAt: updatedService.updatedAt
      }
    });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update service',
      details: error.message
    });
  }
});

module.exports = router;
