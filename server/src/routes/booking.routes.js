const router = require('express').Router();
const prisma = require('../lib/prisma');
const { auth, requireRole } = require('../middleware/auth');

router.get('/', auth(false), async (req, res, next) => {
  try {
    const where = {};
    if (req.query.mine === 'true' && req.user?.role === 'CUSTOMER') where.customerId = req.user.id;
    if (req.query.businessId) where.businessId = Number(req.query.businessId);
    const bookings = await prisma.booking.findMany({
      where,
      include: { business: true, service: true, slot: true, customer: { select: { id: true, fullName: true, phone: true, email: true } } },
      orderBy: { id: 'desc' }
    });
    res.json(bookings);
  } catch (e) { next(e); }
});

router.post('/', auth(false), async (req, res, next) => {
  try {
    const { slotId, customerName, customerPhone, customerNote } = req.body;
    if (!slotId || !customerName || !customerPhone) return res.status(400).json({ message: 'slotId, customerName and customerPhone are required' });

    const result = await prisma.$transaction(async (tx) => {
      const slot = await tx.slot.findUnique({ where: { id: Number(slotId) } });
      if (!slot) {
        const err = new Error('Slot not found'); err.status = 404; throw err;
      }
      if (slot.status !== 'OPEN') {
        const err = new Error('התור הזה כבר לא זמין'); err.status = 409; throw err;
      }
      const activeBooking = await tx.booking.findFirst({
        where: { slotId: slot.id, status: { in: ['PENDING', 'CONFIRMED'] } }
      });
      if (activeBooking) {
        const err = new Error('התור הזה כבר לא זמין'); err.status = 409; throw err;
      }
      await tx.slot.update({ where: { id: slot.id }, data: { status: 'RESERVED' } });
      return tx.booking.create({
        data: {
          customerId: req.user?.role === 'CUSTOMER' ? req.user.id : null,
          businessId: slot.businessId,
          serviceId: slot.serviceId,
          slotId: slot.id,
          customerName,
          customerPhone,
          customerNote,
          price: slot.dealPrice || slot.regularPrice,
          status: 'PENDING'
        }
      });
    });
    res.status(201).json(result);
  } catch (e) { next(e); }
});

router.patch('/:id/confirm', auth(), requireRole('BUSINESS', 'ADMIN'), async (req, res, next) => {
  try {
    const bookingId = Number(req.params.id);
    const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { business: true } });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (req.user.role !== 'ADMIN' && booking.business.ownerId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    const result = await prisma.$transaction(async (tx) => {
      await tx.slot.update({ where: { id: booking.slotId }, data: { status: 'BOOKED' } });
      return tx.booking.update({ where: { id: bookingId }, data: { status: 'CONFIRMED', confirmedAt: new Date() } });
    });
    res.json(result);
  } catch (e) { next(e); }
});

router.patch('/:id/status', auth(), requireRole('BUSINESS', 'ADMIN'), async (req, res, next) => {
  try {
    const bookingId = Number(req.params.id);
    const { status } = req.body;

    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Valid status required: PENDING, APPROVED, REJECTED, COMPLETED, CANCELLED' });
    }

    const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { business: true } });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (req.user.role !== 'ADMIN' && booking.business.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const updateData = { status };
    if (status === 'APPROVED') updateData.confirmedAt = new Date();
    if (status === 'CANCELLED' || status === 'REJECTED') updateData.cancelledAt = new Date();

    const result = await prisma.$transaction(async (tx) => {
      // Update slot status based on booking status
      if (status === 'APPROVED') {
        await tx.slot.update({ where: { id: booking.slotId }, data: { status: 'BOOKED' } });
      } else if (status === 'CANCELLED' || status === 'REJECTED') {
        await tx.slot.update({ where: { id: booking.slotId }, data: { status: 'OPEN' } });
      }
      return tx.booking.update({ where: { id: bookingId }, data: updateData });
    });
    res.json(result);
  } catch (e) { next(e); }
});

router.patch('/:id/cancel', auth(false), async (req, res, next) => {
  try {
    const bookingId = Number(req.params.id);
    const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { business: true } });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    let status = 'CANCELLED_BY_CUSTOMER';
    if (req.user?.role === 'BUSINESS') {
      if (booking.business.ownerId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
      status = 'CANCELLED_BY_BUSINESS';
    }
    if (req.user?.role === 'ADMIN') status = 'CANCELLED_BY_BUSINESS';

    const result = await prisma.$transaction(async (tx) => {
      await tx.slot.update({ where: { id: booking.slotId }, data: { status: 'OPEN' } });
      return tx.booking.update({ where: { id: bookingId }, data: { status, cancelledAt: new Date() } });
    });
    res.json(result);
  } catch (e) { next(e); }
});

module.exports = router;
