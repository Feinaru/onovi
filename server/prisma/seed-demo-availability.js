/**
 * Demo Availability Data Seed
 *
 * Creates realistic demo data for the "provider opens availability windows" booking model.
 *
 * This script is idempotent and safe to run multiple times.
 * It uses upsert with stable identifiers to avoid duplicates.
 *
 * Usage:
 *   node server/prisma/seed-demo-availability.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding demo availability data...\n');

  // ============================================================================
  // STEP 1: Ensure users exist
  // ============================================================================

  const businessPassword = await bcrypt.hash('123456', 10);
  const customerPassword = await bcrypt.hash('123456', 10);

  const businessUser = await prisma.user.upsert({
    where: { phone: '0500000002' },
    update: {},
    create: {
      fullName: 'ספק שירות דמו',
      phone: '0500000002',
      email: 'business@timefill.local',
      passwordHash: businessPassword,
      role: 'SERVICE_PROVIDER',
      status: 'ACTIVE'
    }
  });

  await prisma.user.upsert({
    where: { phone: '0500000003' },
    update: {},
    create: {
      fullName: 'לקוח דמו',
      phone: '0500000003',
      email: 'customer@timefill.local',
      passwordHash: customerPassword,
      role: 'CUSTOMER',
      status: 'ACTIVE'
    }
  });

  console.log('✅ Users verified/created');

  // ============================================================================
  // STEP 2: Ensure category exists
  // ============================================================================

  const hairCategory = await prisma.category.upsert({
    where: { name: 'שירותי שיער וטיפוח' },
    update: {},
    create: {
      name: 'שירותי שיער וטיפוח',
      icon: 'hair',
      displayOrder: 1,
      isActive: true
    }
  });

  console.log('✅ Category verified/created');

  // ============================================================================
  // STEP 3: Create demo business
  // ============================================================================

  const demoBusiness = await prisma.business.upsert({
    where: {
      identifierType_identifierValue: {
        identifierType: 'COMPANY_NUMBER',
        identifierValue: 'DEMO-HAIR-001'
      }
    },
    update: {
      name: 'מספרת לומאה דמו',
      description: 'מספרה דמו להדגמת מודל זמינות חלונות',
      ownerId: businessUser.id,
      categoryId: hairCategory.id,
      phone: '0500000100',
      city: 'תל אביב',
      cityCode: 5000,
      cityNameHebrew: 'תל אביב-יפו',
      latitude: 32.0853,
      longitude: 34.7818,
      status: 'ACTIVE'
    },
    create: {
      name: 'מספרת לומאה דמו',
      description: 'מספרה דמו להדגמת מודל זמינות חלונות',
      ownerId: businessUser.id,
      categoryId: hairCategory.id,
      phone: '0500000100',
      identifierType: 'COMPANY_NUMBER',
      identifierValue: 'DEMO-HAIR-001',
      city: 'תל אביב',
      cityCode: 5000,
      cityNameHebrew: 'תל אביב-יפו',
      latitude: 32.0853,
      longitude: 34.7818,
      status: 'ACTIVE'
    }
  });

  console.log(`✅ Demo business: ${demoBusiness.name} (ID: ${demoBusiness.id})`);

  // ============================================================================
  // STEP 3.5: Create approval for demo business (required for public profile)
  // ============================================================================

  const existingApproval = await prisma.serviceProviderApproval.findFirst({
    where: { serviceProviderId: demoBusiness.id }
  });

  if (existingApproval) {
    await prisma.serviceProviderApproval.update({
      where: { id: existingApproval.id },
      data: { status: 'APPROVED' }
    });
  } else {
    await prisma.serviceProviderApproval.create({
      data: {
        serviceProviderId: demoBusiness.id,
        status: 'APPROVED',
        adminNote: 'Auto-approved demo business'
      }
    });
  }

  console.log('✅ Demo business approval created/verified');

  // ============================================================================
  // STEP 4: Create services with different durations
  // ============================================================================

  const services = [
    { name: 'תספורת גבר', duration: 30, price: 80 },
    { name: 'תספורת אישה', duration: 60, price: 150 },
    { name: 'צבע שורש', duration: 90, price: 220 },
    { name: 'החלקה', duration: 120, price: 600 }
  ];

  const createdServices = [];

  for (const svc of services) {
    const service = await prisma.businessService.upsert({
      where: {
        id: -1 // Force create new if not found by businessId+name combination
      },
      update: {},
      create: {
        businessId: demoBusiness.id,
        name: svc.name,
        durationMinutes: svc.duration,
        regularPrice: svc.price,
        active: true,
        visibleToCustomers: true,
        approvalStatus: 'APPROVED'
      }
    }).catch(async () => {
      // If upsert fails (likely due to unique constraint), find existing
      return await prisma.businessService.findFirst({
        where: {
          businessId: demoBusiness.id,
          name: svc.name
        }
      }) || await prisma.businessService.create({
        data: {
          businessId: demoBusiness.id,
          name: svc.name,
          durationMinutes: svc.duration,
          regularPrice: svc.price,
          active: true,
          visibleToCustomers: true,
          approvalStatus: 'APPROVED'
        }
      });
    });

    createdServices.push(service);
    console.log(`  ✅ ${service.name} — ${service.durationMinutes} דקות — ₪${service.regularPrice}`);
  }

  const [menHaircut, womenHaircut, rootColor, straightening] = createdServices;

  // ============================================================================
  // STEP 5: Clean up old demo slots (optional - keeps data fresh)
  // ============================================================================

  // Delete old demo slots for this business only (safe)
  await prisma.slot.deleteMany({
    where: {
      businessId: demoBusiness.id,
      date: {
        lt: '2026-07-10' // Clean up any old demo dates
      }
    }
  });

  // ============================================================================
  // STEP 6: Create availability windows (slots)
  // ============================================================================

  console.log('\n📅 Creating availability windows...');

  // Generate dynamic dates (always future)
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(today.getDate() + 2);

  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const dayAfterTomorrowStr = dayAfterTomorrow.toISOString().split('T')[0];

  console.log(`  Using dynamic dates: tomorrow=${tomorrowStr}, dayAfter=${dayAfterTomorrowStr}`);

  const slots = [];

  // Window 1: Tomorrow, 10:00-12:00, allows 30min + 60min services
  const slot1 = await prisma.slot.create({
    data: {
      businessId: demoBusiness.id,
      date: tomorrowStr,
      startTime: '10:00',
      endTime: '12:00',
      status: 'OPEN',
      color: '#10b981',
      title: 'זמינות בוקר'
    }
  });
  slots.push(slot1);

  await prisma.slotAllowedService.createMany({
    data: [
      { slotId: slot1.id, businessServiceId: menHaircut.id },
      { slotId: slot1.id, businessServiceId: womenHaircut.id }
    ],
    skipDuplicates: true
  });

  console.log(`  ✅ חלון 1: ${tomorrowStr}, 10:00-12:00 (תספורת גבר, תספורת אישה)`);

  // Window 2: Tomorrow, 13:00-15:00, allows 60min + 90min services
  const slot2 = await prisma.slot.create({
    data: {
      businessId: demoBusiness.id,
      date: tomorrowStr,
      startTime: '13:00',
      endTime: '15:00',
      status: 'OPEN',
      color: '#10b981',
      title: 'זמינות צהריים'
    }
  });
  slots.push(slot2);

  await prisma.slotAllowedService.createMany({
    data: [
      { slotId: slot2.id, businessServiceId: womenHaircut.id },
      { slotId: slot2.id, businessServiceId: rootColor.id }
    ],
    skipDuplicates: true
  });

  console.log(`  ✅ חלון 2: ${tomorrowStr}, 13:00-15:00 (תספורת אישה, צבע שורש)`);

  // Window 3: Day after tomorrow, 09:00-11:00, allows 30min + 120min services
  const slot3 = await prisma.slot.create({
    data: {
      businessId: demoBusiness.id,
      date: dayAfterTomorrowStr,
      startTime: '09:00',
      endTime: '11:00',
      status: 'OPEN',
      color: '#10b981',
      title: 'זמינות בוקר'
    }
  });
  slots.push(slot3);

  await prisma.slotAllowedService.createMany({
    data: [
      { slotId: slot3.id, businessServiceId: menHaircut.id },
      { slotId: slot3.id, businessServiceId: straightening.id }
    ],
    skipDuplicates: true
  });

  console.log(`  ✅ חלון 3: ${dayAfterTomorrowStr}, 09:00-11:00 (תספורת גבר, החלקה)`);

  // Window 4: Day after tomorrow, 16:00-18:00, allows all services
  const slot4 = await prisma.slot.create({
    data: {
      businessId: demoBusiness.id,
      date: dayAfterTomorrowStr,
      startTime: '16:00',
      endTime: '18:00',
      status: 'OPEN',
      color: '#10b981',
      title: 'זמינות אחר צהריים'
    }
  });
  slots.push(slot4);

  await prisma.slotAllowedService.createMany({
    data: [
      { slotId: slot4.id, businessServiceId: menHaircut.id },
      { slotId: slot4.id, businessServiceId: womenHaircut.id },
      { slotId: slot4.id, businessServiceId: rootColor.id }
      // Note: 120min service doesn't fit in 2-hour window with no-dead-edge rule, so excluded
    ],
    skipDuplicates: true
  });

  console.log(`  ✅ חלון 4: 2026-07-11, 16:00-18:00 (כל השירותים הקצרים)`);

  // ============================================================================
  // STEP 7: Create one demo booking to show partial occupancy
  // ============================================================================

  console.log('\n📝 Creating demo booking to show partial window occupancy...');

  const customerUser = await prisma.user.findUnique({
    where: { phone: '0500000003' }
  });

  // Book 10:30-11:00 in window 1 (30min haircut)
  // This will reduce available legal start times in that window
  await prisma.booking.create({
    data: {
      customerId: customerUser.id,
      businessId: demoBusiness.id,
      businessServiceId: menHaircut.id,
      slotId: slot1.id,
      startTime: '10:30',
      endTime: '11:00',
      customerName: 'לקוח דמו',
      customerPhone: '0500000003',
      price: menHaircut.regularPrice,
      status: 'CONFIRMED'
    }
  });

  console.log(`  ✅ הזמנה: 10:30-11:00 בחלון 1 (תספורת גבר, מאושרת)`);

  // ============================================================================
  // SUMMARY
  // ============================================================================

  console.log('\n✨ Demo availability data seeded successfully!\n');
  console.log('═══════════════════════════════════════════════════');
  console.log('📊 Summary:');
  console.log(`   Business: ${demoBusiness.name} (ID: ${demoBusiness.id})`);
  console.log(`   Services: ${createdServices.length}`);
  console.log(`   Availability Windows: ${slots.length}`);
  console.log(`   Demo Bookings: 1 (partial occupancy in window 1)`);
  console.log('═══════════════════════════════════════════════════');
  console.log('\n🔑 Login credentials:');
  console.log('   Business: 0500000002 / 123456');
  console.log('   Customer: 0500000003 / 123456');
  console.log('\n🧪 Test customer search:');
  console.log('   GET /api/slots?date=2026-07-10');
  console.log('   GET /api/slots?date=2026-07-11');
  console.log('\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
