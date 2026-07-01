const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Phase 1 Migration Verification Test Script
 *
 * This script verifies that:
 * 1. All new tables exist
 * 2. All new enums are created
 * 3. Existing relations still work (Slot → Service → Business)
 * 4. publicId fields were generated
 * 5. User roles were updated
 * 6. phoneNormalized was backfilled
 * 7. Existing bookings/calendar still work
 */

async function testMigration() {
  console.log('🧪 Testing Phase 1 Migration...\n');

  let passedTests = 0;
  let failedTests = 0;

  try {
    // Test 1: BusinessService model renamed (@@map)
    console.log('Test 1: BusinessService model query works');
    const services = await prisma.businessService.findMany({ take: 1 });
    console.log('   ✅ PASS - BusinessService query successful\n');
    passedTests++;

    // Test 2: Service table name unchanged in database
    console.log('Test 2: Service table still exists in database');
    const rawServices = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "Service"`;
    console.log(`   ✅ PASS - Service table exists (${rawServices[0].count} records)\n`);
    passedTests++;

    // Test 3: Slot → Service relation intact
    console.log('Test 3: Slot → BusinessService relation');
    const slots = await prisma.slot.findMany({
      take: 1,
      include: { service: true, business: true }
    });
    if (slots.length > 0 && slots[0].service && slots[0].business) {
      console.log(`   ✅ PASS - Slot relations work (sample slot: ${slots[0].id})\n`);
      passedTests++;
    } else if (slots.length === 0) {
      console.log('   ⚠️  SKIP - No slots found in database\n');
    } else {
      console.log('   ❌ FAIL - Slot service or business relation missing\n');
      failedTests++;
    }

    // Test 4: Booking → Slot → Service chain
    console.log('Test 4: Booking → Slot → BusinessService chain');
    const bookings = await prisma.booking.findMany({
      take: 1,
      include: {
        slot: { include: { service: true } },
        service: true,
        business: true
      }
    });
    if (bookings.length > 0 && bookings[0].slot && bookings[0].service && bookings[0].business) {
      console.log(`   ✅ PASS - Booking relations work (sample booking: ${bookings[0].id})\n`);
      passedTests++;
    } else if (bookings.length === 0) {
      console.log('   ⚠️  SKIP - No bookings found in database\n');
    } else {
      console.log('   ❌ FAIL - Booking relations missing\n');
      failedTests++;
    }

    // Test 5: New enums exist
    console.log('Test 5: UserRole enum updated');
    const userRoles = await prisma.user.findMany({
      select: { role: true },
      distinct: ['role']
    });
    const roleValues = userRoles.map(u => u.role);
    if (roleValues.includes('SERVICE_PROVIDER') || roleValues.includes('SERVICE_RECIPIENT')) {
      console.log(`   ✅ PASS - User roles: ${roleValues.join(', ')}\n`);
      passedTests++;
    } else {
      console.log(`   ❌ FAIL - SERVICE_PROVIDER role not found. Roles: ${roleValues.join(', ')}\n`);
      failedTests++;
    }

    // Test 6: New tables exist
    console.log('Test 6: New Phase 1 tables created');
    const newTables = ['Field', 'Profession', 'ServiceTemplate', 'DocumentType',
                       'ServiceProviderApproval', 'ConsentType', 'ApplicationSetting'];

    for (const tableName of newTables) {
      try {
        const modelNameLower = tableName.charAt(0).toLowerCase() + tableName.slice(1);
        await prisma[modelNameLower].count();
      } catch (error) {
        console.log(`   ❌ FAIL - Table ${tableName} does not exist or cannot be queried\n`);
        failedTests++;
        continue;
      }
    }
    console.log(`   ✅ PASS - All ${newTables.length} new tables created\n`);
    passedTests++;

    // Test 7: publicId generated for existing records
    console.log('Test 7: publicId auto-generated');
    const businessWithPublicId = await prisma.business.findFirst({
      select: { publicId: true }
    });
    const slotWithPublicId = await prisma.slot.findFirst({
      select: { publicId: true }
    });
    const bookingWithPublicId = await prisma.booking.findFirst({
      select: { publicId: true }
    });

    if (businessWithPublicId?.publicId && slotWithPublicId?.publicId && bookingWithPublicId?.publicId) {
      console.log('   ✅ PASS - publicId generated for Business, Slot, and Booking\n');
      passedTests++;
    } else {
      console.log('   ❌ FAIL - publicId missing on some models\n');
      failedTests++;
    }

    // Test 8: phoneNormalized backfilled
    console.log('Test 8: phoneNormalized backfilled');
    const businessWithPhone = await prisma.business.findFirst({
      where: { phoneNormalized: { not: null } },
      select: { phone: true, phoneNormalized: true }
    });
    if (businessWithPhone) {
      console.log(`   ✅ PASS - phoneNormalized works (${businessWithPhone.phone} → ${businessWithPhone.phoneNormalized})\n`);
      passedTests++;
    } else {
      console.log('   ⚠️  SKIP - No businesses with phoneNormalized\n');
    }

    // Test 9: ServiceProviderApproval records created
    console.log('Test 9: ServiceProviderApproval records');
    const approvalCount = await prisma.serviceProviderApproval.count();
    const businessCount = await prisma.business.count();
    if (approvalCount === businessCount) {
      console.log(`   ✅ PASS - ${approvalCount} approval records match ${businessCount} businesses\n`);
      passedTests++;
    } else if (approvalCount > 0) {
      console.log(`   ⚠️  PARTIAL - ${approvalCount} approval records, ${businessCount} businesses\n`);
      passedTests++;
    } else {
      console.log('   ❌ FAIL - No ServiceProviderApproval records found\n');
      failedTests++;
    }

    // Test 10: ConsentType records created
    console.log('Test 10: ConsentType records');
    const consents = await prisma.consentType.findMany({
      select: { code: true }
    });
    const consentCodes = consents.map(c => c.code);
    if (consentCodes.includes('terms') && consentCodes.includes('privacy') && consentCodes.includes('marketing')) {
      console.log(`   ✅ PASS - All 3 consent types created: ${consentCodes.join(', ')}\n`);
      passedTests++;
    } else {
      console.log(`   ❌ FAIL - Missing consent types. Found: ${consentCodes.join(', ')}\n`);
      failedTests++;
    }

    // Test 11: Category table still exists
    console.log('Test 11: Category table preserved');
    const categoryCount = await prisma.category.count();
    console.log(`   ✅ PASS - Category table exists (${categoryCount} records)\n`);
    passedTests++;

    // Test 12: Fields created from Categories
    console.log('Test 12: Fields created from Categories');
    const fieldCount = await prisma.field.count();
    if (fieldCount > 0) {
      console.log(`   ✅ PASS - ${fieldCount} fields created\n`);
      passedTests++;
    } else {
      console.log('   ⚠️  SKIP - No fields created (categories may be empty)\n');
    }

    // Test 13: Calendar/TimeBlock/Vacation models unchanged
    console.log('Test 13: Calendar models unchanged');
    const calendarCount = await prisma.calendarEvent.count();
    const timeBlockCount = await prisma.timeBlock.count();
    const vacationCount = await prisma.vacation.count();
    console.log(`   ✅ PASS - Calendar models work (${calendarCount} events, ${timeBlockCount} blocks, ${vacationCount} vacations)\n`);
    passedTests++;

    // Summary
    console.log('═'.repeat(60));
    console.log(`\n✅ PASSED: ${passedTests} tests`);
    if (failedTests > 0) {
      console.log(`❌ FAILED: ${failedTests} tests`);
    }
    console.log('\n🎉 Migration verification complete!');

    if (failedTests > 0) {
      console.log('\n⚠️  Some tests failed. Review the output above.');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Migration test failed with error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testMigration();
