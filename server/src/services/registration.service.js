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
 * Check if user has accepted all mandatory consents
 */
async function checkMandatoryConsents(userId) {
  // Get all mandatory consent types
  const mandatoryTypes = await prisma.consentType.findMany({
    where: { isMandatory: true, isActive: true }
  });

  if (mandatoryTypes.length === 0) {
    return { valid: true };
  }

  // Get user's accepted consents
  const userConsents = await prisma.userConsent.findMany({
    where: { userId }
  });

  const acceptedConsentTypeIds = userConsents.map(uc => uc.consentTypeId);
  const missingMandatory = mandatoryTypes.filter(mt => !acceptedConsentTypeIds.includes(mt.id));

  if (missingMandatory.length > 0) {
    return {
      valid: false,
      error: 'Missing required consents',
      details: missingMandatory.map(mt => mt.titleHe || mt.titleEn)
    };
  }

  return { valid: true };
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

  // Pre-transaction validation (format checks only - no DB queries)
  if (!validateEmail(email)) {
    return { success: false, errorType: 'VALIDATION_ERROR', error: 'Invalid email format' };
  }

  const phoneValidation = validatePhone(phone);
  if (!phoneValidation.valid) {
    return { success: false, errorType: 'VALIDATION_ERROR', error: phoneValidation.error };
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return { success: false, errorType: 'VALIDATION_ERROR', error: passwordValidation.error };
  }

  if (!businessIdentificationNumber) {
    return { success: false, errorType: 'VALIDATION_ERROR', error: 'Business identification number is required' };
  }

  // Check for duplicate arrays (before DB queries)
  const uniqueServices = new Set(serviceTemplateIds);
  if (uniqueServices.size !== serviceTemplateIds.length) {
    return { success: false, errorType: 'VALIDATION_ERROR', error: 'Duplicate services selected' };
  }

  const uniqueProfessions = new Set(professionIds);
  if (uniqueProfessions.size !== professionIds.length) {
    return { success: false, errorType: 'VALIDATION_ERROR', error: 'Duplicate professions selected' };
  }

  try {
    // Hash password before transaction
    const hashedPassword = await bcrypt.hash(password, 10);

    // ALL database operations in a single atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Check for existing email/phone INSIDE transaction to prevent race conditions
      const normalizedEmail = email.toLowerCase();
      const normalizedPhone = phoneValidation.normalized;

      const existing = await tx.user.findFirst({
        where: {
          OR: [
            { email: normalizedEmail },
            { phone: normalizedPhone }
          ]
        }
      });

      if (existing) {
        if (existing.email?.toLowerCase() === normalizedEmail) {
          throw new Error('EMAIL_ALREADY_REGISTERED');
        }
        if (existing.phone === normalizedPhone) {
          throw new Error('PHONE_ALREADY_REGISTERED');
        }
      }

      // 2. Validate that all field IDs exist
      const fields = await tx.field.findMany({
        where: { id: { in: fieldIds } }
      });
      if (fields.length !== fieldIds.length) {
        throw new Error('INVALID_FIELD_IDS');
      }

      // 3. Validate that all profession IDs exist
      const professions = await tx.profession.findMany({
        where: { id: { in: professionIds } }
      });
      if (professions.length !== professionIds.length) {
        throw new Error('INVALID_PROFESSION_IDS');
      }

      // 4. Validate that all service IDs exist and are ACTIVE
      const serviceTemplates = await tx.serviceTemplate.findMany({
        where: { id: { in: serviceTemplateIds } }
      });
      if (serviceTemplates.length !== serviceTemplateIds.length) {
        throw new Error('INVALID_SERVICE_IDS');
      }

      const inactiveServices = serviceTemplates.filter(st => st.status !== 'ACTIVE');
      if (inactiveServices.length > 0) {
        throw new Error(`INACTIVE_SERVICES: ${inactiveServices.map(s => s.name).join(', ')}`);
      }

      // 5. Validate hierarchy (professions belong to fields, services belong to professions)
      const fieldIdSet = new Set(fieldIds);
      for (const prof of professions) {
        if (!fieldIdSet.has(prof.fieldId)) {
          throw new Error(`HIERARCHY_ERROR: Profession "${prof.name}" does not belong to selected fields`);
        }
      }

      const professionIdSet = new Set(professionIds);
      for (const service of serviceTemplates) {
        if (!professionIdSet.has(service.professionId)) {
          throw new Error(`HIERARCHY_ERROR: Service "${service.name}" does not belong to selected professions`);
        }
      }

      // 6. Create user
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash: hashedPassword,
          role: 'SERVICE_PROVIDER',
          fullName: serviceProviderName,
          phone: normalizedPhone
        }
      });

      // 7. Check mandatory consents (using transaction context)
      const mandatoryTypes = await tx.consentType.findMany({
        where: { isMandatory: true, isActive: true }
      });

      const userConsents = await tx.userConsent.findMany({
        where: { userId: user.id }
      });

      const acceptedConsentTypeIds = userConsents.map(uc => uc.consentTypeId);
      const missingMandatory = mandatoryTypes.filter(mt => !acceptedConsentTypeIds.includes(mt.id));

      const consentCheck = {
        valid: missingMandatory.length === 0,
        missing: missingMandatory.map(mt => mt.titleHe || mt.titleEn)
      };

      const registrationStatus = consentCheck.valid ? 'PENDING_APPROVAL' : 'DRAFT';

      // 8. Create business
      const business = await tx.business.create({
        data: {
          name: businessName,
          ownerId: user.id,
          phone: normalizedPhone,
          phoneNormalized: normalizedPhone,
          identifierType: 'COMPANY_NUMBER',
          identifierValue: businessIdentificationNumber,
          address,
          city,
          status: 'PENDING_APPROVAL'
        }
      });

      // 9. Create BusinessProfession records
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

      // 10. Create BusinessService records
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

      // 11. Create ServiceProviderApproval record
      const approval = await tx.serviceProviderApproval.create({
        data: {
          serviceProviderId: business.id,
          status: registrationStatus
        }
      });

      return {
        user,
        business,
        businessProfessions,
        businessServices,
        approval,
        consentStatus: consentCheck
      };
    });

    return {
      success: true,
      data: {
        userId: result.user.id,
        businessId: result.business.id,
        approvalId: result.approval.id,
        status: result.approval.status,
        consentStatus: result.consentStatus
      }
    };
  } catch (error) {
    console.error('Registration error:', error);

    // Handle specific error types
    if (error.message === 'EMAIL_ALREADY_REGISTERED') {
      return {
        success: false,
        errorType: 'DUPLICATE_ERROR',
        error: 'Email already registered',
        field: 'email'
      };
    }

    if (error.message === 'PHONE_ALREADY_REGISTERED') {
      return {
        success: false,
        errorType: 'DUPLICATE_ERROR',
        error: 'Phone number already registered',
        field: 'phone'
      };
    }

    if (error.message === 'INVALID_FIELD_IDS') {
      return {
        success: false,
        errorType: 'VALIDATION_ERROR',
        error: 'One or more field IDs are invalid'
      };
    }

    if (error.message === 'INVALID_PROFESSION_IDS') {
      return {
        success: false,
        errorType: 'VALIDATION_ERROR',
        error: 'One or more profession IDs are invalid'
      };
    }

    if (error.message === 'INVALID_SERVICE_IDS') {
      return {
        success: false,
        errorType: 'VALIDATION_ERROR',
        error: 'One or more service IDs are invalid'
      };
    }

    if (error.message.startsWith('INACTIVE_SERVICES:')) {
      const services = error.message.replace('INACTIVE_SERVICES: ', '');
      return {
        success: false,
        errorType: 'VALIDATION_ERROR',
        error: 'Cannot register with inactive service templates',
        details: `Inactive services: ${services}`
      };
    }

    if (error.message.startsWith('HIERARCHY_ERROR:')) {
      const details = error.message.replace('HIERARCHY_ERROR: ', '');
      return {
        success: false,
        errorType: 'VALIDATION_ERROR',
        error: 'Invalid hierarchy',
        details
      };
    }

    // Handle Prisma unique constraint violations (P2002)
    if (error.code === 'P2002') {
      const target = error.meta?.target;
      if (Array.isArray(target)) {
        if (target[0] === 'email') {
          return {
            success: false,
            errorType: 'DUPLICATE_ERROR',
            error: 'Email already registered',
            field: 'email'
          };
        }
        if (target[0] === 'phone') {
          return {
            success: false,
            errorType: 'DUPLICATE_ERROR',
            error: 'Phone number already registered',
            field: 'phone'
          };
        }
        if (target.includes('identifierType') && target.includes('identifierValue')) {
          return {
            success: false,
            errorType: 'DUPLICATE_ERROR',
            error: 'Business identification number already registered',
            field: 'businessIdentificationNumber'
          };
        }
      }
    }

    // Generic database error
    return {
      success: false,
      errorType: 'DATABASE_ERROR',
      error: 'Registration failed due to database error',
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

/**
 * Get combined business status (approval, documents, consents, visibility)
 */
async function getCombinedBusinessStatus(businessId) {
  try {
    const business = await prisma.business.findUnique({
      where: { id: parseInt(businessId) },
      select: { ownerId: true }
    });

    if (!business) {
      return { success: false, error: 'Business not found' };
    }

    // Get approval status
    const approval = await prisma.serviceProviderApproval.findFirst({
      where: { serviceProviderId: parseInt(businessId) },
      orderBy: { createdAt: 'desc' }
    });

    // Get consent status
    const consentCheck = await checkMandatoryConsents(business.ownerId);

    // Get document status
    const documentService = require('./document.service');
    const docStatusResult = await documentService.getDocumentStatus(businessId);
    const documentStatus = docStatusResult.success ? docStatusResult.data : null;

    // Determine if business can appear publicly
    const canAppearPublicly =
      approval?.status === 'APPROVED' &&
      consentCheck.valid &&
      (documentStatus?.statusCode === 'COMPLETE' || documentStatus?.approvedCount === documentStatus?.requiredCount);

    return {
      success: true,
      data: {
        approvalStatus: approval?.status || 'UNKNOWN',
        consentStatus: consentCheck.valid ? 'COMPLETE' : 'INCOMPLETE',
        consentDetails: consentCheck.valid ? null : consentCheck.details,
        documentStatus: documentStatus?.statusCode || 'UNKNOWN',
        documentCounts: {
          required: documentStatus?.requiredCount || 0,
          uploaded: documentStatus?.uploadedCount || 0,
          approved: documentStatus?.approvedCount || 0,
          pending: documentStatus?.pendingCount || 0,
          rejected: documentStatus?.rejectedCount || 0
        },
        canAppearPublicly
      }
    };
  } catch (error) {
    console.error('Get combined business status error:', error);
    return {
      success: false,
      error: 'Failed to get combined status',
      details: error.message
    };
  }
}

/**
 * Submit registration for approval
 * Updates ServiceProviderApproval status to PENDING_APPROVAL if all requirements met
 */
async function submitForApproval(userId) {
  try {
    // 1. Get user's business
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        businesses: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user || !user.businesses || user.businesses.length === 0) {
      return { success: false, error: 'Cannot submit: No business found for this user' };
    }

    const business = user.businesses[0];

    // 2. Check if already submitted or approved
    const currentApproval = await prisma.serviceProviderApproval.findFirst({
      where: { serviceProviderId: business.id },
      orderBy: { createdAt: 'desc' }
    });

    if (!currentApproval) {
      return { success: false, error: 'Cannot submit: No approval record found' };
    }

    if (currentApproval.status !== 'DRAFT') {
      return {
        success: false,
        error: `Cannot submit: Registration already ${currentApproval.status.toLowerCase()}`
      };
    }

    // 3. Validate business details are complete
    if (!business.name || !business.identifierValue || !business.phone) {
      return {
        success: false,
        error: 'Cannot submit: Business details incomplete',
        details: {
          missingFields: [
            !business.name && 'Business name',
            !business.identifierValue && 'Business identification number',
            !business.phone && 'Phone number'
          ].filter(Boolean)
        }
      };
    }

    // 4. Validate at least one profession exists
    const professionCount = await prisma.businessProfession.count({
      where: { businessId: business.id }
    });

    if (professionCount === 0) {
      return {
        success: false,
        error: 'Cannot submit: At least one profession must be selected'
      };
    }

    // 5. Validate at least one service exists
    const serviceCount = await prisma.businessService.count({
      where: { businessId: business.id }
    });

    if (serviceCount === 0) {
      return {
        success: false,
        error: 'Cannot submit: At least one service must be registered'
      };
    }

    // 6. Check mandatory consents
    const consentCheck = await checkMandatoryConsents(userId);
    if (!consentCheck.valid) {
      return {
        success: false,
        error: 'Cannot submit: Missing required consents',
        details: consentCheck.missing || consentCheck.details
      };
    }

    // 7. Check document requirements
    const documentService = require('./document.service');
    const docStatus = await documentService.getDocumentStatus(business.id);

    if (!docStatus.success) {
      return {
        success: false,
        error: 'Cannot submit: Unable to verify document status',
        details: docStatus.error
      };
    }

    // Require all documents to be uploaded (not necessarily approved yet)
    if (docStatus.data.uploadedCount < docStatus.data.requiredCount) {
      return {
        success: false,
        error: 'Cannot submit: Not all required documents have been uploaded',
        details: {
          required: docStatus.data.requiredCount,
          uploaded: docStatus.data.uploadedCount,
          missing: docStatus.data.requiredCount - docStatus.data.uploadedCount
        }
      };
    }

    // All validations passed - Update ServiceProviderApproval status to PENDING_APPROVAL
    const updatedApproval = await prisma.serviceProviderApproval.update({
      where: { id: currentApproval.id },
      data: {
        status: 'PENDING_APPROVAL'
      }
    });

    return {
      success: true,
      data: {
        approvalId: updatedApproval.id,
        status: updatedApproval.status,
        updatedAt: updatedApproval.updatedAt
      }
    };
  } catch (error) {
    console.error('Submit for approval error:', error);
    return {
      success: false,
      error: 'Failed to submit for approval',
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
  validateCompleteHierarchy,
  getCombinedBusinessStatus,
  submitForApproval
};
