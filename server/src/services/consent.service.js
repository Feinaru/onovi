const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * ============================================
 * ADMIN - Legal Document Management
 * ============================================
 */

// Document type codes
const DOCUMENT_TYPES = {
  TERMS: 'TERMS_OF_USE',
  PRIVACY: 'PRIVACY_POLICY',
  MARKETING: 'MARKETING_CONSENT'
};

async function createDraft(data, adminId) {
  const { code, titleHe, titleEn, contentHe, contentEn, isMandatory } = data;

  if (!code || !titleHe || !titleEn || !contentHe || !contentEn) {
    return { success: false, error: 'All fields are required' };
  }

  // Check if document type already exists
  const existing = await prisma.consentType.findUnique({
    where: { code }
  });

  if (existing) {
    return { success: false, error: 'Document type with this code already exists. Use edit instead.' };
  }

  try {
    const consentType = await prisma.consentType.create({
      data: {
        code,
        titleHe,
        titleEn,
        contentHe,
        contentEn,
        isMandatory: isMandatory !== undefined ? isMandatory : true,
        version: 1,
        isActive: false, // Draft starts as inactive
        displayOrder: 0
      }
    });

    return {
      success: true,
      data: consentType
    };
  } catch (error) {
    console.error('Create draft error:', error);
    return {
      success: false,
      error: 'Failed to create draft',
      details: error.message
    };
  }
}

async function editDraft(code, data, adminId) {
  const { titleHe, titleEn, contentHe, contentEn, isMandatory } = data;

  const existing = await prisma.consentType.findUnique({
    where: { code }
  });

  if (!existing) {
    return { success: false, error: 'Document not found' };
  }

  if (existing.isActive) {
    return { success: false, error: 'Cannot edit published version. Create new version instead.' };
  }

  const updateData = {};
  if (titleHe) updateData.titleHe = titleHe;
  if (titleEn) updateData.titleEn = titleEn;
  if (contentHe) updateData.contentHe = contentHe;
  if (contentEn) updateData.contentEn = contentEn;
  if (isMandatory !== undefined) updateData.isMandatory = isMandatory;

  try {
    const consentType = await prisma.consentType.update({
      where: { code },
      data: updateData
    });

    return {
      success: true,
      data: consentType
    };
  } catch (error) {
    console.error('Edit draft error:', error);
    return {
      success: false,
      error: 'Failed to edit draft',
      details: error.message
    };
  }
}

async function publishVersion(code, adminId) {
  const existing = await prisma.consentType.findUnique({
    where: { code }
  });

  if (!existing) {
    return { success: false, error: 'Document not found' };
  }

  if (existing.isActive) {
    return { success: false, error: 'This version is already published' };
  }

  try {
    // Check if there's another active version - if so, create new version
    const hasActiveVersion = await prisma.consentType.findFirst({
      where: {
        code,
        isActive: true
      }
    });

    if (hasActiveVersion) {
      // Increment version and create new record
      const newVersion = await prisma.consentType.create({
        data: {
          code: `${code}_v${existing.version + 1}`,
          titleHe: existing.titleHe,
          titleEn: existing.titleEn,
          contentHe: existing.contentHe,
          contentEn: existing.contentEn,
          isMandatory: existing.isMandatory,
          version: existing.version + 1,
          isActive: true,
          displayOrder: existing.displayOrder
        }
      });

      // Deactivate old version
      await prisma.consentType.update({
        where: { code: hasActiveVersion.code },
        data: { isActive: false }
      });

      return {
        success: true,
        data: newVersion
      };
    } else {
      // Just activate this version
      const published = await prisma.consentType.update({
        where: { code },
        data: { isActive: true }
      });

      return {
        success: true,
        data: published
      };
    }
  } catch (error) {
    console.error('Publish version error:', error);
    return {
      success: false,
      error: 'Failed to publish version',
      details: error.message
    };
  }
}

async function archiveVersion(code, adminId) {
  try {
    const archived = await prisma.consentType.update({
      where: { code },
      data: { isActive: false }
    });

    return {
      success: true,
      data: archived
    };
  } catch (error) {
    console.error('Archive version error:', error);
    return {
      success: false,
      error: 'Failed to archive version',
      details: error.message
    };
  }
}

async function listVersions(baseCode) {
  try {
    // Find all versions that start with this base code
    const versions = await prisma.consentType.findMany({
      where: {
        code: {
          startsWith: baseCode
        }
      },
      orderBy: { version: 'desc' }
    });

    return {
      success: true,
      data: versions
    };
  } catch (error) {
    console.error('List versions error:', error);
    return {
      success: false,
      error: 'Failed to list versions',
      details: error.message
    };
  }
}

async function getPublishedVersion(baseCode) {
  try {
    const published = await prisma.consentType.findFirst({
      where: {
        code: {
          startsWith: baseCode
        },
        isActive: true
      },
      orderBy: { version: 'desc' }
    });

    if (!published) {
      return { success: false, error: 'No published version found' };
    }

    return {
      success: true,
      data: published
    };
  } catch (error) {
    console.error('Get published version error:', error);
    return {
      success: false,
      error: 'Failed to get published version',
      details: error.message
    };
  }
}

/**
 * ============================================
 * SERVICE PROVIDER - Legal Documents
 * ============================================
 */

async function getCurrentLegalDocuments() {
  try {
    // Get all published documents
    const documents = await prisma.consentType.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' }
    });

    return {
      success: true,
      data: documents
    };
  } catch (error) {
    console.error('Get current legal documents error:', error);
    return {
      success: false,
      error: 'Failed to get legal documents',
      details: error.message
    };
  }
}

async function acceptLegalDocuments(userId, consents, metadata) {
  const { ipAddress, userAgent, servicesSnapshot } = metadata;

  if (!consents || !Array.isArray(consents) || consents.length === 0) {
    return { success: false, error: 'Consents array is required' };
  }

  try {
    // Validate all consent type IDs exist and are published
    const consentTypeIds = consents.map(c => c.consentTypeId);
    const consentTypes = await prisma.consentType.findMany({
      where: {
        id: { in: consentTypeIds }
      }
    });

    if (consentTypes.length !== consentTypeIds.length) {
      return { success: false, error: 'One or more consent types not found' };
    }

    // Check all consent types are published
    const unpublished = consentTypes.filter(ct => !ct.isActive);
    if (unpublished.length > 0) {
      return { success: false, error: 'Cannot accept unpublished document versions' };
    }

    // Check mandatory consents are present
    // Get ALL mandatory types
    const allMandatoryTypes = await prisma.consentType.findMany({
      where: {
        isMandatory: true,
        isActive: true
      }
    });

    // Check which mandatory types are in this request
    const acceptedConsentTypeIds = consents.map(c => c.consentTypeId);

    // Check which mandatory types user has already accepted
    const existingConsents = await prisma.userConsent.findMany({
      where: {
        userId
      },
      select: {
        consentTypeId: true
      }
    });
    const alreadyAcceptedIds = existingConsents.map(c => c.consentTypeId);

    // Combine current request with already accepted
    const allAcceptedIds = [...new Set([...acceptedConsentTypeIds, ...alreadyAcceptedIds])];

    // Check if any mandatory types are still missing
    const missingMandatory = allMandatoryTypes.filter(mt => !allAcceptedIds.includes(mt.id));

    if (missingMandatory.length > 0) {
      return {
        success: false,
        error: 'Missing required consents',
        details: missingMandatory.map(mt => mt.code)
      };
    }

    // Create consent records
    const userConsents = await Promise.all(
      consents.map(consent => {
        const consentType = consentTypes.find(ct => ct.id === consent.consentTypeId);
        return prisma.userConsent.create({
          data: {
            userId,
            consentTypeId: consent.consentTypeId,
            consentVersion: consentType.version,
            wasScrolled: consent.wasScrolled || false,
            ipAddress: ipAddress || null,
            userAgent: userAgent || null,
            selectedServicesSnapshot: servicesSnapshot ? JSON.stringify(servicesSnapshot) : null
          }
        });
      })
    );

    return {
      success: true,
      data: userConsents
    };
  } catch (error) {
    console.error('Accept legal documents error:', error);
    return {
      success: false,
      error: 'Failed to accept legal documents',
      details: error.message
    };
  }
}

/**
 * ============================================
 * ADMIN - Consent History
 * ============================================
 */

async function getConsentHistory(filters = {}) {
  const { userId, consentTypeId, code } = filters;

  try {
    const where = {};

    if (userId) {
      where.userId = parseInt(userId);
    }

    if (consentTypeId) {
      where.consentTypeId = parseInt(consentTypeId);
    }

    if (code) {
      // Find consent type by code
      const consentType = await prisma.consentType.findFirst({
        where: { code: { startsWith: code } }
      });
      if (consentType) {
        where.consentTypeId = consentType.id;
      }
    }

    const consents = await prisma.userConsent.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true
          }
        },
        consentType: true
      },
      orderBy: { agreedAt: 'desc' }
    });

    return {
      success: true,
      data: consents
    };
  } catch (error) {
    console.error('Get consent history error:', error);
    return {
      success: false,
      error: 'Failed to get consent history',
      details: error.message
    };
  }
}

async function getUserConsents(userId) {
  try {
    const consents = await prisma.userConsent.findMany({
      where: { userId: parseInt(userId) },
      include: {
        consentType: true
      },
      orderBy: { agreedAt: 'desc' }
    });

    return {
      success: true,
      data: consents
    };
  } catch (error) {
    console.error('Get user consents error:', error);
    return {
      success: false,
      error: 'Failed to get user consents',
      details: error.message
    };
  }
}

module.exports = {
  DOCUMENT_TYPES,

  // Admin - Legal Documents
  createDraft,
  editDraft,
  publishVersion,
  archiveVersion,
  listVersions,
  getPublishedVersion,

  // Service Provider - Legal Documents
  getCurrentLegalDocuments,
  acceptLegalDocuments,

  // Admin - Consent History
  getConsentHistory,
  getUserConsents
};
