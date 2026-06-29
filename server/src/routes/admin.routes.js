const express = require('express');
const prisma = require('../lib/prisma');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(auth());
router.use(requireRole('ADMIN'));

router.get('/dashboard', async (req, res, next) => {
  try {
    const [
      usersCount,
      categoriesCount,
      businessesCount,
      servicesCount,
      slotsCount,
      bookingsCount,
      pendingBusinessesCount,
      openSlotsCount
    ] = await Promise.all([
      prisma.user.count(),
      prisma.category.count(),
      prisma.business.count(),
      prisma.service.count(),
      prisma.slot.count(),
      prisma.booking.count(),
      prisma.business.count({ where: { status: 'PENDING_APPROVAL' } }),
      prisma.slot.count({ where: { status: 'OPEN' } })
    ]);

    res.json({
      usersCount,
      categoriesCount,
      businessesCount,
      servicesCount,
      slotsCount,
      bookingsCount,
      pendingBusinessesCount,
      openSlotsCount
    });
  } catch (err) {
    next(err);
  }
});

// Admin Categories

router.get('/categories', async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { id: 'asc' }
    });

    res.json(categories);
  } catch (err) {
    next(err);
  }
});

router.post('/categories', async (req, res, next) => {
  try {
    const { name, icon } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const category = await prisma.category.create({
      data: {
        name,
        icon: icon || null
      }
    });

    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
});

router.put('/categories/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { name, icon } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name,
        icon: icon || null
      }
    });

    res.json(category);
  } catch (err) {
    next(err);
  }
});

router.delete('/categories/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    await prisma.category.delete({
      where: { id }
    });

    res.json({ message: 'Category deleted' });
  } catch (err) {
    next(err);
  }
});

// Admin Businesses

router.get('/businesses', async (req, res, next) => {
  try {
    const businesses = await prisma.business.findMany({
      include: {
        category: true,
        owner: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(businesses);
  } catch (err) {
    next(err);
  }
});

router.patch('/businesses/:id/approve', async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const business = await prisma.business.update({
      where: { id },
      data: {
        status: 'ACTIVE'
      }
    });

    res.json(business);
  } catch (err) {
    next(err);
  }
});

router.patch('/businesses/:id/suspend', async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const business = await prisma.business.update({
      where: { id },
      data: {
        status: 'SUSPENDED'
      }
    });

    res.json(business);
  } catch (err) {
    next(err);
  }
});

module.exports = router;