const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Public Registration Catalog Routes
 *
 * Read-only endpoints for registration flow.
 * No authentication required.
 * Returns only ACTIVE items.
 */

// Get all active fields
router.get('/fields', async (req, res) => {
  try {
    const { search } = req.query;

    const where = {
      status: 'ACTIVE'
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameHebrew: { contains: search, mode: 'insensitive' } }
      ];
    }

    const fields = await prisma.field.findMany({
      where,
      select: {
        id: true,
        name: true,
        nameHebrew: true,
        icon: true,
        displayOrder: true
      },
      orderBy: [
        { displayOrder: 'asc' },
        { nameHebrew: 'asc' }
      ]
    });

    res.json(fields);
  } catch (error) {
    console.error('Error fetching active fields:', error);
    res.status(500).json({ error: 'Failed to fetch fields' });
  }
});

// Get all active professions for a field
router.get('/fields/:fieldId/professions', async (req, res) => {
  try {
    const { fieldId } = req.params;
    const { search } = req.query;

    const where = {
      fieldId: parseInt(fieldId),
      status: 'ACTIVE'
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameHebrew: { contains: search, mode: 'insensitive' } }
      ];
    }

    const professions = await prisma.profession.findMany({
      where,
      select: {
        id: true,
        name: true,
        nameHebrew: true,
        displayOrder: true,
        fieldId: true
      },
      orderBy: [
        { displayOrder: 'asc' },
        { nameHebrew: 'asc' }
      ]
    });

    res.json(professions);
  } catch (error) {
    console.error('Error fetching active professions:', error);
    res.status(500).json({ error: 'Failed to fetch professions' });
  }
});

// Get all active service templates for a profession
router.get('/professions/:professionId/services', async (req, res) => {
  try {
    const { professionId } = req.params;
    const { search } = req.query;

    const where = {
      professionId: parseInt(professionId),
      status: 'ACTIVE'
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameHebrew: { contains: search, mode: 'insensitive' } }
      ];
    }

    const services = await prisma.serviceTemplate.findMany({
      where,
      select: {
        id: true,
        name: true,
        nameHebrew: true,
        description: true,
        displayOrder: true,
        defaultDurationMinutes: true,
        defaultPrice: true,
        professionId: true
      },
      orderBy: [
        { displayOrder: 'asc' },
        { nameHebrew: 'asc' }
      ]
    });

    res.json(services);
  } catch (error) {
    console.error('Error fetching active services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Get required documents for selected service template IDs
router.post('/required-documents', async (req, res) => {
  try {
    const { serviceTemplateIds } = req.body;

    if (!serviceTemplateIds || !Array.isArray(serviceTemplateIds) || serviceTemplateIds.length === 0) {
      return res.status(400).json({ error: 'serviceTemplateIds array is required' });
    }

    // Get all document requirements for the selected services
    const requirements = await prisma.serviceDocumentRequirement.findMany({
      where: {
        serviceTemplateId: { in: serviceTemplateIds.map(id => parseInt(id)) }
      },
      include: {
        documentType: {
          select: {
            id: true,
            name: true,
            nameHebrew: true,
            description: true,
            acceptedFormats: true,
            maxSizeKB: true,
            status: true
          }
        },
        serviceTemplate: {
          select: {
            id: true,
            name: true,
            nameHebrew: true,
            professionId: true
          }
        }
      }
    });

    // Filter only ACTIVE document types
    const activeRequirements = requirements.filter(req => req.documentType.status === 'ACTIVE');

    // Group by document type ID to avoid duplicates
    const documentsMap = new Map();

    activeRequirements.forEach(req => {
      const docTypeId = req.documentTypeId;

      if (!documentsMap.has(docTypeId)) {
        documentsMap.set(docTypeId, {
          documentType: req.documentType,
          instruction: req.instruction,
          requiredByServices: []
        });
      }

      // Add service info
      documentsMap.get(docTypeId).requiredByServices.push({
        serviceTemplateId: req.serviceTemplate.id,
        serviceName: req.serviceTemplate.nameHebrew || req.serviceTemplate.name,
        professionId: req.serviceTemplate.professionId
      });
    });

    // Convert map to array
    const documents = Array.from(documentsMap.values());

    res.json({
      success: true,
      data: documents
    });
  } catch (error) {
    console.error('Error fetching required documents:', error);
    res.status(500).json({ error: 'Failed to fetch required documents' });
  }
});

module.exports = router;
