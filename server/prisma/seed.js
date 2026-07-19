require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('../src/lib/prisma');

async function main() {
  await prisma.booking.deleteMany();
  await prisma.slot.deleteMany();
  await prisma.service.deleteMany();
  await prisma.business.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const adminPassword = await bcrypt.hash('123456', 10);
  const businessPassword = await bcrypt.hash('123456', 10);
  const customerPassword = await bcrypt.hash('123456', 10);

  const admin = await prisma.user.create({
    data: { fullName: 'Admin', phone: '0500000001', email: 'admin@timefill.local', passwordHash: adminPassword, role: 'ADMIN', onboardingStatus: 'COMPLETED', onboardingType: 'NONE' }
  });

  // NOTE: 0500000002 is seeded as legacy role BUSINESS (unchanged in Phase 1). onboardingType maps to SERVICE_PROVIDER.
  const businessUser = await prisma.user.create({
    data: { fullName: 'עסק דמו', phone: '0500000002', email: 'business@timefill.local', passwordHash: businessPassword, role: 'BUSINESS', onboardingStatus: 'COMPLETED', onboardingType: 'SERVICE_PROVIDER' }
  });

  const customerUser = await prisma.user.create({
    data: { fullName: 'לקוח דמו', phone: '0500000003', email: 'customer@timefill.local', passwordHash: customerPassword, role: 'CUSTOMER', onboardingStatus: 'COMPLETED', onboardingType: 'SERVICE_RECIPIENT' }
  });

  // Auth identities (Phase 1) - a PASSWORD identity mirrors each user's passwordHash
  await prisma.authIdentity.createMany({
    data: [
      { userId: admin.id, provider: 'PASSWORD', passwordHash: adminPassword, providerEmail: admin.email },
      { userId: businessUser.id, provider: 'PASSWORD', passwordHash: businessPassword, providerEmail: businessUser.email },
      { userId: customerUser.id, provider: 'PASSWORD', passwordHash: customerPassword, providerEmail: customerUser.email }
    ]
  });

  const massage = await prisma.category.create({ data: { name: 'עיסוי', icon: 'massage', displayOrder: 1 } });
  await prisma.category.create({ data: { name: 'קוסמטיקה', icon: 'beauty', displayOrder: 2 } });

  const business = await prisma.business.create({
    data: {
      ownerId: businessUser.id,
      categoryId: massage.id,
      name: 'סטודיו עיסוי לדוגמה',
      description: 'עסק לדוגמה לבדיקת המערכת',
      phone: '0500000000',
      identifierType: 'COMPANY_NUMBER',
      identifierValue: '500000001',
      city: 'רחובות',
      status: 'ACTIVE'
    }
  });

  const service = await prisma.service.create({
    data: { businessId: business.id, name: 'עיסוי שוודי 60 דקות', durationMinutes: 60, regularPrice: 250 }
  });

  await prisma.slot.create({
    data: {
      businessId: business.id,
      serviceId: service.id,
      date: '2026-06-25',
      startTime: '17:30',
      endTime: '18:30',
      regularPrice: 250,
      dealPrice: 180,
      note: 'תור פנוי לדוגמה'
    }
  });

  console.log('Seed completed');
  console.log('Admin: 0500000001 / 123456');
  console.log('Business: 0500000002 / 123456');
  console.log('Customer: 0500000003 / 123456');
}

main().finally(() => prisma.$disconnect());
