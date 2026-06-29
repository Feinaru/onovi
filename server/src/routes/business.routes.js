const router = require('express').Router();
const prisma = require('../lib/prisma');
const { auth, requireRole } = require('../middleware/auth');
const { validateIdentifier } = require('../utils/identifierValidation');
const fs = require('fs');
const path = require('path');

// Load normalized address data directly
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const citiesData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'cities-normalized.json'), 'utf8'));
const streetsData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'streets-normalized.json'), 'utf8'));

/**
 * Validate city code exists
 */
function validateCityCode(cityCode) {
  try {
    const city = citiesData.find(c => c.cityCode === Number(cityCode));
    return !!city;
  } catch (error) {
    console.error('[BusinessRoutes] City validation error:', error.message);
    return false;
  }
}

/**
 * Validate street code exists in city
 */
function validateStreetCode(cityCode, streetCode) {
  try {
    const cityStreets = streetsData[cityCode.toString()];
    if (!cityStreets) return false;

    const street = cityStreets.streets.find(s => s.streetCode === Number(streetCode));
    return !!street;
  } catch (error) {
    console.error('[BusinessRoutes] Street validation error:', error.message);
    return false;
  }
}

// GET /api/businesses - List all businesses
router.get('/', async (req, res, next) => {
  try {
    const businesses = await prisma.business.findMany({
      include: { category: true, services: true },
      orderBy: { id: 'desc' }
    });
    res.json(businesses);
  } catch (e) {
    next(e);
  }
});

// GET /api/businesses/my - Get my businesses
router.get('/my', auth(), requireRole('BUSINESS', 'ADMIN'), async (req, res, next) => {
  try {
    const businesses = await prisma.business.findMany({
      where: req.user.role === 'ADMIN' ? {} : { ownerId: req.user.id },
      include: { category: true, services: true, slots: true, bookings: true },
      orderBy: { id: 'desc' }
    });
    res.json(businesses);
  } catch (e) {
    next(e);
  }
});

// POST /api/businesses - Create business (CODE-BASED)
router.post('/', auth(false), async (req, res, next) => {
  try {
    const {
      name,
      description,
      phone,
      identifierType,
      identifierValue,
      cityCode,
      cityNameHebrew,
      streetCode,
      streetNameHebrew,
      houseNumber,
      formattedAddress,
      latitude,
      longitude,
      hasExactCoordinates,
      isEstimatedLocation,
      locationVerifiedByBusiness,
      categoryId
    } = req.body;

    console.log('[BusinessRoutes] POST /businesses', {
      name,
      identifierType,
      identifierValue,
      cityCode,
      cityNameHebrew,
      streetCode,
      streetNameHebrew,
      houseNumber
    });

    // Required fields
    if (!name || !phone || !categoryId || !identifierType || !identifierValue) {
      return res.status(400).json({ message: 'name, phone, categoryId, identifierType and identifierValue are required' });
    }

    // Validate identifier
    const validation = validateIdentifier(identifierType, identifierValue);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.error });
    }

    const normalizedIdentifier = validation.normalized;

    // Check for duplicate business identifier
    const existingBusiness = await prisma.business.findUnique({
      where: {
        identifierType_identifierValue: {
          identifierType,
          identifierValue: normalizedIdentifier
        }
      }
    });

    if (existingBusiness) {
      return res.status(409).json({
        error: 'DUPLICATE_IDENTIFIER',
        message: 'עסק עם מזהה זה כבר קיים במערכת',
        existingBusiness: {
          id: existingBusiness.id,
          name: existingBusiness.name,
          phone: existingBusiness.phone
        }
      });
    }

    // MANDATORY: Full address with coordinates required
    if (!cityCode || !streetCode || !houseNumber) {
      return res.status(400).json({
        message: 'כתובת מלאה חובה: עיר, רחוב ומספר בית נדרשים'
      });
    }

    // MANDATORY: Coordinates required (geocoding must succeed)
    if (!latitude || !longitude) {
      return res.status(400).json({
        message: 'לא ניתן לאתר את הכתובת. אנא ודא שהכתובת קיימת ונסה שוב.'
      });
    }

    // Validate city code exists
    const cityValid = validateCityCode(cityCode);
    if (!cityValid) {
      console.error('[BusinessRoutes] Invalid cityCode:', cityCode);
      return res.status(400).json({ message: 'קוד עיר לא תקין' });
    }

    // Validate street code exists in city
    const streetValid = validateStreetCode(cityCode, streetCode);
    if (!streetValid) {
      console.error('[BusinessRoutes] Invalid streetCode:', streetCode, 'for cityCode:', cityCode);
      return res.status(400).json({ message: 'קוד רחוב לא תקין או לא שייך לעיר זו' });
    }

    const ownerId = req.user?.role === 'BUSINESS' ? req.user.id : null;

    // Prevent duplicate businesses for same owner
    if (ownerId) {
      const existing = await prisma.business.findFirst({ where: { ownerId, name } });
      if (existing) {
        return res.status(409).json({ message: 'עסק בשם זה כבר קיים' });
      }
    }

    // Check if a Lead exists with this identifier - auto-link if found
    const matchingLead = await prisma.lead.findUnique({
      where: {
        identifierType_identifierValue: {
          identifierType,
          identifierValue: normalizedIdentifier
        }
      }
    });

    // Verify categoryId exists in database
    const categoryExists = await prisma.category.findUnique({
      where: { id: Number(categoryId) }
    });
    if (!categoryExists) {
      return res.status(400).json({ message: 'קטגוריה לא תקינה. אנא בחר קטגוריה מהרשימה' });
    }

    // Verify ownerId exists if provided
    if (ownerId) {
      const ownerExists = await prisma.user.findUnique({
        where: { id: ownerId }
      });
      if (!ownerExists) {
        return res.status(400).json({ message: 'משתמש לא נמצא במערכת' });
      }
    }

    const businessData = {
      ownerId,
      name,
      description,
      phone,
      identifierType,
      identifierValue: normalizedIdentifier,
      categoryId: Number(categoryId)
    };

    // Add code-based address fields
    if (cityCode) businessData.cityCode = Number(cityCode);
    if (cityNameHebrew) businessData.cityNameHebrew = cityNameHebrew;
    if (streetCode) businessData.streetCode = Number(streetCode);
    if (streetNameHebrew) businessData.streetNameHebrew = streetNameHebrew;
    if (houseNumber) businessData.houseNumber = houseNumber;
    if (formattedAddress) businessData.formattedAddress = formattedAddress;

    // Legacy fields for backwards compatibility
    if (cityNameHebrew) businessData.city = cityNameHebrew;
    if (streetNameHebrew) businessData.street = streetNameHebrew;

    // Coordinates
    if (latitude !== undefined && latitude !== null) businessData.latitude = parseFloat(latitude);
    if (longitude !== undefined && longitude !== null) businessData.longitude = parseFloat(longitude);

    // Coordinate metadata (defaults set in schema if not provided)
    if (hasExactCoordinates !== undefined) businessData.hasExactCoordinates = Boolean(hasExactCoordinates);
    if (isEstimatedLocation !== undefined) businessData.isEstimatedLocation = Boolean(isEstimatedLocation);
    if (locationVerifiedByBusiness !== undefined) businessData.locationVerifiedByBusiness = locationVerifiedByBusiness === true;

    // Log business data before creation for debugging
    console.log('[BusinessRoutes] Creating business with data:', JSON.stringify(businessData, null, 2));

    const business = await prisma.business.create({ data: businessData });

    // If a matching lead was found, link it to this business
    if (matchingLead) {
      await prisma.lead.update({
        where: { id: matchingLead.id },
        data: { linkedBusinessId: business.id }
      });

      // Create timeline event on the lead
      await prisma.timelineEvent.create({
        data: {
          leadId: matchingLead.id,
          type: 'LEAD_CREATED',
          description: `הליד נרשם כעסק במערכת! 🎉 העסק "${business.name}" נרשם`
        }
      });

      console.log('[BusinessRoutes] Auto-linked Lead #', matchingLead.id, 'to Business #', business.id);
    }

    console.log('[BusinessRoutes] Business created:', business.id);
    res.status(201).json(business);
  } catch (e) {
    console.error('[BusinessRoutes] Create error:', e);

    // Handle Prisma foreign key constraint errors
    if (e.code === 'P2003') {
      return res.status(400).json({
        message: 'שגיאה ביצירת העסק. אחד מהשדות מכיל ערך לא תקין. אנא וודא שכל השדות תקינים ונסה שוב'
      });
    }

    // Handle unique constraint violations
    if (e.code === 'P2002') {
      return res.status(409).json({
        message: 'עסק עם מזהה זה כבר קיים במערכת'
      });
    }

    next(e);
  }
});

// PATCH /api/businesses/:id - Update business (CODE-BASED)
router.patch('/:id', auth(), requireRole('BUSINESS', 'ADMIN'), async (req, res, next) => {
  try {
    const businessId = Number(req.params.id);
    const {
      name,
      description,
      phone,
      cityCode,
      cityNameHebrew,
      streetCode,
      streetNameHebrew,
      houseNumber,
      formattedAddress,
      latitude,
      longitude,
      hasExactCoordinates,
      isEstimatedLocation,
      locationVerifiedByBusiness,
      categoryId
    } = req.body;

    console.log('[BusinessRoutes] PATCH /businesses/:id', {
      businessId,
      cityCode,
      cityNameHebrew,
      streetCode,
      streetNameHebrew,
      houseNumber,
      locationVerifiedByBusiness,
      latitude,
      longitude
    });

    // Check ownership
    const existing = await prisma.business.findUnique({ where: { id: businessId } });
    if (!existing) {
      return res.status(404).json({ message: 'Business not found' });
    }
    if (req.user.role !== 'ADMIN' && existing.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Address validation - if updating address, must be complete with coordinates
    const isUpdatingAddress = cityCode !== undefined || streetCode !== undefined || houseNumber !== undefined;

    if (isUpdatingAddress) {
      // If updating any address field, ALL fields are required
      const finalCityCode = cityCode !== undefined ? cityCode : existing.cityCode;
      const finalStreetCode = streetCode !== undefined ? streetCode : existing.streetCode;
      const finalHouseNumber = houseNumber !== undefined ? houseNumber : existing.houseNumber;
      const finalLatitude = latitude !== undefined ? latitude : existing.latitude;
      const finalLongitude = longitude !== undefined ? longitude : existing.longitude;

      if (!finalCityCode || !finalStreetCode || !finalHouseNumber) {
        return res.status(400).json({
          message: 'כתובת מלאה חובה: עיר, רחוב ומספר בית נדרשים'
        });
      }

      // MANDATORY: Coordinates required when updating address
      if (!finalLatitude || !finalLongitude) {
        return res.status(400).json({
          message: 'לא ניתן לאתר את הכתובת. אנא ודא שהכתובת קיימת ונסה שוב.'
        });
      }

      // Validate city code
      const cityValid = validateCityCode(finalCityCode);
      if (!cityValid) {
        console.error('[BusinessRoutes] Invalid cityCode on update:', finalCityCode);
        return res.status(400).json({ message: 'קוד עיר לא תקין' });
      }

      // Validate street code
      const streetValid = validateStreetCode(finalCityCode, finalStreetCode);
      if (!streetValid) {
        console.error('[BusinessRoutes] Invalid streetCode on update:', finalStreetCode, 'for cityCode:', finalCityCode);
        return res.status(400).json({ message: 'קוד רחוב לא תקין או לא שייך לעיר זו' });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (phone !== undefined) updateData.phone = phone;
    if (categoryId !== undefined) updateData.categoryId = Number(categoryId);

    // Code-based address fields
    if (cityCode !== undefined) {
      updateData.cityCode = Number(cityCode);
      // If city changes, clear street
      if (cityCode !== existing.cityCode) {
        updateData.streetCode = null;
        updateData.streetNameHebrew = null;
        updateData.street = null;
      }
    }
    if (cityNameHebrew !== undefined) {
      updateData.cityNameHebrew = cityNameHebrew;
      updateData.city = cityNameHebrew; // Legacy
    }
    if (streetCode !== undefined) updateData.streetCode = Number(streetCode);
    if (streetNameHebrew !== undefined) {
      updateData.streetNameHebrew = streetNameHebrew;
      updateData.street = streetNameHebrew; // Legacy
    }
    if (houseNumber !== undefined) updateData.houseNumber = houseNumber;
    if (formattedAddress !== undefined) updateData.formattedAddress = formattedAddress;

    // Coordinates
    if (latitude !== undefined) updateData.latitude = latitude !== null ? parseFloat(latitude) : null;
    if (longitude !== undefined) updateData.longitude = longitude !== null ? parseFloat(longitude) : null;

    // Coordinate metadata
    if (hasExactCoordinates !== undefined) updateData.hasExactCoordinates = Boolean(hasExactCoordinates);
    if (isEstimatedLocation !== undefined) updateData.isEstimatedLocation = Boolean(isEstimatedLocation);
    if (locationVerifiedByBusiness !== undefined) updateData.locationVerifiedByBusiness = locationVerifiedByBusiness === true;

    console.log('[BusinessRoutes] updateData being sent to Prisma:', {
      locationVerifiedByBusiness: updateData.locationVerifiedByBusiness,
      latitude: updateData.latitude,
      longitude: updateData.longitude
    });

    const updated = await prisma.business.update({
      where: { id: businessId },
      data: updateData
    });

    console.log('[BusinessRoutes] Business updated:', businessId, 'locationVerifiedByBusiness:', updated.locationVerifiedByBusiness);
    res.json(updated);
  } catch (e) {
    console.error('[BusinessRoutes] Update error:', e);
    next(e);
  }
});

// DELETE /api/businesses/:id - Delete business
router.delete('/:id', auth(), requireRole('BUSINESS', 'ADMIN'), async (req, res, next) => {
  try {
    const businessId = Number(req.params.id);

    // Check ownership
    const existing = await prisma.business.findUnique({ where: { id: businessId } });
    if (!existing) {
      return res.status(404).json({ message: 'Business not found' });
    }
    if (req.user.role !== 'ADMIN' && existing.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await prisma.business.delete({ where: { id: businessId } });
    res.json({ message: 'Business deleted' });
  } catch (e) {
    next(e);
  }
});

// GET /api/businesses/:id - Get business by ID
router.get('/:id', async (req, res, next) => {
  try {
    const businessId = Number(req.params.id);
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: { category: true, services: true }
    });

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    res.json(business);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
