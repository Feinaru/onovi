const {
  getLegalStartTimes,
  hasRemainingCapacity,
  recalculateSlotStatus,
  timeToMinutes,
  minutesToTime,
  gcd,
  gcdArray
} = require('../src/services/slotAvailability.service');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('slotAvailability.service', () => {
  describe('time conversion utilities', () => {
    test('timeToMinutes converts correctly', () => {
      expect(timeToMinutes('00:00')).toBe(0);
      expect(timeToMinutes('10:00')).toBe(600);
      expect(timeToMinutes('10:30')).toBe(630);
      expect(timeToMinutes('23:59')).toBe(1439);
    });

    test('minutesToTime converts correctly', () => {
      expect(minutesToTime(0)).toBe('00:00');
      expect(minutesToTime(600)).toBe('10:00');
      expect(minutesToTime(630)).toBe('10:30');
      expect(minutesToTime(1439)).toBe('23:59');
    });

    test('time conversion is reversible', () => {
      const times = ['00:00', '09:15', '10:30', '14:45', '23:59'];
      times.forEach(time => {
        const minutes = timeToMinutes(time);
        const converted = minutesToTime(minutes);
        expect(converted).toBe(time);
      });
    });
  });

  describe('GCD calculation', () => {
    test('gcd calculates correctly', () => {
      expect(gcd(15, 30)).toBe(15);
      expect(gcd(30, 45)).toBe(15);
      expect(gcd(45, 60)).toBe(15);
      expect(gcd(20, 30)).toBe(10);
    });

    test('gcdArray calculates correctly', () => {
      expect(gcdArray([15, 30, 45, 60])).toBe(15);
      expect(gcdArray([30, 60])).toBe(30);
      expect(gcdArray([20, 30, 40])).toBe(10);
      expect(gcdArray([])).toBe(15); // Default
    });
  });

  describe('getLegalStartTimes', () => {
    let testBusiness,
      testUser,
      testField,
      testProfession,
      testServiceTemplate30,
      testServiceTemplate45,
      testService30,
      testService45,
      testSlot;

    beforeAll(async () => {
      // Create test user
      testUser = await prisma.user.findFirst({
        where: { role: 'SERVICE_PROVIDER' }
      });

      if (!testUser) {
        // Create a test user if none exists
        testUser = await prisma.user.create({
          data: {
            email: 'test-sprint-a@test.com',
            phone: '0501111111',
            passwordHash: 'test-hash',
            role: 'SERVICE_PROVIDER',
            fullName: 'Test Sprint A User'
          }
        });
      }

      // Create test field
      testField = await prisma.field.create({
        data: {
          name: 'Test Field Sprint A',
          nameHebrew: 'תחום טסט',
          displayOrder: 0,
          status: 'ACTIVE'
        }
      });

      // Create test profession
      testProfession = await prisma.profession.create({
        data: {
          fieldId: testField.id,
          name: 'Test Profession Sprint A',
          nameHebrew: 'מקצוע טסט',
          displayOrder: 0,
          status: 'ACTIVE'
        }
      });

      // Create test business
      testBusiness = await prisma.business.create({
        data: {
          name: 'Test Salon Sprint A',
          ownerId: testUser.id,
          cityCode: 5000,
          categoryId: 1,
          phone: '0501111111',
          identifierType: 'ISRAELI_ID',
          identifierValue: '123456789'
        }
      });

      // Create test service templates
      testServiceTemplate30 = await prisma.serviceTemplate.create({
        data: {
          name: 'Test Haircut 30min',
          nameHebrew: 'תספורת 30 דקות',
          professionId: testProfession.id,
          defaultDurationMinutes: 30,
          defaultPrice: 120
        }
      });

      testServiceTemplate45 = await prisma.serviceTemplate.create({
        data: {
          name: 'Test Color 45min',
          nameHebrew: 'צביעה 45 דקות',
          professionId: testProfession.id,
          defaultDurationMinutes: 45,
          defaultPrice: 180
        }
      });

      // Create test business services
      testService30 = await prisma.businessService.create({
        data: {
          businessId: testBusiness.id,
          name: 'Haircut',
          durationMinutes: 30,
          regularPrice: 120,
          serviceTemplateId: testServiceTemplate30.id,
          approvalStatus: 'APPROVED'
        }
      });

      testService45 = await prisma.businessService.create({
        data: {
          businessId: testBusiness.id,
          name: 'Color',
          durationMinutes: 45,
          regularPrice: 180,
          serviceTemplateId: testServiceTemplate45.id,
          approvalStatus: 'APPROVED'
        }
      });
    });

    afterAll(async () => {
      // Cleanup - must delete in reverse dependency order
      await prisma.businessService.deleteMany({
        where: { businessId: testBusiness.id }
      });
      await prisma.serviceTemplate.deleteMany({
        where: { id: { in: [testServiceTemplate30.id, testServiceTemplate45.id] } }
      });
      await prisma.business.delete({ where: { id: testBusiness.id } });
      await prisma.profession.delete({ where: { id: testProfession.id } });
      await prisma.field.delete({ where: { id: testField.id } });
      await prisma.$disconnect();
    });

    beforeEach(async () => {
      // Create fresh slot for each test
      testSlot = await prisma.slot.create({
        data: {
          businessId: testBusiness.id,
          date: '2026-07-10',
          startTime: '10:00',
          endTime: '11:00',
          status: 'OPEN'
        }
      });

      // Add allowed service (30 min)
      await prisma.slotAllowedService.create({
        data: {
          slotId: testSlot.id,
          businessServiceId: testService30.id
        }
      });
    });

    afterEach(async () => {
      // Cleanup slot and related data
      await prisma.slotAllowedService.deleteMany({ where: { slotId: testSlot.id } });
      await prisma.booking.deleteMany({ where: { slotId: testSlot.id } });
      await prisma.slot.delete({ where: { id: testSlot.id } });
    });

    test('empty slot returns full availability', async () => {
      const times = await getLegalStartTimes(prisma, testSlot.id, testService30.id);

      // Slot: 10:00-11:00 (60 min), Service: 30 min, Step: 15 min (GCD of [30])
      // But GCD of single service is 30, clamped to 15 max
      // Expected: 10:00-10:30, 10:15-10:45, 10:30-11:00
      expect(times.length).toBeGreaterThanOrEqual(2);
      expect(times[0]).toEqual({ startTime: '10:00', endTime: '10:30' });
    });

    test('enforces no-dead-edge rule for 45-min service', async () => {
      // Add 45-min service to allowed list
      await prisma.slotAllowedService.create({
        data: {
          slotId: testSlot.id,
          businessServiceId: testService45.id
        }
      });

      const times = await getLegalStartTimes(prisma, testSlot.id, testService45.id);

      // Slot: 10:00-11:00 (60 min), Allowed services: 30 min and 45 min
      // Shortest allowed service = 30 min
      // Requesting 45-min service:
      // 10:00-10:45: leaves 15 min after (< 30 shortest) → invalid
      // 10:15-11:00: leaves 15 min before (< 30 shortest) → invalid
      // Expected: 0 legal start times
      expect(times).toHaveLength(0);
    });

    test('excludes occupied intervals', async () => {
      // Add booking: 10:15-10:45
      await prisma.booking.create({
        data: {
          businessId: testBusiness.id,
          businessServiceId: testService30.id,
          slotId: testSlot.id,
          startTime: '10:15',
          endTime: '10:45',
          customerName: 'Test Customer',
          customerPhone: '0501234567',
          price: 120,
          status: 'CONFIRMED'
        }
      });

      const times = await getLegalStartTimes(prisma, testSlot.id, testService30.id);

      // Free intervals: [10:00-10:15], [10:45-11:00]
      // Service: 30 min doesn't fit in 15 min gaps
      // Expected: No legal times (both gaps < 30 min)
      expect(times).toHaveLength(0);
    });

    test('excludeBookingId allows reschedule to same time', async () => {
      // Add booking: 10:00-10:30
      const booking = await prisma.booking.create({
        data: {
          businessId: testBusiness.id,
          businessServiceId: testService30.id,
          slotId: testSlot.id,
          startTime: '10:00',
          endTime: '10:30',
          customerName: 'Test Customer',
          customerPhone: '0501234567',
          price: 120,
          status: 'CONFIRMED'
        }
      });

      // Without excludeBookingId: 10:00 should be blocked
      const timesWithout = await getLegalStartTimes(prisma, testSlot.id, testService30.id);
      const has10_00Without = timesWithout.find(t => t.startTime === '10:00');
      expect(has10_00Without).toBeUndefined();

      // With excludeBookingId: 10:00 should be available
      const timesWith = await getLegalStartTimes(
        prisma,
        testSlot.id,
        testService30.id,
        booking.id
      );
      const has10_00With = timesWith.find(t => t.startTime === '10:00');
      expect(has10_00With).toBeDefined();
    });

    test('calculates gaps within free intervals', async () => {
      // Create larger slot: 10:00-13:00
      const largeSlot = await prisma.slot.create({
        data: {
          businessId: testBusiness.id,
          date: '2026-07-10',
          startTime: '10:00',
          endTime: '13:00',
          status: 'OPEN'
        }
      });

      await prisma.slotAllowedService.create({
        data: { slotId: largeSlot.id, businessServiceId: testService30.id }
      });

      // Add booking in middle: 11:00-11:30
      await prisma.booking.create({
        data: {
          businessId: testBusiness.id,
          businessServiceId: testService30.id,
          slotId: largeSlot.id,
          startTime: '11:00',
          endTime: '11:30',
          customerName: 'Test',
          customerPhone: '0501234567',
          price: 120,
          status: 'CONFIRMED'
        }
      });

      const times = await getLegalStartTimes(prisma, largeSlot.id, testService30.id);

      // Free intervals: [10:00-11:00], [11:30-13:00]
      // Each interval: 60 min, Service: 30 min
      // Interval 1 should have: 10:00, 10:15, 10:30 (10:30-11:00 is valid)
      // Interval 2 should have: 11:30, 11:45, 12:00, 12:15, 12:30 (12:30-13:00 is valid)
      expect(times.length).toBeGreaterThanOrEqual(5);

      // Cleanup
      await prisma.slotAllowedService.deleteMany({ where: { slotId: largeSlot.id } });
      await prisma.booking.deleteMany({ where: { slotId: largeSlot.id } });
      await prisma.slot.delete({ where: { id: largeSlot.id } });
    });

    test('service not allowed in slot throws error', async () => {
      // Try to get times for testService45 which is not in allowedServices
      await expect(
        getLegalStartTimes(prisma, testSlot.id, testService45.id)
      ).rejects.toThrow('Service not allowed in this slot');
    });
  });

  describe('hasRemainingCapacity', () => {
    let testBusiness, testUser, testField, testProfession, testService30, testTemplate, testSlot;

    beforeAll(async () => {
      testUser = await prisma.user.findFirst({
        where: { role: 'SERVICE_PROVIDER' }
      });

      // Create test field
      testField = await prisma.field.create({
        data: {
          name: 'Test Field Capacity Sprint A',
          nameHebrew: 'תחום קיבולת ספרינט A',
          displayOrder: 0,
          status: 'ACTIVE'
        }
      });

      // Create test profession
      testProfession = await prisma.profession.create({
        data: {
          fieldId: testField.id,
          name: 'Test Profession Capacity Sprint A',
          nameHebrew: 'מקצוע קיבולת ספרינט A',
          displayOrder: 0,
          status: 'ACTIVE'
        }
      });

      testBusiness = await prisma.business.create({
        data: {
          name: 'Test Salon Capacity',
          ownerId: testUser.id,
          cityCode: 5000,
          categoryId: 1,
          phone: '0502222222',
          identifierType: 'ISRAELI_ID',
          identifierValue: '223456789'
        }
      });

      testTemplate = await prisma.serviceTemplate.create({
        data: {
          name: 'Test Service Capacity',
          nameHebrew: 'שירות קיבולת',
          professionId: testProfession.id,
          defaultDurationMinutes: 30,
          defaultPrice: 100
        }
      });

      testService30 = await prisma.businessService.create({
        data: {
          businessId: testBusiness.id,
          name: 'Service Capacity',
          durationMinutes: 30,
          regularPrice: 100,
          serviceTemplateId: testTemplate.id,
          approvalStatus: 'APPROVED'
        }
      });
    });

    afterAll(async () => {
      await prisma.businessService.deleteMany({ where: { businessId: testBusiness.id } });
      await prisma.serviceTemplate.delete({ where: { id: testTemplate.id } });
      await prisma.business.delete({ where: { id: testBusiness.id } });
      await prisma.profession.delete({ where: { id: testProfession.id } });
      await prisma.field.delete({ where: { id: testField.id } });
    });

    beforeEach(async () => {
      testSlot = await prisma.slot.create({
        data: {
          businessId: testBusiness.id,
          date: '2026-07-11',
          startTime: '10:00',
          endTime: '11:00',
          status: 'OPEN'
        }
      });

      await prisma.slotAllowedService.create({
        data: { slotId: testSlot.id, businessServiceId: testService30.id }
      });
    });

    afterEach(async () => {
      await prisma.slotAllowedService.deleteMany({ where: { slotId: testSlot.id } });
      await prisma.booking.deleteMany({ where: { slotId: testSlot.id } });
      await prisma.slot.delete({ where: { id: testSlot.id } });
    });

    test('empty slot has remaining capacity', async () => {
      const hasCapacity = await hasRemainingCapacity(prisma, testSlot.id);
      expect(hasCapacity).toBe(true);
    });

    test('fully booked slot has no remaining capacity', async () => {
      // Fill the slot: 10:00-10:30, 10:30-11:00
      await prisma.booking.createMany({
        data: [
          {
            businessId: testBusiness.id,
            businessServiceId: testService30.id,
            slotId: testSlot.id,
            startTime: '10:00',
            endTime: '10:30',
            customerName: 'Customer 1',
            customerPhone: '0501111111',
            price: 100,
            status: 'CONFIRMED'
          },
          {
            businessId: testBusiness.id,
            businessServiceId: testService30.id,
            slotId: testSlot.id,
            startTime: '10:30',
            endTime: '11:00',
            customerName: 'Customer 2',
            customerPhone: '0502222222',
            price: 100,
            status: 'CONFIRMED'
          }
        ]
      });

      const hasCapacity = await hasRemainingCapacity(prisma, testSlot.id);
      expect(hasCapacity).toBe(false);
    });
  });

  describe('recalculateSlotStatus', () => {
    let testBusiness, testUser, testField, testProfession, testService30, testTemplate, testSlot;

    beforeAll(async () => {
      testUser = await prisma.user.findFirst({
        where: { role: 'SERVICE_PROVIDER' }
      });

      // Create test field
      testField = await prisma.field.create({
        data: {
          name: 'Test Field Status Sprint A',
          nameHebrew: 'תחום סטטוס ספרינט A',
          displayOrder: 0,
          status: 'ACTIVE'
        }
      });

      // Create test profession
      testProfession = await prisma.profession.create({
        data: {
          fieldId: testField.id,
          name: 'Test Profession Status Sprint A',
          nameHebrew: 'מקצוע סטטוס ספרינט A',
          displayOrder: 0,
          status: 'ACTIVE'
        }
      });

      testBusiness = await prisma.business.create({
        data: {
          name: 'Test Salon Status',
          ownerId: testUser.id,
          cityCode: 5000,
          categoryId: 1,
          phone: '0503333333',
          identifierType: 'ISRAELI_ID',
          identifierValue: '323456789'
        }
      });

      testTemplate = await prisma.serviceTemplate.create({
        data: {
          name: 'Test Service Status',
          nameHebrew: 'שירות סטטוס',
          professionId: testProfession.id,
          defaultDurationMinutes: 30,
          defaultPrice: 100
        }
      });

      testService30 = await prisma.businessService.create({
        data: {
          businessId: testBusiness.id,
          name: 'Service Status',
          durationMinutes: 30,
          regularPrice: 100,
          serviceTemplateId: testTemplate.id,
          approvalStatus: 'APPROVED'
        }
      });
    });

    afterAll(async () => {
      await prisma.businessService.deleteMany({ where: { businessId: testBusiness.id } });
      await prisma.serviceTemplate.delete({ where: { id: testTemplate.id } });
      await prisma.business.delete({ where: { id: testBusiness.id } });
      await prisma.profession.delete({ where: { id: testProfession.id } });
      await prisma.field.delete({ where: { id: testField.id } });
    });

    beforeEach(async () => {
      testSlot = await prisma.slot.create({
        data: {
          businessId: testBusiness.id,
          date: '2026-07-12',
          startTime: '10:00',
          endTime: '11:00',
          status: 'OPEN'
        }
      });

      await prisma.slotAllowedService.create({
        data: { slotId: testSlot.id, businessServiceId: testService30.id }
      });
    });

    afterEach(async () => {
      await prisma.slotAllowedService.deleteMany({ where: { slotId: testSlot.id } });
      await prisma.booking.deleteMany({ where: { slotId: testSlot.id } });
      await prisma.slot.delete({ where: { id: testSlot.id } });
    });

    test('slot with no bookings becomes OPEN', async () => {
      await recalculateSlotStatus(prisma, testSlot.id);

      const updated = await prisma.slot.findUnique({ where: { id: testSlot.id } });
      expect(updated.status).toBe('OPEN');
    });

    test('fully booked slot becomes FULL', async () => {
      // Fill the slot completely
      await prisma.booking.createMany({
        data: [
          {
            businessId: testBusiness.id,
            businessServiceId: testService30.id,
            slotId: testSlot.id,
            startTime: '10:00',
            endTime: '10:30',
            customerName: 'Customer 1',
            customerPhone: '0501111111',
            price: 100,
            status: 'CONFIRMED'
          },
          {
            businessId: testBusiness.id,
            businessServiceId: testService30.id,
            slotId: testSlot.id,
            startTime: '10:30',
            endTime: '11:00',
            customerName: 'Customer 2',
            customerPhone: '0502222222',
            price: 100,
            status: 'CONFIRMED'
          }
        ]
      });

      await recalculateSlotStatus(prisma, testSlot.id);

      const updated = await prisma.slot.findUnique({ where: { id: testSlot.id } });
      expect(updated.status).toBe('FULL');
    });

    test('partially booked slot remains OPEN', async () => {
      // Add one booking
      await prisma.booking.create({
        data: {
          businessId: testBusiness.id,
          businessServiceId: testService30.id,
          slotId: testSlot.id,
          startTime: '10:00',
          endTime: '10:30',
          customerName: 'Customer 1',
          customerPhone: '0501111111',
          price: 100,
          status: 'CONFIRMED'
        }
      });

      await recalculateSlotStatus(prisma, testSlot.id);

      const updated = await prisma.slot.findUnique({ where: { id: testSlot.id } });
      expect(updated.status).toBe('OPEN'); // Still has capacity for 10:30-11:00
    });
  });
});
