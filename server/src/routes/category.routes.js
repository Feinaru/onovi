const router = require('express').Router();
const prisma = require('../lib/prisma');
const { auth, requireRole } = require('../middleware/auth');

router.get('/', async (req, res, next) => {
  try {
    res.json(await prisma.category.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }));
  } catch (e) { next(e); }
});

router.post('/', auth(), requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { name, icon, displayOrder } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required' });
    res.status(201).json(await prisma.category.create({ data: { name, icon, displayOrder: displayOrder || 0 } }));
  } catch (e) { next(e); }
});

module.exports = router;
