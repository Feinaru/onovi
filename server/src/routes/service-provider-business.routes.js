const express = require('express');
const router = express.Router();
const registrationService = require('../services/registration.service');
const { auth, requireRole } = require('../middleware/auth');

// Apply authentication and service provider role to all routes
router.use(auth());
router.use(requireRole('SERVICE_PROVIDER'));

/**
 * GET /api/service-provider/business/status
 * Get combined business status (approval, documents, consents, visibility)
 */
router.get('/status', async (req, res) => {
  try {
    // Get user's business
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        businesses: {
          where: { status: { in: ['PENDING_APPROVAL', 'ACTIVE'] } },
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
    const result = await registrationService.getCombinedBusinessStatus(businessId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Get combined status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get combined status',
      details: error.message
    });
  }
});

module.exports = router;
