const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { auth, requireRole } = require('../middleware/auth');
const prisma = new PrismaClient();

// Apply authentication and service provider role to all routes
router.use(auth());
router.use(requireRole('SERVICE_PROVIDER'));

/**
 * GET /api/service-provider/service-groups
 * Get all service groups for the service provider
 *
 * Service Group = BusinessProfession + related BusinessService records
 * Groups by profession and includes field info, profession info, and services
 */
router.get('/', async (req, res) => {
  try {
    // Get user's business
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        businesses: {
          where: { status: { in: ['PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED'] } },
          take: 1
        }
      }
    });

    if (!user || !user.businesses || user.businesses.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No business found for this user'
      });
    }

    const businessId = user.businesses[0].id;

    // Get all BusinessProfession records with related data
    const businessProfessions = await prisma.businessProfession.findMany({
      where: { businessId },
      include: {
        profession: {
          include: {
            field: true
          }
        }
      },
      orderBy: {
        addedAt: 'desc'
      }
    });

    // For each BusinessProfession, get related BusinessService records
    const serviceGroups = await Promise.all(
      businessProfessions.map(async (bp) => {
        const services = await prisma.businessService.findMany({
          where: {
            businessId,
            serviceTemplateId: {
              in: await prisma.serviceTemplate
                .findMany({
                  where: { professionId: bp.professionId },
                  select: { id: true }
                })
                .then(templates => templates.map(t => t.id))
            }
          },
          include: {
            serviceTemplate: true
          }
        });

        return {
          businessProfessionId: bp.id,
          fieldId: bp.profession.field.id,
          fieldName: bp.profession.field.nameHebrew,
          professionId: bp.professionId,
          professionName: bp.profession.nameHebrew,
          addedAt: bp.addedAt,
          services: services.map(s => ({
            id: s.id,
            serviceTemplateId: s.serviceTemplateId,
            name: s.customName || s.serviceTemplate.nameHebrew,
            description: s.description,
            durationMinutes: s.durationMinutes,
            regularPrice: s.regularPrice,
            active: s.active
          }))
        };
      })
    );

    res.json({
      success: true,
      data: serviceGroups
    });
  } catch (error) {
    console.error('Get service groups error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get service groups',
      details: error.message
    });
  }
});

/**
 * POST /api/service-provider/service-groups
 * Create a new service group
 *
 * Body: { fieldId, professionId, serviceTemplateIds: [...] }
 */
router.post('/', async (req, res) => {
  try {
    const { fieldId, professionId, serviceTemplateIds } = req.body;

    // Validate required fields
    if (!fieldId || !professionId || !serviceTemplateIds || !Array.isArray(serviceTemplateIds) || serviceTemplateIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'fieldId, professionId, and at least one serviceTemplateId are required'
      });
    }

    // Get user's business
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        businesses: {
          where: { status: { in: ['PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED'] } },
          take: 1
        }
      }
    });

    if (!user || !user.businesses || user.businesses.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No business found for this user'
      });
    }

    const businessId = user.businesses[0].id;

    // Validate profession belongs to field
    const profession = await prisma.profession.findFirst({
      where: {
        id: professionId,
        fieldId: fieldId,
        status: 'ACTIVE'
      }
    });

    if (!profession) {
      return res.status(400).json({
        success: false,
        error: 'Invalid profession or profession does not belong to selected field'
      });
    }

    // Validate service templates belong to profession
    const serviceTemplates = await prisma.serviceTemplate.findMany({
      where: {
        id: { in: serviceTemplateIds },
        professionId: professionId,
        status: 'ACTIVE'
      }
    });

    if (serviceTemplates.length !== serviceTemplateIds.length) {
      return res.status(400).json({
        success: false,
        error: 'Some service templates are invalid or do not belong to selected profession'
      });
    }

    // Check if BusinessProfession already exists
    const existingBP = await prisma.businessProfession.findFirst({
      where: {
        businessId,
        professionId
      }
    });

    if (existingBP) {
      return res.status(400).json({
        success: false,
        error: 'This profession already exists for your business. Please edit the existing group instead.'
      });
    }

    // Create BusinessProfession and BusinessService records in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create BusinessProfession
      const businessProfession = await tx.businessProfession.create({
        data: {
          businessId,
          professionId
        }
      });

      // Create BusinessService records
      const businessServices = await Promise.all(
        serviceTemplates.map(template =>
          tx.businessService.create({
            data: {
              businessId,
              serviceTemplateId: template.id,
              name: template.nameHebrew,
              description: template.description,
              durationMinutes: template.defaultDurationMinutes,
              regularPrice: template.defaultPrice || 0,
              active: true,
              approvalStatus: 'PENDING'
            }
          })
        )
      );

      return { businessProfession, businessServices };
    });

    res.status(201).json({
      success: true,
      message: 'Service group created successfully',
      data: {
        businessProfessionId: result.businessProfession.id,
        servicesCreated: result.businessServices.length
      }
    });
  } catch (error) {
    console.error('Create service group error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create service group',
      details: error.message
    });
  }
});

/**
 * PUT /api/service-provider/service-groups/:businessProfessionId
 * Update a service group (modify which services are selected)
 *
 * Body: { serviceTemplateIds: [...] }
 */
router.put('/:businessProfessionId', async (req, res) => {
  try {
    const { businessProfessionId } = req.params;
    const { serviceTemplateIds } = req.body;

    // Validate
    if (!serviceTemplateIds || !Array.isArray(serviceTemplateIds) || serviceTemplateIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one serviceTemplateId is required. Cannot create empty service group.'
      });
    }

    // Get user's business
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        businesses: {
          where: { status: { in: ['PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED'] } },
          take: 1
        }
      }
    });

    if (!user || !user.businesses || user.businesses.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No business found for this user'
      });
    }

    const businessId = user.businesses[0].id;

    // Get BusinessProfession and verify ownership
    const businessProfession = await prisma.businessProfession.findFirst({
      where: {
        id: parseInt(businessProfessionId),
        businessId
      },
      include: {
        profession: true
      }
    });

    if (!businessProfession) {
      return res.status(404).json({
        success: false,
        error: 'Service group not found'
      });
    }

    // Validate service templates belong to this profession
    const serviceTemplates = await prisma.serviceTemplate.findMany({
      where: {
        id: { in: serviceTemplateIds },
        professionId: businessProfession.professionId,
        status: 'ACTIVE'
      }
    });

    if (serviceTemplates.length !== serviceTemplateIds.length) {
      return res.status(400).json({
        success: false,
        error: 'Some service templates are invalid or do not belong to this profession'
      });
    }

    // Get existing BusinessService records for this profession
    const existingServices = await prisma.businessService.findMany({
      where: {
        businessId,
        serviceTemplateId: {
          in: await prisma.serviceTemplate
            .findMany({
              where: { professionId: businessProfession.professionId },
              select: { id: true }
            })
            .then(templates => templates.map(t => t.id))
        }
      }
    });

    const existingTemplateIds = existingServices.map(s => s.serviceTemplateId);
    const newTemplateIds = serviceTemplateIds;

    // Determine which to add and which to remove
    const toAdd = newTemplateIds.filter(id => !existingTemplateIds.includes(id));
    const toRemove = existingTemplateIds.filter(id => !newTemplateIds.includes(id));

    // Update in transaction
    await prisma.$transaction(async (tx) => {
      // Remove services no longer selected
      if (toRemove.length > 0) {
        await tx.businessService.deleteMany({
          where: {
            businessId,
            serviceTemplateId: { in: toRemove }
          }
        });
      }

      // Add new services
      if (toAdd.length > 0) {
        const templatesToAdd = serviceTemplates.filter(t => toAdd.includes(t.id));
        await Promise.all(
          templatesToAdd.map(template =>
            tx.businessService.create({
              data: {
                businessId,
                serviceTemplateId: template.id,
                name: template.nameHebrew,
                description: template.description,
                durationMinutes: template.defaultDurationMinutes,
                regularPrice: template.defaultPrice || 0,
                active: true,
                approvalStatus: 'PENDING'
              }
            })
          )
        );
      }
    });

    res.json({
      success: true,
      message: 'Service group updated successfully',
      data: {
        added: toAdd.length,
        removed: toRemove.length
      }
    });
  } catch (error) {
    console.error('Update service group error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update service group',
      details: error.message
    });
  }
});

/**
 * DELETE /api/service-provider/service-groups/:businessProfessionId
 * Delete a service group
 *
 * Removes BusinessProfession and all related BusinessService records
 */
router.delete('/:businessProfessionId', async (req, res) => {
  try {
    const { businessProfessionId } = req.params;

    // Get user's business
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        businesses: {
          where: { status: { in: ['PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED'] } },
          take: 1
        }
      }
    });

    if (!user || !user.businesses || user.businesses.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No business found for this user'
      });
    }

    const businessId = user.businesses[0].id;

    // Get BusinessProfession and verify ownership
    const businessProfession = await prisma.businessProfession.findFirst({
      where: {
        id: parseInt(businessProfessionId),
        businessId
      }
    });

    if (!businessProfession) {
      return res.status(404).json({
        success: false,
        error: 'Service group not found'
      });
    }

    // Delete in transaction
    await prisma.$transaction(async (tx) => {
      // Delete all BusinessService records for this profession
      const serviceTemplateIds = await tx.serviceTemplate
        .findMany({
          where: { professionId: businessProfession.professionId },
          select: { id: true }
        })
        .then(templates => templates.map(t => t.id));

      await tx.businessService.deleteMany({
        where: {
          businessId,
          serviceTemplateId: { in: serviceTemplateIds }
        }
      });

      // Delete BusinessProfession
      await tx.businessProfession.delete({
        where: { id: businessProfession.id }
      });
    });

    res.json({
      success: true,
      message: 'Service group deleted successfully'
    });
  } catch (error) {
    console.error('Delete service group error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete service group',
      details: error.message
    });
  }
});

module.exports = router;
