const router = require('express').Router();
const prisma = require('../lib/prisma');
const { auth, requireRole } = require('../middleware/auth');

router.get('/', auth(), requireRole('ADMIN'), async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { id: 'desc' },
      select: { id: true, fullName: true, phone: true, email: true, role: true, status: true, createdAt: true, updatedAt: true }
    });
    res.json(users);
  } catch (e) { next(e); }
});

module.exports = router;
