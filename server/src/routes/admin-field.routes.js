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
 * Field Management Routes (Admin Only)
 *
 * Fields are top-level categories in the Field → Profession → Service Template hierarchy
 */

// Get all fields
router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameHebrew: { contains: search, mode: 'insensitive' } }
      ];
    }

    const fields = await prisma.field.findMany({
      where,
      include: {
        _count: {
          select: { professions: true }
        }
      },
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' }
      ]
    });

    res.json(fields);
  } catch (error) {
    console.error('Error fetching fields:', error);
    res.status(500).json({ error: 'Failed to fetch fields' });
  }
});

// Get single field by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const field = await prisma.field.findUnique({
      where: { id: parseInt(id) },
      include: {
        professions: {
          orderBy: [
            { displayOrder: 'asc' },
            { name: 'asc' }
          ]
        },
        _count: {
          select: { professions: true }
        }
      }
    });

    if (!field) {
      return res.status(404).json({ error: 'Field not found' });
    }

    res.json(field);
  } catch (error) {
    console.error('Error fetching field:', error);
    res.status(500).json({ error: 'Failed to fetch field' });
  }
});

// Create field
router.post('/', async (req, res) => {
  try {
    let { name, nameHebrew, icon, displayOrder, status } = req.body;

    // Validation
    if (!name || !nameHebrew) {
      return res.status(400).json({ error: 'Name and nameHebrew are required' });
    }

    // Normalize input
    name = name.trim().replace(/\s+/g, ' ');
    nameHebrew = nameHebrew.trim().replace(/\s+/g, ' ');

    // Check for duplicate name (case-insensitive)
    const normalizedName = normalizeName(name);
    const existing = await prisma.field.findFirst({
      where: {
        name: {
          mode: 'insensitive',
          equals: name
        }
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Field with this name already exists' });
    }

    const field = await prisma.field.create({
      data: {
        name,
        nameHebrew,
        icon: icon || null,
        displayOrder: displayOrder || 0,
        status: status || 'ACTIVE'
      }
    });

    res.status(201).json(field);
  } catch (error) {
    console.error('Error creating field:', error);
    res.status(500).json({ error: 'Failed to create field' });
  }
});

// Update field
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let { name, nameHebrew, icon, displayOrder, status } = req.body;

    // Check if field exists
    const existing = await prisma.field.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Field not found' });
    }

    // Normalize input if provided
    if (name) name = name.trim().replace(/\s+/g, ' ');
    if (nameHebrew) nameHebrew = nameHebrew.trim().replace(/\s+/g, ' ');

    // Check for duplicate name (if name is being changed) - case-insensitive
    if (name && normalizeName(name) !== normalizeName(existing.name)) {
      const duplicate = await prisma.field.findFirst({
        where: {
          name: {
            mode: 'insensitive',
            equals: name
          },
          NOT: {
            id: parseInt(id)
          }
        }
      });

      if (duplicate) {
        return res.status(400).json({ error: 'Field with this name already exists' });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (nameHebrew !== undefined) updateData.nameHebrew = nameHebrew;
    if (icon !== undefined) updateData.icon = icon;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;
    if (status !== undefined) updateData.status = status;

    const field = await prisma.field.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json(field);
  } catch (error) {
    console.error('Error updating field:', error);
    res.status(500).json({ error: 'Failed to update field' });
  }
});

// Hide field (set status to ARCHIVED)
router.patch('/:id/archive', async (req, res) => {
  try {
    const { id } = req.params;

    const field = await prisma.field.update({
      where: { id: parseInt(id) },
      data: { status: 'ARCHIVED' }
    });

    res.json(field);
  } catch (error) {
    console.error('Error archiving field:', error);
    res.status(500).json({ error: 'Failed to archive field' });
  }
});

// Restore field (set status to ACTIVE)
router.patch('/:id/restore', async (req, res) => {
  try {
    const { id } = req.params;

    const field = await prisma.field.update({
      where: { id: parseInt(id) },
      data: { status: 'ACTIVE' }
    });

    res.json(field);
  } catch (error) {
    console.error('Error restoring field:', error);
    res.status(500).json({ error: 'Failed to restore field' });
  }
});

// Delete field (only if no professions)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if field has professions
    const field = await prisma.field.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: { professions: true }
        }
      }
    });

    if (!field) {
      return res.status(404).json({ error: 'Field not found' });
    }

    if (field._count.professions > 0) {
      return res.status(400).json({
        error: 'Cannot delete field with existing professions',
        professionCount: field._count.professions
      });
    }

    await prisma.field.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Field deleted successfully' });
  } catch (error) {
    console.error('Error deleting field:', error);
    res.status(500).json({ error: 'Failed to delete field' });
  }
});

module.exports = router;
