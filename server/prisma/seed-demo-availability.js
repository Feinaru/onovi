/**
 * Demo Availability Data Seed - Enhanced for MVP Demo
 *
 * Creates realistic demo data for impressive local demo presentation.
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
  console.log('🌱 Seeding enhanced demo data for MVP demo...\n');

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

  const customerUser = await prisma.user.upsert({
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
  // STEP 2: Ensure categories exist
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

  const wellnessCategory = await prisma.category.upsert({
    where: { name: 'יופי ובריאות' },
    update: {},
    create: {
      name: 'יופי ובריאות',
      icon: 'spa',
      displayOrder: 2,
      isActive: true
    }
  });

  console.log('✅ Categories verified/created');

  // ============================================================================
  // STEP 3: Create demo businesses
  // ============================================================================

  console.log('\n🏢 Creating demo businesses...');

  // Business 1: Hair Salon in Tel Aviv
  const hairBusiness = await prisma.business.upsert({
    where: {
      identifierType_identifierValue: {
        identifierType: 'COMPANY_NUMBER',
        identifierValue: 'DEMO-HAIR-001'
      }
    },
    update: {
      name: 'מספרת לומאה דמו',
      description: 'מספרה מובילה בתל אביב המתמחה בתספורות ועיצוב שיער',
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
      description: 'מספרה מובילה בתל אביב המתמחה בתספורות ועיצוב שיער',
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
  console.log(`  ✅ ${hairBusiness.name} (Tel Aviv)`);

  // Business 2: Massage Clinic in Jerusalem
  const massageBusiness = await prisma.business.upsert({
    where: {
      identifierType_identifierValue: {
        identifierType: 'COMPANY_NUMBER',
        identifierValue: 'DEMO-MASSAGE-002'
      }
    },
    update: {
      name: 'מכון עיסוי ירושלים',
      description: 'מכון עיסוי מקצועי במרכז ירושלים - עיסויים טיפוליים ומרגיעים',
      ownerId: businessUser.id,
      categoryId: wellnessCategory.id,
      phone: '0500000101',
      city: 'ירושלים',
      cityCode: 3000,
      cityNameHebrew: 'ירושלים',
      latitude: 31.7683,
      longitude: 35.2137,
      status: 'ACTIVE'
    },
    create: {
      name: 'מכון עיסוי ירושלים',
      description: 'מכון עיסוי מקצועי במרכז ירושלים - עיסויים טיפוליים ומרגיעים',
      ownerId: businessUser.id,
      categoryId: wellnessCategory.id,
      phone: '0500000101',
      identifierType: 'COMPANY_NUMBER',
      identifierValue: 'DEMO-MASSAGE-002',
      city: 'ירושלים',
      cityCode: 3000,
      cityNameHebrew: 'ירושלים',
      latitude: 31.7683,
      longitude: 35.2137,
      status: 'ACTIVE'
    }
  });
  console.log(`  ✅ ${massageBusiness.name} (Jerusalem)`);

  // Business 3: Beauty Studio in Haifa
  const beautyBusiness = await prisma.business.upsert({
    where: {
      identifierType_identifierValue: {
        identifierType: 'COMPANY_NUMBER',
        identifierValue: 'DEMO-BEAUTY-003'
      }
    },
    update: {
      name: 'סטודיו יופי חיפה',
      description: 'סטודיו יופי מקצועי המציע טיפולי פנים ויופי',
      ownerId: businessUser.id,
      categoryId: wellnessCategory.id,
      phone: '0500000102',
      city: 'חיפה',
      cityCode: 4000,
      cityNameHebrew: 'חיפה',
      latitude: 32.7940,
      longitude: 34.9896,
      status: 'ACTIVE'
    },
    create: {
      name: 'סטודיו יופי חיפה',
      description: 'סטודיו יופי מקצועי המציע טיפולי פנים ויופי',
      ownerId: businessUser.id,
      categoryId: wellnessCategory.id,
      phone: '0500000102',
      identifierType: 'COMPANY_NUMBER',
      identifierValue: 'DEMO-BEAUTY-003',
      city: 'חיפה',
      cityCode: 4000,
      cityNameHebrew: 'חיפה',
      latitude: 32.7940,
      longitude: 34.9896,
      status: 'ACTIVE'
    }
  });
  console.log(`  ✅ ${beautyBusiness.name} (Haifa)`);

  // ============================================================================
  // STEP 3.5: Create approvals for all demo businesses
  // ============================================================================

  console.log('\n✅ Creating/updating business approvals...');

  for (const business of [hairBusiness, massageBusiness, beautyBusiness]) {
    const existingApproval = await prisma.serviceProviderApproval.findFirst({
      where: { serviceProviderId: business.id }
    });

    if (existingApproval) {
      await prisma.serviceProviderApproval.update({
        where: { id: existingApproval.id },
        data: { status: 'APPROVED', adminNote: 'Auto-approved demo business' }
      });
    } else {
      await prisma.serviceProviderApproval.create({
        data: {
          serviceProviderId: business.id,
          status: 'APPROVED',
          adminNote: 'Auto-approved demo business'
        }
      });
    }
  }

  console.log('  ✅ All businesses approved');

  // ============================================================================
  // STEP 4: Create services
  // ============================================================================

  console.log('\n✂️ Creating services...');

  // Helper function to create/find service
  async function createService(businessId, name, duration, price) {
    const existing = await prisma.businessService.findFirst({
      where: { businessId, name }
    });

    if (existing) {
      return existing;
    }

    return await prisma.businessService.create({
      data: {
        businessId,
        name,
        durationMinutes: duration,
        regularPrice: price,
        active: true,
        visibleToCustomers: true,
        approvalStatus: 'APPROVED'
      }
    });
  }

  // Hair Salon Services
  const hairServices = [];
  hairServices.push(await createService(hairBusiness.id, 'תספורת גבר', 30, 80));
  hairServices.push(await createService(hairBusiness.id, 'תספורת אישה', 60, 150));
  hairServices.push(await createService(hairBusiness.id, 'צבע שורש', 90, 220));
  hairServices.push(await createService(hairBusiness.id, 'החלקה', 120, 600));
  hairServices.push(await createService(hairBusiness.id, 'פן', 45, 120));
  hairServices.push(await createService(hairBusiness.id, 'עיצוב שיער לאירוע', 90, 350));

  console.log(`  ✅ ${hairBusiness.name}: ${hairServices.length} services`);

  // Massage Clinic Services
  const massageServices = [];
  massageServices.push(await createService(massageBusiness.id, 'עיסוי שוודי', 60, 250));
  massageServices.push(await createService(massageBusiness.id, 'עיסוי תאילנדי', 75, 320));
  massageServices.push(await createService(massageBusiness.id, 'עיסוי רקמות עמוק', 60, 300));

  console.log(`  ✅ ${massageBusiness.name}: ${massageServices.length} services`);

  // Beauty Studio Services
  const beautyServices = [];
  beautyServices.push(await createService(beautyBusiness.id, 'טיפול פנים', 60, 280));
  beautyServices.push(await createService(beautyBusiness.id, 'מניקור ג׳ל', 45, 120));
  beautyServices.push(await createService(beautyBusiness.id, 'הסרת שיער', 30, 90));

  console.log(`  ✅ ${beautyBusiness.name}: ${beautyServices.length} services`);

  // ============================================================================
  // STEP 5: Clean up old demo slots
  // ============================================================================

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  await prisma.slot.deleteMany({
    where: {
      businessId: { in: [hairBusiness.id, massageBusiness.id, beautyBusiness.id] },
      date: { lt: todayStr }
    }
  });

  // ============================================================================
  // STEP 6: Create availability windows (dynamic dates)
  // ============================================================================

  console.log('\n📅 Creating availability windows...');

  // Helper function to get date offset
  function getDateOffset(daysFromToday) {
    const date = new Date(today);
    date.setDate(today.getDate() + daysFromToday);
    return date.toISOString().split('T')[0];
  }

  // Helper function to create slot
  async function createSlot(businessId, dateOffset, startTime, endTime, title, allowedServiceIds) {
    const slot = await prisma.slot.create({
      data: {
        businessId,
        date: getDateOffset(dateOffset),
        startTime,
        endTime,
        status: 'OPEN',
        color: '#10b981',
        title
      }
    });

    if (allowedServiceIds && allowedServiceIds.length > 0) {
      await prisma.slotAllowedService.createMany({
        data: allowedServiceIds.map(serviceId => ({
          slotId: slot.id,
          businessServiceId: serviceId
        })),
        skipDuplicates: true
      });
    }

    return slot;
  }

  // Hair Salon Availability (Tel Aviv)
  const hairSlots = [];
  hairSlots.push(await createSlot(hairBusiness.id, 1, '09:00', '13:00', 'זמינות בוקר', [hairServices[0].id, hairServices[1].id, hairServices[4].id]));
  hairSlots.push(await createSlot(hairBusiness.id, 1, '14:00', '18:00', 'זמינות אחר צהריים', [hairServices[1].id, hairServices[2].id]));
  hairSlots.push(await createSlot(hairBusiness.id, 3, '10:00', '16:00', 'יום מלא', [hairServices[0].id, hairServices[1].id, hairServices[2].id, hairServices[3].id]));
  hairSlots.push(await createSlot(hairBusiness.id, 5, '09:00', '13:00', 'זמינות בוקר', [hairServices[0].id, hairServices[1].id, hairServices[5].id]));
  hairSlots.push(await createSlot(hairBusiness.id, 7, '12:00', '18:00', 'צהריים וערב', [hairServices[0].id, hairServices[1].id, hairServices[2].id]));

  console.log(`  ✅ ${hairBusiness.name}: ${hairSlots.length} windows`);

  // Massage Clinic Availability (Jerusalem)
  const massageSlots = [];
  massageSlots.push(await createSlot(massageBusiness.id, 2, '10:00', '15:00', 'זמינות יום', massageServices.map(s => s.id)));
  massageSlots.push(await createSlot(massageBusiness.id, 4, '09:00', '14:00', 'זמינות בוקר', massageServices.map(s => s.id)));
  massageSlots.push(await createSlot(massageBusiness.id, 8, '12:00', '18:00', 'צהריים וערב', massageServices.map(s => s.id)));

  console.log(`  ✅ ${massageBusiness.name}: ${massageSlots.length} windows`);

  // Beauty Studio Availability (Haifa)
  const beautySlots = [];
  beautySlots.push(await createSlot(beautyBusiness.id, 3, '11:00', '17:00', 'זמינות יום', beautyServices.map(s => s.id)));
  beautySlots.push(await createSlot(beautyBusiness.id, 6, '09:00', '13:00', 'זמינות בוקר', beautyServices.map(s => s.id)));
  beautySlots.push(await createSlot(beautyBusiness.id, 10, '14:00', '19:00', 'אחר צהריים', beautyServices.map(s => s.id)));

  console.log(`  ✅ ${beautyBusiness.name}: ${beautySlots.length} windows`);

  // ============================================================================
  // STEP 7: Clean up old demo bookings
  // ============================================================================

  // Delete old demo bookings for customer
  await prisma.booking.deleteMany({
    where: {
      customerId: customerUser.id,
      businessId: { in: [hairBusiness.id, massageBusiness.id, beautyBusiness.id] }
    }
  });

  // ============================================================================
  // STEP 8: Create demo bookings
  // ============================================================================

  console.log('\n📝 Creating demo bookings...');

  const bookings = [];

  // Future confirmed booking (tomorrow)
  bookings.push(await prisma.booking.create({
    data: {
      customerId: customerUser.id,
      businessId: hairBusiness.id,
      businessServiceId: hairServices[0].id,
      slotId: hairSlots[0].id,
      startTime: '10:30',
      endTime: '11:00',
      customerName: customerUser.fullName,
      customerPhone: customerUser.phone,
      price: hairServices[0].regularPrice,
      status: 'CONFIRMED'
    }
  }));
  console.log(`  ✅ Confirmed: ${getDateOffset(1)} 10:30 - תספורת גבר`);

  // Future pending booking (tomorrow+2)
  bookings.push(await prisma.booking.create({
    data: {
      customerId: customerUser.id,
      businessId: hairBusiness.id,
      businessServiceId: hairServices[1].id,
      slotId: hairSlots[2].id,
      startTime: '13:00',
      endTime: '14:00',
      customerName: customerUser.fullName,
      customerPhone: customerUser.phone,
      price: hairServices[1].regularPrice,
      status: 'PENDING'
    }
  }));
  console.log(`  ✅ Pending: ${getDateOffset(3)} 13:00 - תספורת אישה`);

  // Future confirmed booking (tomorrow+4)
  bookings.push(await prisma.booking.create({
    data: {
      customerId: customerUser.id,
      businessId: massageBusiness.id,
      businessServiceId: massageServices[0].id,
      slotId: massageSlots[1].id,
      startTime: '11:00',
      endTime: '12:00',
      customerName: customerUser.fullName,
      customerPhone: customerUser.phone,
      price: massageServices[0].regularPrice,
      status: 'CONFIRMED'
    }
  }));
  console.log(`  ✅ Confirmed: ${getDateOffset(4)} 11:00 - עיסוי שוודי`);

  // Future confirmed booking (tomorrow+5)
  bookings.push(await prisma.booking.create({
    data: {
      customerId: customerUser.id,
      businessId: beautyBusiness.id,
      businessServiceId: beautyServices[0].id,
      slotId: beautySlots[1].id,
      startTime: '10:00',
      endTime: '11:00',
      customerName: customerUser.fullName,
      customerPhone: customerUser.phone,
      price: beautyServices[0].regularPrice,
      status: 'CONFIRMED'
    }
  }));
  console.log(`  ✅ Confirmed: ${getDateOffset(6)} 10:00 - טיפול פנים`);

  // Past confirmed booking (yesterday)
  const yesterdaySlot = await prisma.slot.create({
    data: {
      businessId: hairBusiness.id,
      date: getDateOffset(-1),
      startTime: '10:00',
      endTime: '12:00',
      status: 'OPEN',
      color: '#10b981',
      title: 'past slot'
    }
  });
  await prisma.slotAllowedService.create({
    data: {
      slotId: yesterdaySlot.id,
      businessServiceId: hairServices[0].id
    }
  });
  bookings.push(await prisma.booking.create({
    data: {
      customerId: customerUser.id,
      businessId: hairBusiness.id,
      businessServiceId: hairServices[0].id,
      slotId: yesterdaySlot.id,
      startTime: '10:00',
      endTime: '10:30',
      customerName: customerUser.fullName,
      customerPhone: customerUser.phone,
      price: hairServices[0].regularPrice,
      status: 'COMPLETED'
    }
  }));
  console.log(`  ✅ Past (completed): ${getDateOffset(-1)} 10:00 - תספורת גבר`);

  // Past booking from last week
  const lastWeekSlot = await prisma.slot.create({
    data: {
      businessId: hairBusiness.id,
      date: getDateOffset(-7),
      startTime: '15:00',
      endTime: '17:00',
      status: 'OPEN',
      color: '#10b981',
      title: 'past slot'
    }
  });
  await prisma.slotAllowedService.create({
    data: {
      slotId: lastWeekSlot.id,
      businessServiceId: hairServices[1].id
    }
  });
  bookings.push(await prisma.booking.create({
    data: {
      customerId: customerUser.id,
      businessId: hairBusiness.id,
      businessServiceId: hairServices[1].id,
      slotId: lastWeekSlot.id,
      startTime: '15:00',
      endTime: '16:00',
      customerName: customerUser.fullName,
      customerPhone: customerUser.phone,
      price: hairServices[1].regularPrice,
      status: 'COMPLETED'
    }
  }));
  console.log(`  ✅ Past (completed): ${getDateOffset(-7)} 15:00 - תספורת אישה`);

  // Cancelled booking
  bookings.push(await prisma.booking.create({
    data: {
      customerId: customerUser.id,
      businessId: hairBusiness.id,
      businessServiceId: hairServices[3].id,
      slotId: hairSlots[2].id,
      startTime: '11:00',
      endTime: '13:00',
      customerName: customerUser.fullName,
      customerPhone: customerUser.phone,
      price: hairServices[3].regularPrice,
      status: 'CANCELLED_BY_CUSTOMER',
      cancelledAt: new Date()
    }
  }));
  console.log(`  ✅ Cancelled: ${getDateOffset(3)} 11:00 - החלקה`);

  // ============================================================================
  // SUMMARY
  // ============================================================================

  console.log('\n✨ Enhanced demo data seeded successfully!\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 Summary:');
  console.log(`   Businesses: 3`);
  console.log(`     - ${hairBusiness.name} (Tel Aviv)`);
  console.log(`     - ${massageBusiness.name} (Jerusalem)`);
  console.log(`     - ${beautyBusiness.name} (Haifa)`);
  console.log(`   Services: ${hairServices.length + massageServices.length + beautyServices.length}`);
  console.log(`   Availability Windows: ${hairSlots.length + massageSlots.length + beautySlots.length}`);
  console.log(`   Demo Bookings: ${bookings.length}`);
  console.log(`     - Confirmed (future): 3`);
  console.log(`     - Pending: 1`);
  console.log(`     - Completed (past): 2`);
  console.log(`     - Cancelled: 1`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('\n🔑 Login credentials:');
  console.log('   Provider: 0500000002 / 123456');
  console.log('   Customer: 0500000003 / 123456');
  console.log('   Admin: 0500000001 / 123456');
  console.log('\n📅 Customer Calendar Coverage:');
  console.log(`   Past: 2 bookings (${getDateOffset(-7)}, ${getDateOffset(-1)})`);
  console.log(`   Future: 4 bookings across ${getDateOffset(1)} to ${getDateOffset(6)}`);
  console.log(`   Cancelled: 1 booking`);
  console.log('\n🔍 Search Coverage:');
  console.log('   3 businesses across 3 cities with GPS coordinates');
  console.log('   Multiple availability windows spread over 10 days');
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
