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
 * Profession Management Routes (Admin Only)
 *
 * Professions belong to Fields in the Field → Profession → Service Template hierarchy
 */

// Get all professions
router.get('/', async (req, res) => {
  try {
    const { fieldId, status, search } = req.query;

    const where = {};

    if (fieldId) {
      where.fieldId = parseInt(fieldId);
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameHebrew: { contains: search, mode: 'insensitive' } }
      ];
    }

    const professions = await prisma.profession.findMany({
      where,
      include: {
        field: {
          select: {
            id: true,
            name: true,
            nameHebrew: true
          }
        },
        _count: {
          select: { serviceTemplates: true }
        }
      },
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' }
      ]
    });

    res.json(professions);
  } catch (error) {
    console.error('Error fetching professions:', error);
    res.status(500).json({ error: 'Failed to fetch professions' });
  }
});

// Get single profession by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const profession = await prisma.profession.findUnique({
      where: { id: parseInt(id) },
      include: {
        field: {
          select: {
            id: true,
            name: true,
            nameHebrew: true,
            status: true
          }
        },
        serviceTemplates: {
          orderBy: [
            { displayOrder: 'asc' },
            { name: 'asc' }
          ]
        },
        _count: {
          select: { serviceTemplates: true }
        }
      }
    });

    if (!profession) {
      return res.status(404).json({ error: 'Profession not found' });
    }

    res.json(profession);
  } catch (error) {
    console.error('Error fetching profession:', error);
    res.status(500).json({ error: 'Failed to fetch profession' });
  }
});

// Create profession
router.post('/', async (req, res) => {
  try {
    const { fieldId } = req.body;
    let { name, nameHebrew, displayOrder, status } = req.body;

    // Validation
    if (!fieldId || !name || !nameHebrew) {
      return res.status(400).json({ error: 'fieldId, name and nameHebrew are required' });
    }

    // Normalize input
    name = name.trim().replace(/\s+/g, ' ');
    nameHebrew = nameHebrew.trim().replace(/\s+/g, ' ');

    // Validate parent field exists
    const field = await prisma.field.findUnique({
      where: { id: parseInt(fieldId) }
    });

    if (!field) {
      return res.status(400).json({ error: 'Field not found' });
    }

    // Check for duplicate name within same field (case-insensitive)
    const existing = await prisma.profession.findFirst({
      where: {
        fieldId: parseInt(fieldId),
        name: {
          mode: 'insensitive',
          equals: name
        }
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Profession with this name already exists in this field' });
    }

    const profession = await prisma.profession.create({
      data: {
        fieldId: parseInt(fieldId),
        name,
        nameHebrew,
        displayOrder: displayOrder || 0,
        status: status || 'ACTIVE'
      },
      include: {
        field: {
          select: {
            id: true,
            name: true,
            nameHebrew: true
          }
        }
      }
    });

    res.status(201).json(profession);
  } catch (error) {
    console.error('Error creating profession:', error);
    res.status(500).json({ error: 'Failed to create profession' });
  }
});

// Update profession
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { fieldId } = req.body;
    let { name, nameHebrew, displayOrder, status } = req.body;

    // Check if profession exists
    const existing = await prisma.profession.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Profession not found' });
    }

    // Normalize input if provided
    if (name) name = name.trim().replace(/\s+/g, ' ');
    if (nameHebrew) nameHebrew = nameHebrew.trim().replace(/\s+/g, ' ');

    // Validate parent field exists (if fieldId is being changed)
    if (fieldId && fieldId !== existing.fieldId) {
      const field = await prisma.field.findUnique({
        where: { id: parseInt(fieldId) }
      });

      if (!field) {
        return res.status(400).json({ error: 'Field not found' });
      }
    }

    // Check for duplicate name (if name or fieldId is being changed) - case-insensitive
    if ((name && normalizeName(name) !== normalizeName(existing.name)) || (fieldId && fieldId !== existing.fieldId)) {
      const targetFieldId = fieldId ? parseInt(fieldId) : existing.fieldId;
      const targetName = name || existing.name;

      const duplicate = await prisma.profession.findFirst({
        where: {
          fieldId: targetFieldId,
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
        return res.status(400).json({ error: 'Profession with this name already exists in this field' });
      }
    }

    const updateData = {};
    if (fieldId !== undefined) updateData.fieldId = parseInt(fieldId);
    if (name !== undefined) updateData.name = name;
    if (nameHebrew !== undefined) updateData.nameHebrew = nameHebrew;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;
    if (status !== undefined) updateData.status = status;

    const profession = await prisma.profession.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        field: {
          select: {
            id: true,
            name: true,
            nameHebrew: true
          }
        }
      }
    });

    res.json(profession);
  } catch (error) {
    console.error('Error updating profession:', error);
    res.status(500).json({ error: 'Failed to update profession' });
  }
});

// Archive profession (set status to ARCHIVED)
router.patch('/:id/archive', async (req, res) => {
  try {
    const { id } = req.params;

    const profession = await prisma.profession.update({
      where: { id: parseInt(id) },
      data: { status: 'ARCHIVED' },
      include: {
        field: {
          select: {
            id: true,
            name: true,
            nameHebrew: true
          }
        }
      }
    });

    res.json(profession);
  } catch (error) {
    console.error('Error archiving profession:', error);
    res.status(500).json({ error: 'Failed to archive profession' });
  }
});

// Restore profession (set status to ACTIVE)
router.patch('/:id/restore', async (req, res) => {
  try {
    const { id } = req.params;

    const profession = await prisma.profession.update({
      where: { id: parseInt(id) },
      data: { status: 'ACTIVE' },
      include: {
        field: {
          select: {
            id: true,
            name: true,
            nameHebrew: true
          }
        }
      }
    });

    res.json(profession);
  } catch (error) {
    console.error('Error restoring profession:', error);
    res.status(500).json({ error: 'Failed to restore profession' });
  }
});

// Delete profession (only if no service templates)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if profession has service templates
    const profession = await prisma.profession.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: { serviceTemplates: true }
        }
      }
    });

    if (!profession) {
      return res.status(404).json({ error: 'Profession not found' });
    }

    if (profession._count.serviceTemplates > 0) {
      return res.status(400).json({
        error: 'Cannot delete profession with existing service templates',
        serviceTemplateCount: profession._count.serviceTemplates
      });
    }

    await prisma.profession.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Profession deleted successfully' });
  } catch (error) {
    console.error('Error deleting profession:', error);
    res.status(500).json({ error: 'Failed to delete profession' });
  }
});

module.exports = router;
