const express = require('express');
const router = express.Router();
const consentService = require('../services/consent.service');
const { auth, requireRole } = require('../middleware/auth');

// Apply authentication and service provider role to all routes
router.use(auth());
router.use(requireRole('SERVICE_PROVIDER'));

/**
 * ============================================
 * SERVICE PROVIDER - LEGAL DOCUMENTS
 * ============================================
 */

// Get current legal documents
router.get('/documents', async (req, res) => {
  const result = await consentService.getCurrentLegalDocuments();

  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(500).json(result);
  }
});

// Accept legal documents
router.post('/accept', async (req, res) => {
  const { consents, servicesSnapshot } = req.body;

  const metadata = {
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    servicesSnapshot
  };

  const result = await consentService.acceptLegalDocuments(req.user.id, consents, metadata);

  if (result.success) {
    res.status(201).json(result);
  } else {
    res.status(400).json(result);
  }
});

module.exports = router;
