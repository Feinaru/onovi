const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { auth, requireRole } = require('../middleware/auth');

// All routes require admin authentication
router.use(auth());
router.use(requireRole('ADMIN'));

/**
 * Normalize string for duplicate detection:
 * - Trim whitespace
 * - Collapse multiple spaces to single space
 * - Convert to lowercase for case-insensitive comparison
 */
function normalizeName(str) {
  return str.trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Service Template Management Routes (Admin Only)
 *
 * Service Templates belong to Professions in the Field → Profession → Service Template hierarchy
 */

// Get all service templates
router.get('/', async (req, res) => {
  try {
    const { professionId, status, colorLevel, search } = req.query;

    const where = {};

    if (professionId) {
      where.professionId = parseInt(professionId);
    }

    if (status) {
      where.status = status;
    }

    if (colorLevel) {
      where.colorLevel = colorLevel;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameHebrew: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const serviceTemplates = await prisma.serviceTemplate.findMany({
      where,
      include: {
        profession: {
          select: {
            id: true,
            name: true,
            nameHebrew: true,
            field: {
              select: {
                id: true,
                name: true,
                nameHebrew: true
              }
            }
          }
        },
        _count: {
          select: { businessServices: true }
        }
      },
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' }
      ]
    });

    res.json(serviceTemplates);
  } catch (error) {
    console.error('Error fetching service templates:', error);
    res.status(500).json({ error: 'Failed to fetch service templates' });
  }
});

// Get single service template by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const serviceTemplate = await prisma.serviceTemplate.findUnique({
      where: { id: parseInt(id) },
      include: {
        profession: {
          select: {
            id: true,
            name: true,
            nameHebrew: true,
            status: true,
            field: {
              select: {
                id: true,
                name: true,
                nameHebrew: true,
                status: true
              }
            }
          }
        },
        documentRequirements: {
          include: {
            documentType: true
          }
        },
        _count: {
          select: { businessServices: true }
        }
      }
    });

    if (!serviceTemplate) {
      return res.status(404).json({ error: 'Service template not found' });
    }

    res.json(serviceTemplate);
  } catch (error) {
    console.error('Error fetching service template:', error);
    res.status(500).json({ error: 'Failed to fetch service template' });
  }
});

// Create service template
router.post('/', async (req, res) => {
  try {
    const {
      professionId,
      description,
      defaultDurationMinutes,
      defaultPrice,
      colorLevel,
      colorNote,
      displayOrder,
      status
    } = req.body;
    let { name, nameHebrew } = req.body;

    // Validation
    if (!professionId || !name || !nameHebrew || !defaultDurationMinutes) {
      return res.status(400).json({
        error: 'professionId, name, nameHebrew and defaultDurationMinutes are required'
      });
    }

    if (defaultDurationMinutes <= 0) {
      return res.status(400).json({ error: 'defaultDurationMinutes must be positive' });
    }

    if (defaultPrice !== undefined && defaultPrice < 0) {
      return res.status(400).json({ error: 'defaultPrice cannot be negative' });
    }

    // Validate colorLevel if provided
    if (colorLevel && !['GREEN', 'YELLOW', 'RED'].includes(colorLevel)) {
      return res.status(400).json({ error: 'colorLevel must be GREEN, YELLOW or RED' });
    }

    // Normalize input
    name = name.trim().replace(/\s+/g, ' ');
    nameHebrew = nameHebrew.trim().replace(/\s+/g, ' ');

    // Validate parent profession exists
    const profession = await prisma.profession.findUnique({
      where: { id: parseInt(professionId) }
    });

    if (!profession) {
      return res.status(400).json({ error: 'Profession not found' });
    }

    // Check for duplicate name within same profession (case-insensitive)
    const existing = await prisma.serviceTemplate.findFirst({
      where: {
        professionId: parseInt(professionId),
        name: {
          mode: 'insensitive',
          equals: name
        }
      }
    });

    if (existing) {
      return res.status(400).json({
        error: 'Service template with this name already exists in this profession'
      });
    }

    const serviceTemplate = await prisma.serviceTemplate.create({
      data: {
        professionId: parseInt(professionId),
        name,
        nameHebrew,
        description: description || null,
        defaultDurationMinutes,
        defaultPrice: defaultPrice || null,
        colorLevel: colorLevel || 'GREEN',
        colorNote: colorNote || null,
        displayOrder: displayOrder || 0,
        status: status || 'ACTIVE'
      },
      include: {
        profession: {
          select: {
            id: true,
            name: true,
            nameHebrew: true,
            field: {
              select: {
                id: true,
                name: true,
                nameHebrew: true
              }
            }
          }
        }
      }
    });

    res.status(201).json(serviceTemplate);
  } catch (error) {
    console.error('Error creating service template:', error);
    res.status(500).json({ error: 'Failed to create service template' });
  }
});

// Update service template
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      professionId,
      description,
      defaultDurationMinutes,
      defaultPrice,
      colorLevel,
      colorNote,
      displayOrder,
      status
    } = req.body;
    let { name, nameHebrew } = req.body;

    // Check if service template exists
    const existing = await prisma.serviceTemplate.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Service template not found' });
    }

    // Normalize input if provided
    if (name) name = name.trim().replace(/\s+/g, ' ');
    if (nameHebrew) nameHebrew = nameHebrew.trim().replace(/\s+/g, ' ');

    // Validate values if provided
    if (defaultDurationMinutes !== undefined && defaultDurationMinutes <= 0) {
      return res.status(400).json({ error: 'defaultDurationMinutes must be positive' });
    }

    if (defaultPrice !== undefined && defaultPrice < 0) {
      return res.status(400).json({ error: 'defaultPrice cannot be negative' });
    }

    if (colorLevel && !['GREEN', 'YELLOW', 'RED'].includes(colorLevel)) {
      return res.status(400).json({ error: 'colorLevel must be GREEN, YELLOW or RED' });
    }

    // Validate parent profession exists (if professionId is being changed)
    if (professionId && professionId !== existing.professionId) {
      const profession = await prisma.profession.findUnique({
        where: { id: parseInt(professionId) }
      });

      if (!profession) {
        return res.status(400).json({ error: 'Profession not found' });
      }
    }

    // Check for duplicate name (if name or professionId is being changed) - case-insensitive
    if ((name && normalizeName(name) !== normalizeName(existing.name)) ||
        (professionId && professionId !== existing.professionId)) {
      const targetProfessionId = professionId ? parseInt(professionId) : existing.professionId;
      const targetName = name || existing.name;

      const duplicate = await prisma.serviceTemplate.findFirst({
        where: {
          professionId: targetProfessionId,
          name: {
            mode: 'insensitive',
            equals: targetName
          },
          NOT: {
            id: parseInt(id)
          }
        }
      });

      if (duplicate) {
        return res.status(400).json({
          error: 'Service template with this name already exists in this profession'
        });
      }
    }

    const updateData = {};
    if (professionId !== undefined) updateData.professionId = parseInt(professionId);
    if (name !== undefined) updateData.name = name;
    if (nameHebrew !== undefined) updateData.nameHebrew = nameHebrew;
    if (description !== undefined) updateData.description = description;
    if (defaultDurationMinutes !== undefined) updateData.defaultDurationMinutes = defaultDurationMinutes;
    if (defaultPrice !== undefined) updateData.defaultPrice = defaultPrice;
    if (colorLevel !== undefined) updateData.colorLevel = colorLevel;
    if (colorNote !== undefined) updateData.colorNote = colorNote;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;
    if (status !== undefined) updateData.status = status;

    const serviceTemplate = await prisma.serviceTemplate.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        profession: {
          select: {
            id: true,
            name: true,
            nameHebrew: true,
            field: {
              select: {
                id: true,
                name: true,
                nameHebrew: true
              }
            }
          }
        }
      }
    });

    res.json(serviceTemplate);
  } catch (error) {
    console.error('Error updating service template:', error);
    res.status(500).json({ error: 'Failed to update service template' });
  }
});

// Archive service template (set status to ARCHIVED)
router.patch('/:id/archive', async (req, res) => {
  try {
    const { id } = req.params;

    const serviceTemplate = await prisma.serviceTemplate.update({
      where: { id: parseInt(id) },
      data: { status: 'ARCHIVED' },
      include: {
        profession: {
          select: {
            id: true,
            name: true,
            nameHebrew: true,
            field: {
              select: {
                id: true,
                name: true,
                nameHebrew: true
              }
            }
          }
        }
      }
    });

    res.json(serviceTemplate);
  } catch (error) {
    console.error('Error archiving service template:', error);
    res.status(500).json({ error: 'Failed to archive service template' });
  }
});

// Restore service template (set status to ACTIVE)
router.patch('/:id/restore', async (req, res) => {
  try {
    const { id } = req.params;

    const serviceTemplate = await prisma.serviceTemplate.update({
      where: { id: parseInt(id) },
      data: { status: 'ACTIVE' },
      include: {
        profession: {
          select: {
            id: true,
            name: true,
            nameHebrew: true,
            field: {
              select: {
                id: true,
                name: true,
                nameHebrew: true
              }
            }
          }
        }
      }
    });

    res.json(serviceTemplate);
  } catch (error) {
    console.error('Error restoring service template:', error);
    res.status(500).json({ error: 'Failed to restore service template' });
  }
});

// Delete service template (only if not used by businesses)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if service template is used by any businesses
    const serviceTemplate = await prisma.serviceTemplate.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: { businessServices: true }
        }
      }
    });

    if (!serviceTemplate) {
      return res.status(404).json({ error: 'Service template not found' });
    }

    if (serviceTemplate._count.businessServices > 0) {
      return res.status(400).json({
        error: 'Cannot delete service template that is used by businesses',
        businessServiceCount: serviceTemplate._count.businessServices
      });
    }

    await prisma.serviceTemplate.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Service template deleted successfully' });
  } catch (error) {
    console.error('Error deleting service template:', error);
    res.status(500).json({ error: 'Failed to delete service template' });
  }
});

module.exports = router;
