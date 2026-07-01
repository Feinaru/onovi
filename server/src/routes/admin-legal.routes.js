const express = require('express');
const router = express.Router();
const consentService = require('../services/consent.service');
const { auth, requireRole } = require('../middleware/auth');

// Apply authentication and admin role to all routes
router.use(auth());
router.use(requireRole('ADMIN'));

/**
 * ============================================
 * LEGAL DOCUMENT MANAGEMENT
 * ============================================
 */

// Create draft
router.post('/documents/draft', async (req, res) => {
  const result = await consentService.createDraft(req.body, req.user.id);

  if (result.success) {
    res.status(201).json(result);
  } else {
    res.status(400).json(result);
  }
});

// Edit draft
router.patch('/documents/draft/:code', async (req, res) => {
  const result = await consentService.editDraft(req.params.code, req.body, req.user.id);

  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(400).json(result);
  }
});

// Publish version
router.post('/documents/:code/publish', async (req, res) => {
  const result = await consentService.publishVersion(req.params.code, req.user.id);

  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(400).json(result);
  }
});

// Archive version
router.post('/documents/:code/archive', async (req, res) => {
  const result = await consentService.archiveVersion(req.params.code, req.user.id);

  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(400).json(result);
  }
});

// List versions
router.get('/documents/:baseCode/versions', async (req, res) => {
  const result = await consentService.listVersions(req.params.baseCode);

  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(500).json(result);
  }
});

// Get published version
router.get('/documents/:baseCode/published', async (req, res) => {
  const result = await consentService.getPublishedVersion(req.params.baseCode);

  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(404).json(result);
  }
});

/**
 * ============================================
 * CONSENT HISTORY
 * ============================================
 */

// Get consent history
router.get('/consents', async (req, res) => {
  const { userId, consentTypeId, code } = req.query;
  const result = await consentService.getConsentHistory({ userId, consentTypeId, code });

  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(500).json(result);
  }
});

// Get user consents
router.get('/consents/user/:userId', async (req, res) => {
  const result = await consentService.getUserConsents(req.params.userId);

  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(500).json(result);
  }
});

module.exports = router;
