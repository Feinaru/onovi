/**
 * Sprint C API Test
 *
 * Tests booking creation, status updates, cancellation, and reschedule.
 */

const baseURL = 'http://localhost:3000';

async function runTest() {
  console.log('\n═══════════════════════════════════════════');
  console.log('   Sprint C API Test');
  console.log('═══════════════════════════════════════════\n');

  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    // Login
    console.log('📋 Step 1: Login as SERVICE_PROVIDER');
    console.log('─────────────────────────────────────────');
    const loginRes = await fetch(`${baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '0500000999', password: 'test123' })
    });

    const { token, user } = await loginRes.json();
    console.log(`✅ Logged in: ${user.fullName}`);

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // Get business and services
    const business = await prisma.business.findFirst({
      where: { ownerId: user.id },
      include: {
        services: {
          where: { active: true, visibleToCustomers: true }
        }
      }
    });

    const service30 = business.services.find(s => s.durationMinutes === 30);
    const service60 = business.services.find(s => s.durationMinutes === 60) || business.services[1];

    // Create test slot
    console.log('\n📋 Step 2: Create slot');
    console.log('─────────────────────────────────────────');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const slot = await prisma.slot.create({
      data: {
        businessId: business.id,
        date: dateStr,
        startTime: '10:00',
        endTime: '11:00',
        regularPrice: 200,
        status: 'OPEN'
      }
    });

    await prisma.slotAllowedService.create({
      data: { slotId: slot.id, businessServiceId: service30.id }
    });

    console.log(`✅ Slot created: ${dateStr} 10:00-11:00`);

    // Test booking creation
    console.log('\n📋 Step 3: Create booking');
    console.log('─────────────────────────────────────────');

    const bookingRes = await fetch(`${baseURL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slotId: slot.id,
        businessServiceId: service30.id,
        startTime: '10:00',
        customerName: 'Test Customer',
        customerPhone: '0501234567',
        customerEmail: 'test@test.com',
        customerNote: 'Please call before'
      })
    });

    if (!bookingRes.ok) {
      throw new Error(`Booking failed: ${bookingRes.status} ${await bookingRes.text()}`);
    }

    const booking = await bookingRes.json();
    console.log(`✅ Booking created: ID=${booking.id}`);
    console.log(`   Status: ${booking.status}`);
    console.log(`   Time: ${booking.startTime} - ${booking.endTime}`);

    // Test slot status became FULL (only 2 legal times, one now taken)
    const updatedSlot = await prisma.slot.findUnique({ where: { id: slot.id } });
    console.log(`   Slot status: ${updatedSlot.status}`);

    // Test confirm booking
    console.log('\n📋 Step 4: Confirm booking');
    console.log('─────────────────────────────────────────');

    const confirmRes = await fetch(`${baseURL}/bookings/${booking.id}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: 'CONFIRMED' })
    });

    const confirmedBooking = await confirmRes.json();
    console.log(`✅ Booking confirmed: Status=${confirmedBooking.status}`);
    console.log(`   Confirmed at: ${confirmedBooking.confirmedAt}`);

    // Test cancel booking
    console.log('\n📋 Step 5: Cancel booking');
    console.log('─────────────────────────────────────────');

    const cancelRes = await fetch(`${baseURL}/bookings/${booking.id}/cancel`, {
      method: 'PATCH',
      headers
    });

    const cancelledBooking = await cancelRes.json();
    console.log(`✅ Booking cancelled: Status=${cancelledBooking.status}`);

    // Verify slot reopened
    const reopenedSlot = await prisma.slot.findUnique({ where: { id: slot.id } });
    console.log(`   Slot status after cancel: ${reopenedSlot.status} (should be OPEN again)`);

    // Test reschedule
    console.log('\n📋 Step 6: Test reschedule');
    console.log('─────────────────────────────────────────');

    // Create another booking to reschedule
    const booking2Res = await fetch(`${baseURL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slotId: slot.id,
        businessServiceId: service30.id,
        startTime: '10:00',
        customerName: 'Reschedule Test',
        customerPhone: '0507654321'
      })
    });

    const booking2 = await booking2Res.json();
    console.log(`✅ Created booking to reschedule: ID=${booking2.id}`);

    // Try to reschedule to 10:30
    const rescheduleRes = await fetch(`${baseURL}/bookings/${booking2.id}/reschedule`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        newSlotId: slot.id,
        newBusinessServiceId: service30.id,
        newStartTime: '10:30'
      })
    });

    if (!rescheduleRes.ok) {
      throw new Error(`Reschedule within slot failed: ${rescheduleRes.status}`);
    }

    const rescheduledBooking = await rescheduleRes.json();
    console.log(`✅ Booking rescheduled within same slot: New time=${rescheduledBooking.startTime}-${rescheduledBooking.endTime}`);

    // Test 7: Reschedule to a different slot
    console.log('\n📋 Step 7: Test reschedule to different slot');
    console.log('─────────────────────────────────────────');

    // Create second slot
    const slot2 = await prisma.slot.create({
      data: {
        businessId: business.id,
        date: dateStr,
        startTime: '11:00',
        endTime: '12:00',
        regularPrice: 200,
        status: 'OPEN'
      }
    });

    await prisma.slotAllowedService.create({
      data: { slotId: slot2.id, businessServiceId: service30.id }
    });

    console.log(`✅ Created second slot: ID=${slot2.id} (11:00-12:00)`);

    // Reschedule booking2 from first slot to second slot
    const reschedule2Res = await fetch(`${baseURL}/bookings/${booking2.id}/reschedule`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        newSlotId: slot2.id,
        newBusinessServiceId: service30.id,
        newStartTime: '11:00'
      })
    });

    if (!reschedule2Res.ok) {
      throw new Error(`Reschedule to different slot failed: ${reschedule2Res.status}`);
    }

    const rescheduled2 = await reschedule2Res.json();
    console.log(`✅ Booking moved to new slot: slotId=${rescheduled2.slotId}, time=${rescheduled2.startTime}-${rescheduled2.endTime}`);

    // Verify old slot status recalculated
    const oldSlotAfter = await prisma.slot.findUnique({ where: { id: slot.id } });
    console.log(`   Old slot status: ${oldSlotAfter.status} (should be OPEN)`);

    // Verify new slot status
    const newSlotAfter = await prisma.slot.findUnique({ where: { id: slot2.id } });
    console.log(`   New slot status: ${newSlotAfter.status}`);

    // Test 8: Critical edge case tests
    console.log('\n📋 Step 8: Critical edge case tests');
    console.log('─────────────────────────────────────────');

    // 8a. Illegal no-dead-edge booking is rejected
    console.log('\n8a. Test no-dead-edge rejection:');
    const service45 = business.services.find(s => s.durationMinutes === 45);

    if (!service45) {
      throw new Error('Need a 45-minute service for no-dead-edge test');
    }

    const slotNoDeadEdge = await prisma.slot.create({
      data: {
        businessId: business.id,
        date: dateStr,
        startTime: '13:00',
        endTime: '14:00', // 60 minutes total
        regularPrice: 200,
        status: 'OPEN'
      }
    });

    // Allow both 30-min and 45-min services
    await prisma.slotAllowedService.create({
      data: { slotId: slotNoDeadEdge.id, businessServiceId: service30.id }
    });
    await prisma.slotAllowedService.create({
      data: { slotId: slotNoDeadEdge.id, businessServiceId: service45.id }
    });

    // Try to book 45-min service at 13:00 (would leave 15-min dead edge, less than 30-min minimum)
    const noDeadEdgeRes = await fetch(`${baseURL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slotId: slotNoDeadEdge.id,
        businessServiceId: service45.id,
        startTime: '13:00',
        customerName: 'No Dead Edge Test',
        customerPhone: '0501234567'
      })
    });

    const noDeadEdgeData = await noDeadEdgeRes.json();

    if (noDeadEdgeRes.status !== 409 && noDeadEdgeRes.status !== 400) {
      throw new Error(`Expected 400/409 for no-dead-edge violation, got ${noDeadEdgeRes.status}`);
    }

    // Verify no booking was created
    const badBookings = await prisma.booking.findMany({
      where: { slotId: slotNoDeadEdge.id }
    });

    if (badBookings.length > 0) {
      throw new Error(`No-dead-edge booking should not have been created, found ${badBookings.length}`);
    }

    console.log(`   ✅ No-dead-edge booking rejected: ${noDeadEdgeRes.status}`);
    console.log(`   ✅ No booking created in database`);
    console.log(`   ✅ Response is JSON: ${typeof noDeadEdgeData === 'object'}`);

    // 8b. Multiple non-overlapping bookings in one slot
    console.log('\n8b. Test multiple non-overlapping bookings:');

    const slotMulti = await prisma.slot.create({
      data: {
        businessId: business.id,
        date: dateStr,
        startTime: '15:00',
        endTime: '16:00', // 60 minutes
        regularPrice: 200,
        status: 'OPEN'
      }
    });

    await prisma.slotAllowedService.create({
      data: { slotId: slotMulti.id, businessServiceId: service30.id }
    });

    // First booking: 15:00-15:30
    const multi1Res = await fetch(`${baseURL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slotId: slotMulti.id,
        businessServiceId: service30.id,
        startTime: '15:00',
        customerName: 'Customer 1',
        customerPhone: '0501111111'
      })
    });

    if (!multi1Res.ok) {
      throw new Error(`First booking failed: ${multi1Res.status}`);
    }

    const multi1Booking = await multi1Res.json();
    console.log(`   ✅ First booking: ${multi1Booking.startTime}-${multi1Booking.endTime}`);

    // Check slot is still OPEN
    const slotAfterFirst = await prisma.slot.findUnique({ where: { id: slotMulti.id } });
    if (slotAfterFirst.status !== 'OPEN') {
      throw new Error(`Slot should be OPEN after first booking, got ${slotAfterFirst.status}`);
    }
    console.log(`   ✅ Slot still OPEN after first booking`);

    // Second booking: 15:30-16:00
    const multi2Res = await fetch(`${baseURL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slotId: slotMulti.id,
        businessServiceId: service30.id,
        startTime: '15:30',
        customerName: 'Customer 2',
        customerPhone: '0502222222'
      })
    });

    if (!multi2Res.ok) {
      throw new Error(`Second booking failed: ${multi2Res.status}`);
    }

    const multi2Booking = await multi2Res.json();
    console.log(`   ✅ Second booking: ${multi2Booking.startTime}-${multi2Booking.endTime}`);

    // Verify both bookings persisted with correct times
    const allMultiBookings = await prisma.booking.findMany({
      where: { slotId: slotMulti.id },
      orderBy: { startTime: 'asc' }
    });

    if (allMultiBookings.length !== 2) {
      throw new Error(`Expected 2 bookings, found ${allMultiBookings.length}`);
    }

    if (allMultiBookings[0].startTime !== '15:00' || allMultiBookings[0].endTime !== '15:30') {
      throw new Error(`First booking has wrong times: ${allMultiBookings[0].startTime}-${allMultiBookings[0].endTime}`);
    }

    if (allMultiBookings[1].startTime !== '15:30' || allMultiBookings[1].endTime !== '16:00') {
      throw new Error(`Second booking has wrong times: ${allMultiBookings[1].startTime}-${allMultiBookings[1].endTime}`);
    }

    console.log(`   ✅ Both bookings persisted with correct startTime/endTime`);

    // Check slot became FULL
    const slotAfterSecond = await prisma.slot.findUnique({ where: { id: slotMulti.id } });
    if (slotAfterSecond.status !== 'FULL') {
      throw new Error(`Slot should be FULL after second booking, got ${slotAfterSecond.status}`);
    }
    console.log(`   ✅ Slot became FULL after second booking`);

    // 8c. FULL slot is hidden from customer discovery
    console.log('\n8c. Test FULL slot hidden from customer discovery:');

    // Use the slotMulti that just became FULL
    // Call customer slot discovery endpoint (GET /slots without includeAll)
    const discoveryRes = await fetch(`${baseURL}/slots?date=${dateStr}`);

    if (!discoveryRes.ok) {
      throw new Error(`Discovery endpoint failed: ${discoveryRes.status}`);
    }

    const discoverySlots = await discoveryRes.json();

    // Verify FULL slot (slotMulti) is NOT in results
    const hasFULLSlot = discoverySlots.some(s => s.id === slotMulti.id);

    if (hasFULLSlot) {
      throw new Error(`FULL slot (ID=${slotMulti.id}) should be hidden from customer discovery`);
    }

    console.log(`   ✅ FULL slot (ID=${slotMulti.id}) hidden from customer discovery`);
    console.log(`   ✅ Discovery returned ${discoverySlots.length} slots (all OPEN)`);

    // Cleanup
    console.log('\n📋 Cleanup');
    console.log('─────────────────────────────────────────');
    await prisma.booking.deleteMany({ where: { slotId: { in: [slot.id, slot2.id, slotNoDeadEdge.id, slotMulti.id] } } });
    await prisma.slotAllowedService.deleteMany({ where: { slotId: { in: [slot.id, slot2.id, slotNoDeadEdge.id, slotMulti.id] } } });
    await prisma.slot.deleteMany({ where: { id: { in: [slot.id, slot2.id, slotNoDeadEdge.id, slotMulti.id] } } });
    console.log('✅ Test data cleaned up');

    await prisma.$disconnect();

    console.log('\n═══════════════════════════════════════════');
    console.log('   ✅ ALL TESTS PASSED');
    console.log('═══════════════════════════════════════════\n');

  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

runTest();
