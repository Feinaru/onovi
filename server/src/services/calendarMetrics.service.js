const prisma = require('../lib/prisma');

/**
 * Calendar Metrics Service
 *
 * Calculates KPIs for the calendar workspace
 */

/**
 * Calculate today's performance metrics
 */
async function getTodayMetrics(businessId, date) {
  const dateStr = date || new Date().toISOString().split('T')[0];

  // Fetch all relevant data in parallel
  const [slots, bookings] = await Promise.all([
    // Get today's slots
    prisma.slot.findMany({
      where: {
        businessId,
        date: dateStr
      },
      include: {
        service: true,
        bookings: {
          where: {
            status: { notIn: ['CANCELLED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_BUSINESS'] }
          }
        }
      }
    }),

    // Get today's confirmed bookings
    prisma.booking.findMany({
      where: {
        businessId,
        status: { in: ['CONFIRMED', 'APPROVED', 'COMPLETED'] },
        slot: {
          date: dateStr
        }
      },
      include: {
        slot: true
      }
    })
  ]);

  // Calculate metrics
  const metrics = {
    // Secured Revenue: Total from confirmed bookings
    securedRevenue: bookings.reduce((sum, booking) => sum + booking.price, 0),

    // Confirmed bookings count
    confirmedBookings: bookings.length,

    // Published gaps count (OPEN slots)
    publishedGaps: slots.filter(s => s.status === 'OPEN').length,

    // Total capacity and booked capacity
    totalCapacity: 0,
    bookedCapacity: 0,

    // Potential revenue from remaining spots
    potentialRevenue: 0,

    // Metrics by service
    serviceBreakdown: {}
  };

  // Calculate capacity and potential revenue
  for (const slot of slots) {
    if (slot.status !== 'OPEN') continue;

    // Calculate slot capacity based on duration
    const slotDuration = calculateDuration(slot.startTime, slot.endTime);
    const serviceDuration = slot.service.durationMinutes;
    const capacity = Math.floor(slotDuration / serviceDuration);

    metrics.totalCapacity += capacity;

    // Count active bookings in this slot
    const activeBookings = slot.bookings.length;
    metrics.bookedCapacity += activeBookings;

    // Calculate remaining capacity and potential revenue
    const remainingCapacity = capacity - activeBookings;
    const pricePerSpot = slot.dealPrice || slot.regularPrice;
    metrics.potentialRevenue += remainingCapacity * pricePerSpot;

    // Track by service
    const serviceName = slot.service.name;
    if (!metrics.serviceBreakdown[serviceName]) {
      metrics.serviceBreakdown[serviceName] = {
        slots: 0,
        bookings: 0,
        revenue: 0
      };
    }
    metrics.serviceBreakdown[serviceName].slots++;
    metrics.serviceBreakdown[serviceName].bookings += activeBookings;
    metrics.serviceBreakdown[serviceName].revenue += activeBookings * pricePerSpot;
  }

  // Calculate fill rate
  metrics.fillRate = metrics.totalCapacity > 0
    ? Math.round((metrics.bookedCapacity / metrics.totalCapacity) * 100)
    : 0;

  // Calculate utilization (published time vs total day time)
  const totalPublishedMinutes = slots
    .filter(s => s.status === 'OPEN')
    .reduce((sum, slot) => sum + calculateDuration(slot.startTime, slot.endTime), 0);
  const totalDayMinutes = 24 * 60;
  metrics.utilization = Math.round((totalPublishedMinutes / totalDayMinutes) * 100);

  // Average booking value
  metrics.avgBookingValue = bookings.length > 0
    ? Math.round(metrics.securedRevenue / bookings.length)
    : 0;

  // Best performing service
  const serviceEntries = Object.entries(metrics.serviceBreakdown);
  if (serviceEntries.length > 0) {
    const bestService = serviceEntries.reduce((best, [name, data]) =>
      data.bookings > (best.data?.bookings || 0) ? { name, data } : best
    , {});
    metrics.bestService = bestService.name || null;
    metrics.bestServiceBookings = bestService.data?.bookings || 0;
  }

  return metrics;
}

/**
 * Calculate heat map data (demand patterns)
 * Based on historical bookings over last 30 days
 */
async function getHeatMapData(businessId, date) {
  const dateStr = date || new Date().toISOString().split('T')[0];

  // Get date 30 days ago
  const thirtyDaysAgo = new Date(dateStr);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

  // Get all bookings from last 30 days
  const historicalBookings = await prisma.booking.findMany({
    where: {
      businessId,
      status: { in: ['CONFIRMED', 'APPROVED', 'COMPLETED'] },
      slot: {
        date: { gte: thirtyDaysAgoStr, lte: dateStr }
      }
    },
    include: {
      slot: true
    }
  });

  // Count bookings per hour
  const hourCounts = {};
  for (let hour = 0; hour < 24; hour++) {
    hourCounts[hour] = 0;
  }

  for (const booking of historicalBookings) {
    const hour = parseInt(booking.slot.startTime.split(':')[0]);
    hourCounts[hour]++;
  }

  // Calculate total bookings
  const totalBookings = historicalBookings.length;

  // Calculate demand percentage per hour
  const heatMap = {};
  for (let hour = 0; hour < 24; hour++) {
    const count = hourCounts[hour];
    const demandPercent = totalBookings > 0 ? Math.round((count / totalBookings) * 100) : 0;

    heatMap[hour] = {
      count,
      demandPercent,
      avgPerWeek: count / 4.3, // Approximate weeks in 30 days
      level: demandPercent > 60 ? 'high' : demandPercent > 30 ? 'medium' : 'low'
    };
  }

  return heatMap;
}

/**
 * Calculate slot capacity dynamically
 */
function calculateSlotCapacity(slotDuration, serviceDuration) {
  return Math.floor(slotDuration / serviceDuration);
}

/**
 * Helper: Calculate duration in minutes between two times
 */
function calculateDuration(startTime, endTime) {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  return endMinutes - startMinutes;
}

module.exports = {
  getTodayMetrics,
  getHeatMapData,
  calculateSlotCapacity,
  calculateDuration
};
