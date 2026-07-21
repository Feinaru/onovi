const express = require('express');
const router = express.Router();
const documentService = require('../services/document.service');
const { auth, requireRole } = require('../middleware/auth');

// Apply authentication and admin role to all routes
router.use(auth());
router.use(requireRole('ADMIN'));

/**
 * ============================================
 * DOCUMENT TYPE MANAGEMENT
 * ============================================
 */

// Create document type
router.post('/document-types', async (req, res) => {
  const result = await documentService.createDocumentType(req.body);

  if (result.success) {
    res.status(201).json(result);
  } else {
    res.status(400).json(result);
  }
});

// List document types
router.get('/document-types', async (req, res) => {
  const { status } = req.query;
  const result = await documentService.listDocumentTypes({ status });

  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(500).json(result);
  }
});

// Update document type
router.patch('/document-types/:id', async (req, res) => {
  const result = await documentService.updateDocumentType(req.params.id, req.body);

  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(400).json(result);
  }
});

// Archive document type
router.post('/document-types/:id/archive', async (req, res) => {
  const result = await documentService.archiveDocumentType(req.params.id);

  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(400).json(result);
  }
});

// Restore document type
router.post('/document-types/:id/restore', async (req, res) => {
  const result = await documentService.restoreDocumentType(req.params.id);

  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(400).json(result);
  }
});

// Delete document type (guarded: unused types only)
router.delete('/document-types/:id', async (req, res) => {
  const result = await documentService.deleteDocumentType(req.params.id);

  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(400).json(result);
  }
});

/**
 * ============================================
 * SERVICE DOCUMENT REQUIREMENTS
 * ============================================
 */

// Add requirement to service template
router.post('/service-templates/:serviceTemplateId/requirements', async (req, res) => {
  const data = {
    ...req.body,
    serviceTemplateId: req.params.serviceTemplateId
  };

  const result = await documentService.addServiceDocumentRequirement(data);

  if (result.success) {
    res.status(201).json(result);
  } else {
    res.status(400).json(result);
  }
});

// List requirements for a service template
router.get('/service-templates/:serviceTemplateId/requirements', async (req, res) => {
  const result = await documentService.listServiceDocumentRequirements(req.params.serviceTemplateId);

  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(500).json(result);
  }
});

// Update requirement instruction
router.patch('/requirements/:id', async (req, res) => {
  const result = await documentService.updateServiceDocumentRequirement(req.params.id, req.body);

  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(400).json(result);
  }
});

// Remove requirement
router.delete('/requirements/:id', async (req, res) => {
  const result = await documentService.removeServiceDocumentRequirement(req.params.id);

  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(400).json(result);
  }
});

/**
 * ============================================
 * DOCUMENT REVIEW
 * ============================================
 */

// List uploaded documents
router.get('/uploaded-documents', async (req, res) => {
  const { status, businessId } = req.query;
  const result = await documentService.listUploadedDocuments({ status, businessId });

  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(500).json(result);
  }
});

// Approve document
router.post('/uploaded-documents/:id/approve', async (req, res) => {
  const result = await documentService.approveDocument(req.params.id, req.user.id);

  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(400).json(result);
  }
});

// Reject document
router.post('/uploaded-documents/:id/reject', async (req, res) => {
  const { adminNotes } = req.body;
  const result = await documentService.rejectDocument(req.params.id, req.user.id, adminNotes);

  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(400).json(result);
  }
});

// Update document visibility
router.patch('/uploaded-documents/:id/visibility', async (req, res) => {
  const { isPublic } = req.body;
  const result = await documentService.updateDocumentVisibility(req.params.id, isPublic);

  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(400).json(result);
  }
});

module.exports = router;
