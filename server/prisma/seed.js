require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('../src/lib/prisma');

// ---------------------------------------------------------------------------
// Idempotent, NON-DESTRUCTIVE seed.
//
// - No deleteMany / no DB reset: safe to run repeatedly. Existing local data
//   (users, businesses, services, service groups, slots, bookings) is preserved.
// - Ensures the three authoritative demo accounts, a PASSWORD auth identity for
//   each, and completed onboarding.
// - Roles of EXISTING users are left untouched (no role migration in this batch).
//   New users (fresh DB only) are created with the official role names.
//
// A destructive reset is intentionally NOT provided here; use `npm run db:reset`
// (prisma migrate reset) if a full wipe is genuinely required.
//
// Authoritative demo credentials:
//   Admin:            0500000001 / admin123
//   Service Provider: 0500000002 / 123456
//   Service Recipient:0500000003 / 123456
// ---------------------------------------------------------------------------

// Stable future date so demo slots are never seeded in the past.
function futureDate(daysAhead) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

const DEMO_USERS = [
  {
    phone: '0500000001',
    fullName: 'Admin',
    email: 'admin@timefill.local',
    password: 'admin123',
    role: 'ADMIN', // used only when creating a brand-new user (fresh DB)
    onboardingType: 'NONE'
  },
  {
    phone: '0500000002',
    fullName: 'עסק דמו',
    email: 'business@timefill.local',
    password: '123456',
    role: 'SERVICE_PROVIDER',
    onboardingType: 'SERVICE_PROVIDER'
  },
  {
    phone: '0500000003',
    fullName: 'לקוח דמו',
    email: 'customer@timefill.local',
    password: '123456',
    role: 'SERVICE_RECIPIENT',
    onboardingType: 'SERVICE_RECIPIENT'
  }
];

async function upsertDemoUser(demo) {
  const passwordHash = await bcrypt.hash(demo.password, 10);

  const user = await prisma.user.upsert({
    where: { phone: demo.phone },
    // NOTE: `role` is deliberately excluded from `update` so existing users keep
    // their current role (no role migration in this task).
    update: {
      fullName: demo.fullName,
      email: demo.email,
      passwordHash,
      onboardingStatus: 'COMPLETED',
      onboardingType: demo.onboardingType
    },
    create: {
      fullName: demo.fullName,
      phone: demo.phone,
      email: demo.email,
      passwordHash,
      role: demo.role,
      onboardingStatus: 'COMPLETED',
      onboardingType: demo.onboardingType
    }
  });

  // A PASSWORD auth identity mirrors the user's password (Phase 1 foundation).
  await prisma.authIdentity.upsert({
    where: { userId_provider: { userId: user.id, provider: 'PASSWORD' } },
    update: { passwordHash, providerEmail: demo.email },
    create: {
      userId: user.id,
      provider: 'PASSWORD',
      passwordHash,
      providerEmail: demo.email
    }
  });

  return user;
}

async function seedCategories() {
  const massage = await prisma.category.upsert({
    where: { name: 'עיסוי' },
    update: {},
    create: { name: 'עיסוי', icon: 'massage', displayOrder: 1 }
  });
  await prisma.category.upsert({
    where: { name: 'קוסמטיקה' },
    update: {},
    create: { name: 'קוסמטיקה', icon: 'beauty', displayOrder: 2 }
  });
  return { massage };
}

async function seedDemoBusiness(ownerId, categoryId) {
  // Upsert by the business's unique official identifier. `update: {}` keeps any
  // local edits to the demo business intact on re-run.
  const business = await prisma.business.upsert({
    where: {
      identifierType_identifierValue: {
        identifierType: 'COMPANY_NUMBER',
        identifierValue: '500000001'
      }
    },
    update: {},
    create: {
      ownerId,
      categoryId,
      name: 'סטודיו עיסוי לדוגמה',
      description: 'עסק לדוגמה לבדיקת המערכת',
      phone: '0500000000',
      identifierType: 'COMPANY_NUMBER',
      identifierValue: '500000001',
      city: 'רחובות',
      status: 'ACTIVE'
    }
  });

  // BusinessService has no natural unique key here, so guard by (business, name).
  let service = await prisma.businessService.findFirst({
    where: { businessId: business.id, name: 'עיסוי שוודי 60 דקות' }
  });
  if (!service) {
    service = await prisma.businessService.create({
      data: {
        businessId: business.id,
        name: 'עיסוי שוודי 60 דקות',
        durationMinutes: 60,
        regularPrice: 250,
        approvalStatus: 'APPROVED'
      }
    });
  }

  // Demo slot: guard by a stable marker so re-runs never duplicate it, even on a
  // different day. Created with a dynamic future date (not a hardcoded past one).
  const existingSlot = await prisma.slot.findFirst({
    where: { businessId: business.id, note: 'תור פנוי לדוגמה' }
  });
  if (!existingSlot) {
    await prisma.slot.create({
      data: {
        businessId: business.id,
        serviceId: service.id,
        date: futureDate(7),
        startTime: '17:30',
        endTime: '18:30',
        regularPrice: 250,
        dealPrice: 180,
        note: 'תור פנוי לדוגמה'
      }
    });
  }

  return business;
}

async function main() {
  const users = {};
  for (const demo of DEMO_USERS) {
    const user = await upsertDemoUser(demo);
    users[demo.role] = user;
    users[demo.phone] = user;
  }

  const { massage } = await seedCategories();

  // Demo business is owned by the service-provider demo account.
  const provider = users['0500000002'];
  await seedDemoBusiness(provider.id, massage.id);

  console.log('Seed completed (idempotent, non-destructive)');
  console.log('Admin:            0500000001 / admin123');
  console.log('Service Provider: 0500000002 / 123456');
  console.log('Service Recipient:0500000003 / 123456');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
