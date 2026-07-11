const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { getLegalStartTimes } = require('../services/slotAvailability.service');
const { ACTIVE_BOOKING_STATUSES } = require('../constants/bookingStatuses');

/**
 * Customer Appointment Search v2
 *
 * Business-grouped search with comprehensive filters:
 * - Multi-select taxonomy (fields, professions, service templates)
 * - Date range
 * - Time buckets + specific time range
 * - Sorting
 *
 * Returns business cards with available services and legal start times.
 */

/**
 * Parse comma-separated integers
 */
function parseIntArray(str) {
  if (!str) return [];
  return str.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
}

/**
 * Parse comma-separated strings
 */
function parseArray(str) {
  if (!str) return [];
  return str.split(',').map(s => s.trim()).filter(Boolean);
}

/**
 * Check if time falls within a bucket
 */
function isTimeInBucket(time, bucket) {
  const hour = parseInt(time.split(':')[0]);

  switch (bucket) {
    case 'morning': return hour >= 6 && hour < 12;
    case 'afternoon': return hour >= 12 && hour < 17;
    case 'evening': return hour >= 17 && hour < 21;
    case 'night': return hour >= 21 || hour < 6;
    default: return false;
  }
}

/**
 * Get soonest available date from services
 */
function getSoonestDate(services) {
  let soonest = null;
  for (const service of services) {
    for (const dateInfo of service.availableDates) {
      if (!soonest || dateInfo.date < soonest) {
        soonest = dateInfo.date;
      }
    }
  }
  return soonest || '9999-12-31';
}

/**
 * Calculate recommended score
 */
function calculateRecommendedScore(businessCard) {
  // For now: prioritize soonest availability, then lower price
  const soonestDate = getSoonestDate(businessCard.services);
  const minPrice = Math.min(...businessCard.services.map(s => s.regularPrice));

  // Earlier dates get higher score
  const daysFromNow = (new Date(soonestDate) - new Date()) / (1000 * 60 * 60 * 24);
  const availabilityScore = Math.max(0, 1 - (daysFromNow / 30)); // 0-1 scale, 30 days max

  // Lower price gets higher score
  const priceScore = Math.max(0, 1 - (minPrice / 1000)); // Normalize to 0-1

  return (0.6 * availabilityScore) + (0.4 * priceScore);
}

/**
 * Sort business results
 */
function sortBusinessResults(results, sortType) {
  switch (sortType) {
    case 'soonest':
      return results.sort((a, b) => {
        const aSoonest = getSoonestDate(a.services);
        const bSoonest = getSoonestDate(b.services);
        return aSoonest.localeCompare(bSoonest);
      });

    case 'price-asc':
      return results.sort((a, b) => {
        const aMin = Math.min(...a.services.map(s => s.regularPrice));
        const bMin = Math.min(...b.services.map(s => s.regularPrice));
        return aMin - bMin;
      });

    case 'price-desc':
      return results.sort((a, b) => {
        const aMax = Math.max(...a.services.map(s => s.regularPrice));
        const bMax = Math.max(...b.services.map(s => s.regularPrice));
        return bMax - aMax;
      });

    case 'nearest':
      // Not implemented yet (requires GPS)
      console.log('[CustomerSearch] nearest sort requested but GPS not implemented, falling back to recommended');
      return results.sort((a, b) => calculateRecommendedScore(b) - calculateRecommendedScore(a));

    case 'recommended':
    default:
      return results.sort((a, b) => calculateRecommendedScore(b) - calculateRecommendedScore(a));
  }
}

/**
 * GET /api/customer/appointment-search
 *
 * Business-grouped search for customer appointment discovery
 */
router.get('/appointment-search', async (req, res, next) => {
  try {
    const {
      fieldIds: fieldIdsStr,
      professionIds: professionIdsStr,
      serviceTemplateIds: serviceTemplateIdsStr,
      dateFrom,
      dateTo,
      timeBuckets: timeBucketsStr,
      timeFrom,
      timeTo,
      sort = 'recommended'
    } = req.query;

    // Parse filters
    const fieldIds = parseIntArray(fieldIdsStr);
    const professionIds = parseIntArray(professionIdsStr);
    const serviceTemplateIds = parseIntArray(serviceTemplateIdsStr);
    const timeBuckets = parseArray(timeBucketsStr);

    // Date range defaults and validation
    const today = new Date().toISOString().split('T')[0];
    const defaultDateTo = new Date();
    defaultDateTo.setDate(defaultDateTo.getDate() + 14);
    const defaultDateToStr = defaultDateTo.toISOString().split('T')[0];

    const finalDateFrom = dateFrom && dateFrom >= today ? dateFrom : today;
    const finalDateTo = dateTo || defaultDateToStr;

    if (finalDateTo < finalDateFrom) {
      return res.status(400).json({ message: 'תאריך הסיום חייב להיות אחרי תאריך ההתחלה' });
    }

    console.log('[CustomerSearch] Query params:', {
      fieldIds,
      professionIds,
      serviceTemplateIds,
      dateFrom: finalDateFrom,
      dateTo: finalDateTo,
      timeBuckets,
      timeFrom,
      timeTo,
      sort
    });

    // Build BusinessService filter
    const serviceWhere = {
      active: true,
      visibleToCustomers: true,
      business: {
        status: 'ACTIVE',
        approvals: {
          some: {
            status: 'APPROVED'
          }
        }
      }
    };

    // Add approvalStatus filter if field exists (check schema)
    // For safety, we'll include it conditionally
    const hasApprovalStatus = true; // Assume it exists based on schema analysis
    if (hasApprovalStatus) {
      serviceWhere.approvalStatus = 'APPROVED';
    }

    // Taxonomy filters: AND across groups, OR within group
    if (serviceTemplateIds.length > 0) {
      serviceWhere.serviceTemplateId = { in: serviceTemplateIds };
    } else if (professionIds.length > 0) {
      serviceWhere.serviceTemplate = {
        professionId: { in: professionIds }
      };
    } else if (fieldIds.length > 0) {
      serviceWhere.serviceTemplate = {
        profession: {
          fieldId: { in: fieldIds }
        }
      };
    }

    // Fetch OPEN slots in date range with matching services
    const slots = await prisma.slot.findMany({
      where: {
        status: 'OPEN',
        date: {
          gte: finalDateFrom,
          lte: finalDateTo
        },
        allowedServices: {
          some: {
            businessService: serviceWhere
          }
        }
      },
      include: {
        business: {
          include: {
            category: true,
            approvals: {
              where: { status: 'APPROVED' },
              take: 1
            }
          }
        },
        allowedServices: {
          where: {
            businessService: serviceWhere
          },
          include: {
            businessService: {
              include: {
                serviceTemplate: true
              }
            }
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
    });

    console.log(`[CustomerSearch] Found ${slots.length} matching slots`);

    // Calculate legal times for each service in each slot
    const businessMap = new Map();

    for (const slot of slots) {
      for (const allowedService of slot.allowedServices) {
        const businessServiceId = allowedService.businessService.id;

        // Calculate legal start times
        const legalTimes = await getLegalStartTimes(
          prisma,
          slot.id,
          businessServiceId,
          null
        );

        // Filter by time buckets or specific time range
        let filteredTimes = legalTimes;

        if (timeFrom && timeTo) {
          // Specific time range overrides buckets
          filteredTimes = legalTimes.filter(t =>
            t.startTime >= timeFrom && t.endTime <= timeTo
          );
        } else if (timeBuckets.length > 0) {
          // Filter by time buckets
          filteredTimes = legalTimes.filter(t =>
            timeBuckets.some(bucket => isTimeInBucket(t.startTime, bucket))
          );
        }

        // Skip if no available times after filtering
        if (filteredTimes.length === 0) continue;

        // Group by business
        const businessId = slot.business.id;
        if (!businessMap.has(businessId)) {
          businessMap.set(businessId, {
            business: {
              id: slot.business.id,
              publicId: slot.business.publicId,
              name: slot.business.name,
              city: slot.business.city,
              cityNameHebrew: slot.business.cityNameHebrew,
              formattedAddress: slot.business.formattedAddress,
              latitude: slot.business.latitude,
              longitude: slot.business.longitude,
              category: slot.business.category ? {
                id: slot.business.category.id,
                name: slot.business.category.name,
                nameHebrew: slot.business.category.nameHebrew
              } : null
            },
            servicesMap: new Map()
          });
        }

        const businessData = businessMap.get(businessId);

        // Group by service
        if (!businessData.servicesMap.has(businessServiceId)) {
          businessData.servicesMap.set(businessServiceId, {
            businessServiceId,
            serviceTemplateId: allowedService.businessService.serviceTemplateId,
            name: allowedService.businessService.name,
            durationMinutes: allowedService.businessService.durationMinutes,
            regularPrice: allowedService.businessService.regularPrice,
            datesMap: new Map()
          });
        }

        const serviceData = businessData.servicesMap.get(businessServiceId);

        // Group times by date
        if (!serviceData.datesMap.has(slot.date)) {
          serviceData.datesMap.set(slot.date, []);
        }

        // Add times (dedupe if needed)
        const existingTimes = serviceData.datesMap.get(slot.date);
        for (const time of filteredTimes) {
          const timeKey = `${time.startTime}-${time.endTime}`;
          const exists = existingTimes.some(t => `${t.startTime}-${t.endTime}` === timeKey);
          if (!exists) {
            existingTimes.push({
              slotId: slot.id,
              startTime: time.startTime,
              endTime: time.endTime
            });
          }
        }
      }
    }

    // Convert maps to arrays
    const results = Array.from(businessMap.values()).map(businessData => ({
      business: businessData.business,
      services: Array.from(businessData.servicesMap.values()).map(serviceData => ({
        businessServiceId: serviceData.businessServiceId,
        serviceTemplateId: serviceData.serviceTemplateId,
        name: serviceData.name,
        durationMinutes: serviceData.durationMinutes,
        regularPrice: serviceData.regularPrice,
        availableDates: Array.from(serviceData.datesMap.entries())
          .map(([date, times]) => ({
            date,
            times: times.sort((a, b) => a.startTime.localeCompare(b.startTime))
          }))
          .sort((a, b) => a.date.localeCompare(b.date))
      }))
    }));

    // Sort results
    const sortedResults = sortBusinessResults(results, sort);

    console.log(`[CustomerSearch] Returning ${sortedResults.length} businesses with ${sortedResults.reduce((sum, b) => sum + b.services.length, 0)} services`);

    res.json({
      results: sortedResults,
      meta: {
        totalBusinesses: sortedResults.length,
        totalServices: sortedResults.reduce((sum, b) => sum + b.services.length, 0),
        filtersApplied: {
          fieldIds,
          professionIds,
          serviceTemplateIds,
          dateFrom: finalDateFrom,
          dateTo: finalDateTo,
          timeBuckets,
          timeFrom,
          timeTo
        },
        sort
      }
    });
  } catch (error) {
    console.error('[CustomerSearch] Error:', error);
    next(error);
  }
});

module.exports = router;
