const router = require('express').Router();
const prisma = require('../lib/prisma');
const { auth, requireRole } = require('../middleware/auth');

async function assertOwnBusiness(user, businessId) {
  if (user.role === 'ADMIN') return true;
  const business = await prisma.business.findUnique({ where: { id: Number(businessId) } });
  return business && business.ownerId === user.id;
}

router.get('/', async (req, res, next) => {
  try {
    const where = req.query.businessId ? { businessId: Number(req.query.businessId) } : {};
    res.json(await prisma.service.findMany({ where, include: { business: true }, orderBy: { id: 'desc' } }));
  } catch (e) { next(e); }
});

router.post('/', auth(), requireRole('BUSINESS', 'ADMIN'), async (req, res, next) => {
  try {
    const { businessId, name, description, durationMinutes, regularPrice } = req.body;
    if (!businessId || !name || !durationMinutes || !regularPrice) return res.status(400).json({ message: 'businessId, name, durationMinutes and regularPrice are required' });
    if (durationMinutes <= 0) return res.status(400).json({ message: 'durationMinutes must be positive' });
    if (regularPrice <= 0) return res.status(400).json({ message: 'regularPrice must be positive' });
    if (!(await assertOwnBusiness(req.user, businessId))) return res.status(403).json({ message: 'Forbidden for this business' });
    const service = await prisma.service.create({
      data: { businessId: Number(businessId), name, description, durationMinutes: Number(durationMinutes), regularPrice: Number(regularPrice) }
    });
    res.status(201).json(service);
  } catch (e) { next(e); }
});

router.patch('/:id', auth(), requireRole('BUSINESS', 'ADMIN'), async (req, res, next) => {
  try {
    const serviceId = Number(req.params.id);
    const { name, description, durationMinutes, regularPrice, active } = req.body;

    const existing = await prisma.service.findUnique({ where: { id: serviceId }, include: { business: true } });
    if (!existing) return res.status(404).json({ message: 'Service not found' });
    if (!(await assertOwnBusiness(req.user, existing.businessId))) return res.status(403).json({ message: 'Forbidden for this business' });

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (durationMinutes !== undefined) {
      if (durationMinutes <= 0) return res.status(400).json({ message: 'durationMinutes must be positive' });
      updateData.durationMinutes = Number(durationMinutes);
    }
    if (regularPrice !== undefined) {
      if (regularPrice <= 0) return res.status(400).json({ message: 'regularPrice must be positive' });
      updateData.regularPrice = Number(regularPrice);
    }
    if (active !== undefined) updateData.active = Boolean(active);

    const service = await prisma.service.update({ where: { id: serviceId }, data: updateData });
    res.json(service);
  } catch (e) { next(e); }
});

router.delete('/:id', auth(), requireRole('BUSINESS', 'ADMIN'), async (req, res, next) => {
  try {
    const serviceId = Number(req.params.id);
    const existing = await prisma.service.findUnique({ where: { id: serviceId }, include: { business: true } });
    if (!existing) return res.status(404).json({ message: 'Service not found' });
    if (!(await assertOwnBusiness(req.user, existing.businessId))) return res.status(403).json({ message: 'Forbidden for this business' });

    await prisma.service.delete({ where: { id: serviceId } });
    res.json({ message: 'Service deleted' });
  } catch (e) { next(e); }
});

module.exports = router;
