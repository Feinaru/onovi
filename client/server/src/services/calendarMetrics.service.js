const prisma = require('../lib/prisma');

/**
 * Calendar Metrics Service
 * Provides KPIs and analytics for calendar performance
 */

/**
 * Calculate duration in minutes from HH:MM times
 */
function calculateDuration(startTime, endTime) {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  return endMinutes - startMinutes;
}

/**
 * Calculate slot capacity based on duration
 */
function calculateSlotCapacity(slotDuration, serviceDuration) {
  if (!serviceDuration || serviceDuration === 0) return 1;
  return Math.floor(slotDuration / serviceDuration);
}

/**
 * Get today's metrics for KPI bar
 */
async function getTodayMetrics(businessId, date) {
  const slots = await prisma.slot.findMany({
    where: {
      businessId,
      date,
      status: 'OPEN'
    },
    include: {
      service: true,
      bookings: {
        where: {
          status: {
            notIn: ['CANCELLED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_BUSINESS']
          }
        }
      }
    }
  });

  let totalCapacity = 0;
  let bookedCapacity = 0;
  let securedRevenue = 0;
  let potentialRevenue = 0;
  let publishedGaps = slots.length;

  const serviceBookingCount = {};

  for (const slot of slots) {
    const slotDuration = calculateDuration(slot.startTime, slot.endTime);
    const serviceDuration = slot.service.durationMinutes;
    const capacity = calculateSlotCapacity(slotDuration, serviceDuration);
    
    totalCapacity += capacity;

    const activeBookings = slot.bookings || [];
    bookedCapacity += activeBookings.length;

    // Calculate revenue
    for (const booking of activeBookings) {
      securedRevenue += Number(booking.price);
      
      // Track service performance
      const serviceName = slot.service.name;
      serviceBookingCount[serviceName] = (serviceBookingCount[serviceName] || 0) + 1;
    }

    // Calculate potential revenue for remaining capacity
    const remainingCapacity = capacity - activeBookings.length;
    const price = slot.dealPrice || slot.regularPrice;
    potentialRevenue += remainingCapacity * Number(price);
  }

  // Find best performing service
  let bestService = null;
  let bestServiceBookings = 0;
  for (const [serviceName, count] of Object.entries(serviceBookingCount)) {
    if (count > bestServiceBookings) {
      bestService = serviceName;
      bestServiceBookings = count;
    }
  }

  const fillRate = totalCapacity > 0 ? Math.round((bookedCapacity / totalCapacity) * 100) : 0;
  const utilization = totalCapacity > 0 ? Math.round((bookedCapacity / totalCapacity) * 100) : 0;
  const confirmedBookings = bookedCapacity;
  const avgBookingValue = confirmedBookings > 0 ? Math.round(securedRevenue / confirmedBookings) : 0;

  return {
    securedRevenue: Math.round(securedRevenue),
    potentialRevenue: Math.round(potentialRevenue),
    publishedGaps,
    fillRate,
    utilization,
    totalCapacity,
    bookedCapacity,
    confirmedBookings,
    avgBookingValue,
    bestService,
    bestServiceBookings
  };
}

/**
 * Get heat map data showing demand patterns
 */
async function getHeatMapData(businessId, date) {
  // Get bookings for the past 4 weeks for this day of week
  const dayOfWeek = new Date(date).getDay();
  const fourWeeksAgo = new Date(date);
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  const bookings = await prisma.booking.findMany({
    where: {
      businessId,
      status: {
        notIn: ['CANCELLED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_BUSINESS']
      },
      slot: {
        date: {
          gte: fourWeeksAgo.toISOString().split('T')[0],
          lte: date
        }
      }
    },
    include: {
      slot: true
    }
  });

  // Filter by matching day of week
  const relevantBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.slot.date);
    return bookingDate.getDay() === dayOfWeek;
  });

  // Group by hour
  const hourlyDemand = {};
  for (let hour = 0; hour < 24; hour++) {
    hourlyDemand[hour] = 0;
  }

  for (const booking of relevantBookings) {
    const hour = parseInt(booking.slot.startTime.split(':')[0], 10);
    hourlyDemand[hour]++;
  }

  // Calculate average per week (4 weeks of data)
  const heatMap = {};
  for (let hour = 0; hour < 24; hour++) {
    const avgPerWeek = hourlyDemand[hour] / 4;
    const demandPercent = Math.min(Math.round((avgPerWeek / 5) * 100), 100); // Assume max 5 bookings/week per hour

    let level = 'low';
    if (demandPercent >= 60) level = 'high';
    else if (demandPercent >= 30) level = 'medium';

    heatMap[hour] = {
      avgPerWeek,
      demandPercent,
      level
    };
  }

  return heatMap;
}

module.exports = {
  calculateDuration,
  calculateSlotCapacity,
  getTodayMetrics,
  getHeatMapData
};
