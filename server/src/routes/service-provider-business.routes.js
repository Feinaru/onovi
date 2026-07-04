const express = require('express');
const router = express.Router();
const registrationService = require('../services/registration.service');
const { auth, requireRole } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

/**
 * GET /api/service-provider/business/profile
 * Get business profile for editing
 */
router.get('/profile', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        businesses: {
          where: { status: { in: ['DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED'] } },
          take: 1,
          include: {
            approvals: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    if (!user || !user.businesses || user.businesses.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No business found for this user'
      });
    }

    const business = user.businesses[0];
    const approval = business.approvals[0] || null;

    res.json({
      success: true,
      data: {
        id: business.id,
        name: business.name,
        phone: business.phone,
        description: business.description,
        identifierType: business.identifierType,
        identifierValue: business.identifierValue,
        cityCode: business.cityCode,
        cityNameHebrew: business.cityNameHebrew,
        streetCode: business.streetCode,
        streetNameHebrew: business.streetNameHebrew,
        houseNumber: business.houseNumber,
        formattedAddress: business.formattedAddress,
        // Legacy fields
        city: business.city,
        street: business.street,
        status: business.status,
        createdAt: business.createdAt,
        updatedAt: business.updatedAt,
        // Owner email from user
        ownerEmail: user.email,
        // Approval info
        approvalStatus: approval ? approval.status : 'DRAFT',
        adminNote: approval ? approval.adminNote : null
      }
    });
  } catch (error) {
    console.error('Get business profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get business profile',
      details: error.message
    });
  }
});

/**
 * PUT /api/service-provider/business/profile
 * Update business profile
 */
router.put('/profile', async (req, res) => {
  try {
    const { name, phone, email, description, city, street, houseNumber } = req.body;

    // Validate required fields
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        error: 'Business name and phone are required'
      });
    }

    // Get user's business
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        businesses: {
          where: { status: { in: ['DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED'] } },
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

    // Update business
    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: {
        name,
        phone,
        description: description || null,
        city: city || null,
        street: street || null,
        houseNumber: houseNumber || null
      }
    });

    // Update user email if provided
    if (email !== undefined && email !== user.email) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { email: email || null }
      });
    }

    res.json({
      success: true,
      message: 'Business profile updated successfully',
      data: {
        id: updatedBusiness.id,
        name: updatedBusiness.name,
        phone: updatedBusiness.phone,
        description: updatedBusiness.description,
        city: updatedBusiness.city,
        street: updatedBusiness.street,
        houseNumber: updatedBusiness.houseNumber,
        updatedAt: updatedBusiness.updatedAt
      }
    });
  } catch (error) {
    console.error('Update business profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update business profile',
      details: error.message
    });
  }
});

module.exports = router;
