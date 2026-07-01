const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

/**
 * Service Provider Registration Service
 *
 * Handles complete registration flow:
 * 1. Account creation
 * 2. Field/Profession/Service selection
 * 3. Business information
 * 4. Registration completion
 */

/**
 * Validate hierarchy: Service → Profession → Field
 */
async function validateServiceHierarchy(serviceTemplateId) {
  const service = await prisma.serviceTemplate.findUnique({
    where: { id: serviceTemplateId },
    include: {
      profession: {
        include: {
          field: true
        }
      }
    }
  });

  if (!service) {
    return { valid: false, error: 'Service not found' };
  }

  return {
    valid: true,
    service,
    profession: service.profession,
    field: service.profession.field
  };
}

/**
 * Validate that all services belong to selected professions
 * and all professions belong to selected fields
 */
async function validateCompleteHierarchy(fieldIds, professionIds, serviceTemplateIds) {
  const errors = [];

  // Validate professions belong to fields
  const professions = await prisma.profession.findMany({
    where: { id: { in: professionIds } },
    include: { field: true }
  });

  const fieldIdSet = new Set(fieldIds);
  for (const prof of professions) {
    if (!fieldIdSet.has(prof.fieldId)) {
      errors.push(`Profession "${prof.name}" does not belong to any selected field`);
    }
  }

  // Validate services belong to professions
  const services = await prisma.serviceTemplate.findMany({
    where: { id: { in: serviceTemplateIds } },
    include: { profession: true }
  });

  const professionIdSet = new Set(professionIds);
  for (const service of services) {
    if (!professionIdSet.has(service.professionId)) {
      errors.push(`Service "${service.name}" does not belong to any selected profession`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Check if email or phone already exists
 */
async function checkEmailOrPhoneExists(email, phone) {
  const normalizedPhone = phone.replace(/\D/g, '');
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email: email.toLowerCase() },
        { phone: normalizedPhone }
      ]
    }
  });
  return existing;
}

/**
 * Validate phone number (normalize and validate format)
 */
function validatePhone(phone) {
  const normalized = phone.replace(/\D/g, '');
  if (normalized.length < 9 || normalized.length > 15) {
    return { valid: false, error: 'Invalid phone number' };
  }
  return { valid: true, normalized };
}

/**
 * Validate email format
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
function validatePassword(password) {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  return { valid: true };
}

/**
 * Create new service provider registration
 */
async function createServiceProviderRegistration(data) {
  const {
    email,
    password,
    serviceProviderName,
    businessName,
    businessIdentificationNumber,
    phone,
    address,
    city,
    fieldIds,
    professionIds,
    serviceTemplateIds
  } = data;

  // Validation
  if (!validateEmail(email)) {
    return { success: false, error: 'Invalid email format' };
  }

  const phoneValidation = validatePhone(phone);
  if (!phoneValidation.valid) {
    return { success: false, error: phoneValidation.error };
  }

  const existing = await checkEmailOrPhoneExists(email, phone);
  if (existing) {
    if (existing.email?.toLowerCase() === email.toLowerCase()) {
      return { success: false, error: 'Email already registered' };
    }
    if (existing.phone === phoneValidation.normalized) {
      return { success: false, error: 'Phone number already registered' };
    }
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return { success: false, error: passwordValidation.error };
  }

  if (!businessIdentificationNumber) {
    return { success: false, error: 'Business identification number is required' };
  }

  // Check for duplicates first (before checking if IDs exist)
  const uniqueServices = new Set(serviceTemplateIds);
  if (uniqueServices.size !== serviceTemplateIds.length) {
    return { success: false, error: 'Duplicate services selected' };
  }

  const uniqueProfessions = new Set(professionIds);
  if (uniqueProfessions.size !== professionIds.length) {
    return { success: false, error: 'Duplicate professions selected' };
  }

  // Validate that all IDs exist
  const fields = await prisma.field.findMany({
    where: { id: { in: fieldIds } }
  });
  if (fields.length !== fieldIds.length) {
    return { success: false, error: 'One or more field IDs are invalid' };
  }

  const professions = await prisma.profession.findMany({
    where: { id: { in: professionIds } }
  });
  if (professions.length !== professionIds.length) {
    return { success: false, error: 'One or more profession IDs are invalid' };
  }

  const serviceTemplates = await prisma.serviceTemplate.findMany({
    where: { id: { in: serviceTemplateIds } }
  });
  if (serviceTemplates.length !== serviceTemplateIds.length) {
    return { success: false, error: 'One or more service IDs are invalid' };
  }

  // Validate hierarchy
  const hierarchyValidation = await validateCompleteHierarchy(
    fieldIds,
    professionIds,
    serviceTemplateIds
  );

  if (!hierarchyValidation.valid) {
    return {
      success: false,
      error: 'Invalid hierarchy',
      details: hierarchyValidation.errors
    };
  }

  try {
    // Create user account
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash: hashedPassword,
          role: 'SERVICE_PROVIDER',
          fullName: serviceProviderName,
          phone: phoneValidation.normalized
        }
      });

      // Create business
      const business = await tx.business.create({
        data: {
          name: businessName,
          ownerId: user.id,
          phone: phoneValidation.normalized,
          phoneNormalized: phoneValidation.normalized,
          identifierType: 'COMPANY_NUMBER',
          identifierValue: businessIdentificationNumber,
          address,
          city,
          status: 'PENDING_APPROVAL'
        }
      });

      // Create BusinessProfession records
      const businessProfessions = await Promise.all(
        professionIds.map(professionId =>
          tx.businessProfession.create({
            data: {
              businessId: business.id,
              professionId
            }
          })
        )
      );

      // Create BusinessService records
      const serviceTemplates = await tx.serviceTemplate.findMany({
        where: { id: { in: serviceTemplateIds } }
      });

      const businessServices = await Promise.all(
        serviceTemplates.map(template =>
          tx.businessService.create({
            data: {
              businessId: business.id,
              serviceTemplateId: template.id,
              name: template.name,
              description: template.description,
              durationMinutes: template.defaultDurationMinutes,
              regularPrice: template.defaultPrice || 0,
              approvalStatus: 'PENDING'
            }
          })
        )
      );

      // Create ServiceProviderApproval record
      const approval = await tx.serviceProviderApproval.create({
        data: {
          serviceProviderId: business.id,
          status: 'PENDING_APPROVAL'
        }
      });

      return {
        user,
        business,
        businessProfessions,
        businessServices,
        approval
      };
    });

    return {
      success: true,
      data: {
        userId: result.user.id,
        businessId: result.business.id,
        approvalId: result.approval.id,
        status: 'PENDING_APPROVAL'
      }
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: 'Registration failed',
      details: error.message
    };
  }
}

/**
 * Get registration status
 */
async function getRegistrationStatus(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      businesses: {
        include: {
          professions: {
            include: {
              profession: {
                include: {
                  field: true
                }
              }
            }
          },
          services: {
            include: {
              serviceTemplate: {
                include: {
                  profession: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  const business = user.businesses[0];
  if (!business) {
    return {
      success: true,
      status: 'NOT_STARTED',
      data: null
    };
  }

  const approval = await prisma.serviceProviderApproval.findFirst({
    where: { serviceProviderId: business.id },
    orderBy: { createdAt: 'desc' }
  });

  return {
    success: true,
    status: business.status,
    data: {
      businessId: business.id,
      businessName: business.name,
      approvalStatus: approval?.status || 'UNKNOWN',
      fields: [...new Set(business.professions.map(bp => bp.profession.field))],
      professions: business.professions.map(bp => bp.profession),
      services: business.services.map(bs => bs.serviceTemplate),
      createdAt: business.createdAt
    }
  };
}

/**
 * Update incomplete registration
 */
async function updateRegistration(userId, data) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { businesses: true }
  });

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  const business = user.businesses[0];
  if (!business) {
    return { success: false, error: 'No business found for this user' };
  }

  if (business.status !== 'PENDING_APPROVAL') {
    return { success: false, error: 'Cannot update registration after approval/rejection' };
  }

  const {
    businessName,
    phone,
    address,
    city,
    businessIdentificationNumber,
    fieldIds,
    professionIds,
    serviceTemplateIds
  } = data;

  // Validate hierarchy if provided
  if (fieldIds && professionIds && serviceTemplateIds) {
    const hierarchyValidation = await validateCompleteHierarchy(
      fieldIds,
      professionIds,
      serviceTemplateIds
    );

    if (!hierarchyValidation.valid) {
      return {
        success: false,
        error: 'Invalid hierarchy',
        details: hierarchyValidation.errors
      };
    }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Update business info
      const updateData = {};
      if (businessName) updateData.name = businessName;
      if (phone) {
        const phoneValidation = validatePhone(phone);
        if (!phoneValidation.valid) {
          throw new Error(phoneValidation.error);
        }
        updateData.phone = phoneValidation.normalized;
        updateData.phoneNormalized = phoneValidation.normalized;
      }
      if (address) updateData.address = address;
      if (city) updateData.city = city;
      if (businessIdentificationNumber) updateData.identifierValue = businessIdentificationNumber;

      const updatedBusiness = await tx.business.update({
        where: { id: business.id },
        data: updateData
      });

      // Update professions if provided
      if (professionIds) {
        // Delete existing
        await tx.businessProfession.deleteMany({
          where: { businessId: business.id }
        });

        // Create new
        await Promise.all(
          professionIds.map(professionId =>
            tx.businessProfession.create({
              data: {
                businessId: business.id,
                professionId
              }
            })
          )
        );
      }

      // Update services if provided
      if (serviceTemplateIds) {
        // Delete existing
        await tx.businessService.deleteMany({
          where: { businessId: business.id }
        });

        // Get service templates
        const serviceTemplates = await tx.serviceTemplate.findMany({
          where: { id: { in: serviceTemplateIds } }
        });

        // Create new
        await Promise.all(
          serviceTemplates.map(template =>
            tx.businessService.create({
              data: {
                businessId: business.id,
                serviceTemplateId: template.id,
                name: template.name,
                description: template.description,
                durationMinutes: template.defaultDurationMinutes,
                regularPrice: template.defaultPrice || 0,
                approvalStatus: 'PENDING'
              }
            })
          )
        );
      }

      return updatedBusiness;
    });

    return {
      success: true,
      data: {
        businessId: result.id,
        status: result.status
      }
    };
  } catch (error) {
    console.error('Update registration error:', error);
    return {
      success: false,
      error: 'Update failed',
      details: error.message
    };
  }
}

/**
 * Create suggestion request
 */
async function createSuggestionRequest(data) {
  const {
    userId,
    type,
    name,
    description,
    parentFieldId,
    parentProfessionId
  } = data;

  if (!['FIELD', 'PROFESSION', 'SERVICE'].includes(type)) {
    return { success: false, error: 'Invalid suggestion type' };
  }

  if (!name || !name.trim()) {
    return { success: false, error: 'Name is required' };
  }

  // Build context info JSON
  const contextInfo = {};
  if (parentFieldId) contextInfo.fieldId = parentFieldId;
  if (parentProfessionId) contextInfo.professionId = parentProfessionId;

  try {
    const suggestion = await prisma.suggestionRequest.create({
      data: {
        requestedById: userId,
        requestType: type,
        requestedName: name.trim(),
        reason: description?.trim() || '',
        contextInfo: Object.keys(contextInfo).length > 0 ? JSON.stringify(contextInfo) : null,
        status: 'PENDING'
      }
    });

    return {
      success: true,
      data: {
        suggestionId: suggestion.id,
        status: suggestion.status
      }
    };
  } catch (error) {
    console.error('Suggestion request error:', error);
    return {
      success: false,
      error: 'Failed to create suggestion request',
      details: error.message
    };
  }
}

module.exports = {
  createServiceProviderRegistration,
  getRegistrationStatus,
  updateRegistration,
  createSuggestionRequest,
  validateServiceHierarchy,
  validateCompleteHierarchy
};
