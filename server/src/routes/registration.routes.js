const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const registrationService = require('../services/registration.service');

/**
 * Service Provider Registration Routes
 *
 * POST   /api/register/service-provider        - Create new registration (public)
 * GET    /api/register/service-provider/status - Get registration status (authenticated)
 * PATCH  /api/register/service-provider        - Update registration (authenticated)
 * POST   /api/register/suggestion              - Submit suggestion (authenticated)
 */

/**
 * POST /api/register/service-provider
 * Create new service provider registration (public)
 */
router.post('/service-provider', async (req, res) => {
  try {
    const {
      email,
      password,
      serviceProviderName,
      businessName,
      businessIdentificationNumber,
      phone,
      address,
      city,
      fieldIds,
      professionIds,
      serviceTemplateIds
    } = req.body;

    // Required field validation
    if (!email || !password || !serviceProviderName || !businessName) {
      return res.status(400).json({
        error: 'Email, password, service provider name, and business name are required'
      });
    }

    if (!businessIdentificationNumber || !phone) {
      return res.status(400).json({
        error: 'Business identification number and phone are required'
      });
    }

    if (!fieldIds || !Array.isArray(fieldIds) || fieldIds.length === 0) {
      return res.status(400).json({
        error: 'At least one field must be selected'
      });
    }

    if (!professionIds || !Array.isArray(professionIds) || professionIds.length === 0) {
      return res.status(400).json({
        error: 'At least one profession must be selected'
      });
    }

    if (!serviceTemplateIds || !Array.isArray(serviceTemplateIds) || serviceTemplateIds.length === 0) {
      return res.status(400).json({
        error: 'At least one service must be selected'
      });
    }

    const result = await registrationService.createServiceProviderRegistration({
      email,
      password,
      serviceProviderName,
      businessName,
      businessIdentificationNumber,
      phone,
      address,
      city,
      fieldIds,
      professionIds,
      serviceTemplateIds
    });

    if (!result.success) {
      // Map error types to appropriate HTTP status codes
      let statusCode = 400;

      if (result.errorType === 'DUPLICATE_ERROR') {
        statusCode = 409; // Conflict
      } else if (result.errorType === 'DATABASE_ERROR') {
        statusCode = 500; // Internal Server Error
      } else if (result.errorType === 'VALIDATION_ERROR') {
        statusCode = 400; // Bad Request
      }

      return res.status(statusCode).json({
        error: result.error,
        errorType: result.errorType,
        field: result.field,
        details: result.details
      });
    }

    res.status(201).json({
      message: 'Registration successful',
      data: result.data
    });
  } catch (error) {
    console.error('Registration route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      errorType: 'SERVER_ERROR'
    });
  }
});

/**
 * GET /api/register/service-provider/status
 * Get registration status (requires authentication)
 */
router.get('/service-provider/status', auth(), async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await registrationService.getRegistrationStatus(userId);

    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }

    res.json({
      status: result.status,
      data: result.data
    });
  } catch (error) {
    console.error('Status route error:', error);
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

/**
 * PATCH /api/register/service-provider
 * Update incomplete registration (requires authentication)
 */
router.patch('/service-provider', auth(), async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      businessName,
      phone,
      address,
      city,
      businessIdentificationNumber,
      fieldIds,
      professionIds,
      serviceTemplateIds
    } = req.body;

    // Validate arrays if provided
    if (fieldIds && (!Array.isArray(fieldIds) || fieldIds.length === 0)) {
      return res.status(400).json({
        error: 'Field IDs must be a non-empty array if provided'
      });
    }

    if (professionIds && (!Array.isArray(professionIds) || professionIds.length === 0)) {
      return res.status(400).json({
        error: 'Profession IDs must be a non-empty array if provided'
      });
    }

    if (serviceTemplateIds && (!Array.isArray(serviceTemplateIds) || serviceTemplateIds.length === 0)) {
      return res.status(400).json({
        error: 'Service template IDs must be a non-empty array if provided'
      });
    }

    const result = await registrationService.updateRegistration(userId, {
      businessName,
      phone,
      address,
      city,
      businessIdentificationNumber,
      fieldIds,
      professionIds,
      serviceTemplateIds
    });

    if (!result.success) {
      return res.status(400).json({
        error: result.error,
        details: result.details
      });
    }

    res.json({
      message: 'Registration updated successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Update route error:', error);
    res.status(500).json({ error: 'Update failed' });
  }
});

/**
 * POST /api/register/suggestion
 * Submit suggestion for new field/profession/service (requires authentication)
 */
router.post('/suggestion', auth(), async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      type,
      name,
      description,
      parentFieldId,
      parentProfessionId
    } = req.body;

    if (!type || !name) {
      return res.status(400).json({
        error: 'Type and name are required'
      });
    }

    if (!['FIELD', 'PROFESSION', 'SERVICE'].includes(type)) {
      return res.status(400).json({
        error: 'Type must be FIELD, PROFESSION, or SERVICE'
      });
    }

    if (type === 'PROFESSION' && !parentFieldId) {
      return res.status(400).json({
        error: 'Parent field ID is required for profession suggestions'
      });
    }

    if (type === 'SERVICE' && !parentProfessionId) {
      return res.status(400).json({
        error: 'Parent profession ID is required for service suggestions'
      });
    }

    const result = await registrationService.createSuggestionRequest({
      userId,
      type,
      name,
      description,
      parentFieldId,
      parentProfessionId
    });

    if (!result.success) {
      return res.status(400).json({
        error: result.error,
        details: result.details
      });
    }

    res.status(201).json({
      message: 'Suggestion submitted successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Suggestion route error:', error);
    res.status(500).json({ error: 'Suggestion submission failed' });
  }
});

/**
 * POST /api/register/service-provider/submit
 * Submit registration for approval (requires authentication)
 */
router.post('/service-provider/submit', auth(), async (req, res) => {
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
