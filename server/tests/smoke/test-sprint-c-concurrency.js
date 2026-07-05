/**
 * Sprint C Concurrency Test
 *
 * Tests that two simultaneous booking requests for the same slot/service/time
 * result in exactly one success and one 409 conflict.
 */

const baseURL = 'http://localhost:3000';

async function runConcurrencyTest() {
  console.log('\n══════════════════════════════════════════');
  console.log('   Sprint C - Concurrency Test');
  console.log('══════════════════════════════════════════\n');

  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    // Setup: Create test slot
    console.log('📋 Setup: Creating test slot');
    console.log('─────────────────────────────────────────');

    const business = await prisma.business.findFirst({
      include: {
        services: {
          where: { active: true, visibleToCustomers: true },
          orderBy: { durationMinutes: 'asc' }
        }
      }
    });

    if (!business || business.services.length === 0) {
      throw new Error('No business with services found');
    }

    const service = business.services[0];

    // Clean up any existing test slots
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    await prisma.slot.deleteMany({
      where: {
        businessId: business.id,
        date: dateStr,
        startTime: '14:00',
        endTime: '15:00'
      }
    });

    // Create test slot
    const slot = await prisma.slot.create({
      data: {
        businessId: business.id,
        date: dateStr,
        startTime: '14:00',
        endTime: '15:00',
        regularPrice: 200,
        status: 'OPEN'
      }
    });

    // Add allowed service
    await prisma.slotAllowedService.create({
      data: {
        slotId: slot.id,
        businessServiceId: service.id
      }
    });

    console.log(`✅ Created slot ID=${slot.id} for ${dateStr} 14:00-15:00`);
    console.log(`   Allowed service: ${service.name} (${service.durationMinutes} min)`);

    // Test: Two simultaneous booking requests
    console.log('\n📋 Test: Simult two simultaneous booking requests');
    console.log('─────────────────────────────────────────');
    console.log('Both requesting: 14:00 start time');
    console.log('Expected: 1 success, 1 conflict (409)');

    const bookingPayload = {
      slotId: slot.id,
      businessServiceId: service.id,
      startTime: '14:00',
      customerName: 'Test Customer',
      customerPhone: '0501234567',
      customerEmail: 'test@test.com'
    };

    // Launch two simultaneous requests
    const request1 = fetch(`${baseURL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...bookingPayload,
        customerName: 'Customer 1'
      })
    });

    const request2 = fetch(`${baseURL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...bookingPayload,
        customerName: 'Customer 2'
      })
    });

    const [response1, response2] = await Promise.all([request1, request2]);

    console.log(`\nResponse 1: ${response1.status} ${response1.statusText}`);
    console.log(`Response 2: ${response2.status} ${response2.statusText}`);

    const data1 = response1.ok ? await response1.json() : await response1.json().catch(() => ({}));
    const data2 = response2.ok ? await response2.json() : await response2.json().catch(() => ({}));

    if (!response1.ok) {
      console.log('Response 1 error:', data1.message || JSON.stringify(data1));
    }
    if (!response2.ok) {
      console.log('Response 2 error:', data2.message || JSON.stringify(data2));
    }

    // Verify exactly one succeeded
    const successes = [response1.ok, response2.ok].filter(Boolean).length;
    const conflicts = [response1.status === 409, response2.status === 409].filter(Boolean).length;

    console.log(`\n✓ Successes: ${successes}`);
    console.log(`✓ Conflicts (409): ${conflicts}`);

    if (successes !== 1) {
      throw new Error(`Expected 1 success, got ${successes}`);
    }

    if (conflicts !== 1) {
      throw new Error(`Expected 1 conflict, got ${conflicts}`);
    }

    console.log('\n✅ CONCURRENCY TEST PASSED!');
    console.log('   - Exactly 1 booking succeeded');
    console.log('   - Exactly 1 booking was rejected with 409');
    console.log('   - Row locking prevented double-booking');

    // Verify database state
    const bookings = await prisma.booking.findMany({
      where: { slotId: slot.id }
    });

    console.log(`\n📊 Database verification:`);
    console.log(`   - Bookings created: ${bookings.length}`);

    if (bookings.length !== 1) {
      throw new Error(`Expected 1 booking in DB, found ${bookings.length}`);
    }

    console.log(`   - Customer: ${bookings[0].customerName}`);
    console.log(`   - Time: ${bookings[0].startTime} - ${bookings[0].endTime}`);

    // Cleanup
    console.log('\n📋 Cleanup');
    console.log('─────────────────────────────────────────');
    await prisma.booking.deleteMany({ where: { slotId: slot.id } });
    await prisma.slotAllowedService.deleteMany({ where: { slotId: slot.id } });
    await prisma.slot.delete({ where: { id: slot.id } });
    console.log('✅ Test data cleaned up');

    await prisma.$disconnect();

    console.log('\n══════════════════════════════════════════');
    console.log('   ✅ ALL CONCURRENCY TESTS PASSED');
    console.log('══════════════════════════════════════════\n');

  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

runConcurrencyTest();
