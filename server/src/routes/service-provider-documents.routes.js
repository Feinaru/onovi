const express = require('express');
const router = express.Router();
const documentService = require('../services/document.service');
const { auth, requireRole } = require('../middleware/auth');

// Apply authentication and service provider role to all routes
router.use(auth());
router.use(requireRole('SERVICE_PROVIDER'));

/**
 * ============================================
 * SERVICE PROVIDER - DOCUMENT MANAGEMENT
 * ============================================
 */

// Get required documents for service provider's business
router.get('/required-documents', async (req, res) => {
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
    const result = await documentService.getRequiredDocuments(businessId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Get required documents error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get required documents',
      details: error.message
    });
  }
});

// Upload document
router.post('/upload', async (req, res) => {
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
    const result = await documentService.uploadDocument(businessId, req.body);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload document',
      details: error.message
    });
  }
});

// Get document upload status
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
    const result = await documentService.getDocumentStatus(businessId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Get document status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get document status',
      details: error.message
    });
  }
});

// Get uploaded documents
router.get('/uploaded', async (req, res) => {
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
    const result = await documentService.getServiceProviderUploadedDocuments(businessId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Get uploaded documents error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get uploaded documents',
      details: error.message
    });
  }
});

module.exports = router;
