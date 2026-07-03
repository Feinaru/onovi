const express = require('express');
const router = express.Router();
const registrationService = require('../services/registration.service');
const { auth, requireRole } = require('../middleware/auth');

// Apply authentication and service provider role to all routes
router.use(auth());
router.use(requireRole('SERVICE_PROVIDER'));

/**
 * ============================================
 * SERVICE PROVIDER - REGISTRATION MANAGEMENT
 * ============================================
 */

/**
 * POST /api/service-provider/registration/submit
 * Submit registration for approval
 */
router.post('/submit', async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await registrationService.submitForApproval(userId);

    if (!result.success) {
      return res.status(400).json({
        error: result.error,
        details: result.details
      });
    }

    res.json({
      message: 'Registration submitted for approval successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Submit for approval route error:', error);
    res.status(500).json({ error: 'Failed to submit for approval' });
  }
});

module.exports = router;
