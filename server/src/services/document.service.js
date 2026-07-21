const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * ============================================
 * ADMIN - Document Type Management
 * ============================================
 */

async function createDocumentType(data) {
  const { name, nameHebrew, description, acceptedFormats, maxSizeKB } = data;

  if (!name || !nameHebrew) {
    return { success: false, error: 'Name and nameHebrew are required' };
  }

  if (!acceptedFormats || !Array.isArray(acceptedFormats) || acceptedFormats.length === 0) {
    return { success: false, error: 'At least one accepted format is required' };
  }

  if (!maxSizeKB || maxSizeKB <= 0) {
    return { success: false, error: 'Valid maxSizeKB is required' };
  }

  // Check for duplicate name
  const existing = await prisma.documentType.findFirst({
    where: { name }
  });

  if (existing) {
    return { success: false, error: 'Document type with this name already exists' };
  }

  try {
    const documentType = await prisma.documentType.create({
      data: {
        name,
        nameHebrew,
        description: description || '',
        acceptedFormats: JSON.stringify(acceptedFormats),
        maxSizeKB,
        status: 'ACTIVE'
      }
    });

    return {
      success: true,
      data: documentType
    };
  } catch (error) {
    console.error('Create document type error:', error);
    return {
      success: false,
      error: 'Failed to create document type',
      details: error.message
    };
  }
}

async function updateDocumentType(id, data) {
  const { name, nameHebrew, description, acceptedFormats, maxSizeKB } = data;

  const existing = await prisma.documentType.findUnique({
    where: { id: parseInt(id) }
  });

  if (!existing) {
    return { success: false, error: 'Document type not found' };
  }

  // Check for duplicate name (if changing name)
  if (name && name !== existing.name) {
    const duplicate = await prisma.documentType.findFirst({
      where: {
        name,
        id: { not: parseInt(id) }
      }
    });

    if (duplicate) {
      return { success: false, error: 'Document type with this name already exists' };
    }
  }

  const updateData = {};
  if (name) updateData.name = name;
  if (nameHebrew) updateData.nameHebrew = nameHebrew;
  if (description !== undefined) updateData.description = description;
  if (acceptedFormats) updateData.acceptedFormats = JSON.stringify(acceptedFormats);
  if (maxSizeKB) updateData.maxSizeKB = maxSizeKB;

  try {
    const documentType = await prisma.documentType.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    return {
      success: true,
      data: documentType
    };
  } catch (error) {
    console.error('Update document type error:', error);
    return {
      success: false,
      error: 'Failed to update document type',
      details: error.message
    };
  }
}

async function archiveDocumentType(id) {
  try {
    const documentType = await prisma.documentType.update({
      where: { id: parseInt(id) },
      data: { status: 'ARCHIVED' }
    });

    return {
      success: true,
      data: documentType
    };
  } catch (error) {
    console.error('Archive document type error:', error);
    return {
      success: false,
      error: 'Failed to archive document type',
      details: error.message
    };
  }
}

async function restoreDocumentType(id) {
  try {
    const documentType = await prisma.documentType.update({
      where: { id: parseInt(id) },
      data: { status: 'ACTIVE' }
    });

    return {
      success: true,
      data: documentType
    };
  } catch (error) {
    console.error('Restore document type error:', error);
    return {
      success: false,
      error: 'Failed to restore document type',
      details: error.message
    };
  }
}

async function deleteDocumentType(id) {
  const typeId = parseInt(id);

  if (Number.isNaN(typeId)) {
    return { success: false, error: 'Document type not found' };
  }

  // The whole body is wrapped so this always resolves to a { success } envelope.
  // These route handlers don't try/catch the awaited service call, and Express 4
  // does not forward async throws to the error middleware — so a bare throw here
  // would leave the request hanging with no JSON, which the client surfaces as an
  // opaque error. Returning an envelope keeps the delete flow well-behaved.
  try {
    const existing = await prisma.documentType.findUnique({
      where: { id: typeId }
    });

    if (!existing) {
      return { success: false, error: 'Document type not found' };
    }

    // Guard: only unused document types can be hard-deleted. "In use" means it is
    // referenced by any service requirement or any uploaded document. Otherwise the
    // admin should archive it instead (the DB FKs are onDelete: Restrict, so this
    // also prevents an accidental delete slipping through).
    const [requirementCount, uploadedCount] = await Promise.all([
      prisma.serviceDocumentRequirement.count({ where: { documentTypeId: typeId } }),
      prisma.uploadedDocument.count({ where: { documentTypeId: typeId } })
    ]);

    if (requirementCount > 0 || uploadedCount > 0) {
      return { success: false, error: 'Document type is in use and cannot be deleted' };
    }

    await prisma.documentType.delete({ where: { id: typeId } });
    return { success: true, data: { id: typeId } };
  } catch (error) {
    console.error('Delete document type error:', error);
    return {
      success: false,
      error: 'Failed to delete document type',
      details: error.message
    };
  }
}

async function listDocumentTypes(filters = {}) {
  const { status } = filters;

  const where = {};
  if (status) {
    where.status = status;
  }

  try {
    const documentTypes = await prisma.documentType.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return {
      success: true,
      data: documentTypes
    };
  } catch (error) {
    console.error('List document types error:', error);
    return {
      success: false,
      error: 'Failed to list document types',
      details: error.message
    };
  }
}

/**
 * ============================================
 * ADMIN - Service Document Requirements
 * ============================================
 */

async function addServiceDocumentRequirement(data) {
  const { serviceTemplateId, documentTypeId, instruction } = data;

  if (!serviceTemplateId || !documentTypeId) {
    return { success: false, error: 'serviceTemplateId and documentTypeId are required' };
  }

  // Validate ServiceTemplate exists
  const serviceTemplate = await prisma.serviceTemplate.findUnique({
    where: { id: parseInt(serviceTemplateId) }
  });

  if (!serviceTemplate) {
    return { success: false, error: 'Service template not found' };
  }

  // Validate DocumentType exists
  const documentType = await prisma.documentType.findUnique({
    where: { id: parseInt(documentTypeId) }
  });

  if (!documentType) {
    return { success: false, error: 'Document type not found' };
  }

  // Check if DocumentType is archived
  if (documentType.status === 'ARCHIVED') {
    return { success: false, error: 'Cannot add archived document type to requirements' };
  }

  // Check for duplicate requirement
  const existing = await prisma.serviceDocumentRequirement.findFirst({
    where: {
      serviceTemplateId: parseInt(serviceTemplateId),
      documentTypeId: parseInt(documentTypeId)
    }
  });

  if (existing) {
    return { success: false, error: 'This document type is already required for this service' };
  }

  try {
    const requirement = await prisma.serviceDocumentRequirement.create({
      data: {
        serviceTemplateId: parseInt(serviceTemplateId),
        documentTypeId: parseInt(documentTypeId),
        instruction: instruction || ''
      },
      include: {
        documentType: true,
        serviceTemplate: true
      }
    });

    return {
      success: true,
      data: requirement
    };
  } catch (error) {
    console.error('Add requirement error:', error);
    return {
      success: false,
      error: 'Failed to add requirement',
      details: error.message
    };
  }
}

async function updateServiceDocumentRequirement(id, data) {
  const { instruction } = data;

  if (instruction === undefined) {
    return { success: false, error: 'Instruction is required' };
  }

  try {
    const requirement = await prisma.serviceDocumentRequirement.update({
      where: { id: parseInt(id) },
      data: { instruction },
      include: {
        documentType: true,
        serviceTemplate: true
      }
    });

    return {
      success: true,
      data: requirement
    };
  } catch (error) {
    console.error('Update requirement error:', error);
    return {
      success: false,
      error: 'Failed to update requirement',
      details: error.message
    };
  }
}

async function removeServiceDocumentRequirement(id) {
  try {
    await prisma.serviceDocumentRequirement.delete({
      where: { id: parseInt(id) }
    });

    return { success: true };
  } catch (error) {
    console.error('Remove requirement error:', error);
    return {
      success: false,
      error: 'Failed to remove requirement',
      details: error.message
    };
  }
}

async function listServiceDocumentRequirements(serviceTemplateId) {
  try {
    const requirements = await prisma.serviceDocumentRequirement.findMany({
      where: {
        serviceTemplateId: parseInt(serviceTemplateId)
      },
      include: {
        documentType: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return {
      success: true,
      data: requirements
    };
  } catch (error) {
    console.error('List requirements error:', error);
    return {
      success: false,
      error: 'Failed to list requirements',
      details: error.message
    };
  }
}

/**
 * ============================================
 * SERVICE PROVIDER - Required Documents
 * ============================================
 */

async function getRequiredDocuments(businessId) {
  try {
    // Get business owner userId
    const business = await prisma.business.findUnique({
      where: { id: parseInt(businessId) },
      select: { ownerId: true }
    });

    if (!business || !business.ownerId) {
      return { success: false, error: 'Business not found or has no owner' };
    }

    // Get all services for this business
    const businessServices = await prisma.businessService.findMany({
      where: { businessId: parseInt(businessId) },
      include: {
        serviceTemplate: {
          include: {
            documentRequirements: {
              include: {
                documentType: true
              }
            }
          }
        }
      }
    });

    // Get all uploaded documents for this business owner
    const uploadedDocuments = await prisma.uploadedDocument.findMany({
      where: { userId: business.ownerId }
    });

    // Build map of documentTypeId -> uploaded document
    const uploadedMap = {};
    uploadedDocuments.forEach(doc => {
      uploadedMap[doc.documentTypeId] = doc;
    });

    // Collect all unique required document types
    const requiredDocsMap = new Map();

    businessServices.forEach(businessService => {
      const requirements = businessService.serviceTemplate.documentRequirements || [];

      requirements.forEach(req => {
        const docTypeId = req.documentTypeId;

        if (!requiredDocsMap.has(docTypeId)) {
          requiredDocsMap.set(docTypeId, {
            documentType: req.documentType,
            instruction: req.instruction,
            requiredByServices: [],
            uploaded: !!uploadedMap[docTypeId],
            uploadStatus: uploadedMap[docTypeId]?.status || null,
            uploadedDocumentId: uploadedMap[docTypeId]?.id || null
          });
        }

        // Add this service to the list of services requiring this doc type
        requiredDocsMap.get(docTypeId).requiredByServices.push({
          businessServiceId: businessService.id,
          serviceName: businessService.name
        });
      });
    });

    const requiredDocuments = Array.from(requiredDocsMap.values());

    return {
      success: true,
      data: requiredDocuments
    };
  } catch (error) {
    console.error('Get required documents error:', error);
    return {
      success: false,
      error: 'Failed to get required documents',
      details: error.message
    };
  }
}

/**
 * ============================================
 * SERVICE PROVIDER - Upload Document
 * ============================================
 */

async function uploadDocument(businessId, data) {
  const { documentTypeId, fileName, fileUrl, fileSizeKB } = data;

  if (!documentTypeId || !fileName || !fileUrl || !fileSizeKB) {
    return { success: false, error: 'documentTypeId, fileName, fileUrl, and fileSizeKB are required' };
  }

  // Get business owner userId
  const business = await prisma.business.findUnique({
    where: { id: parseInt(businessId) },
    select: { ownerId: true }
  });

  if (!business || !business.ownerId) {
    return { success: false, error: 'Business not found or has no owner' };
  }

  // Validate DocumentType exists
  const documentType = await prisma.documentType.findUnique({
    where: { id: parseInt(documentTypeId) }
  });

  if (!documentType) {
    return { success: false, error: 'Document type not found' };
  }

  // Validate file size
  if (fileSizeKB > documentType.maxSizeKB) {
    return {
      success: false,
      error: `File size exceeds maximum allowed (${documentType.maxSizeKB} KB)`
    };
  }

  // Validate file format (simple extension check)
  const fileExtension = fileName.split('.').pop().toLowerCase();
  const acceptedFormatsArray = JSON.parse(documentType.acceptedFormats);
  const acceptedFormats = acceptedFormatsArray.map(f => f.toLowerCase().replace('.', ''));

  if (!acceptedFormats.includes(fileExtension)) {
    return {
      success: false,
      error: `File format not accepted. Allowed formats: ${acceptedFormatsArray.join(', ')}`
    };
  }

  // Check if document already uploaded for this user + document type
  const existing = await prisma.uploadedDocument.findFirst({
    where: {
      userId: business.ownerId,
      documentTypeId: parseInt(documentTypeId)
    }
  });

  if (existing) {
    return {
      success: false,
      error: 'Document of this type already uploaded. Delete existing document first to re-upload.'
    };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Create uploaded document
      const uploadedDoc = await tx.uploadedDocument.create({
        data: {
          userId: business.ownerId,
          documentTypeId: parseInt(documentTypeId),
          fileName,
          fileUrl,
          fileSizeKB,
          status: 'PENDING'
        }
      });

      // Find all business services that require this document type
      const businessServices = await tx.businessService.findMany({
        where: {
          businessId: parseInt(businessId)
        },
        include: {
          serviceTemplate: {
            include: {
              documentRequirements: {
                where: {
                  documentTypeId: parseInt(documentTypeId)
                }
              }
            }
          }
        }
      });

      // Link uploaded document to all matching business services
      const linkPromises = [];
      businessServices.forEach(businessService => {
        if (businessService.serviceTemplate.documentRequirements.length > 0) {
          const requirement = businessService.serviceTemplate.documentRequirements[0];
          linkPromises.push(
            tx.businessServiceDocument.create({
              data: {
                businessServiceId: businessService.id,
                uploadedDocumentId: uploadedDoc.id,
                serviceDocumentRequirementId: requirement.id
              }
            })
          );
        }
      });

      await Promise.all(linkPromises);

      return uploadedDoc;
    });

    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('Upload document error:', error);
    return {
      success: false,
      error: 'Failed to upload document',
      details: error.message
    };
  }
}

/**
 * ============================================
 * SERVICE PROVIDER - Get Own Uploaded Documents
 * ============================================
 */

async function getServiceProviderUploadedDocuments(businessId) {
  try {
    // Get business owner userId
    const business = await prisma.business.findUnique({
      where: { id: parseInt(businessId) },
      select: { ownerId: true }
    });

    if (!business || !business.ownerId) {
      return { success: false, error: 'Business not found or has no owner' };
    }

    const documents = await prisma.uploadedDocument.findMany({
      where: {
        userId: business.ownerId
      },
      include: {
        documentType: {
          select: {
            id: true,
            name: true,
            nameHebrew: true
          }
        },
        reviewedBy: {
          select: {
            id: true,
            fullName: true
          }
        }
      },
      orderBy: { uploadedAt: 'desc' }
    });

    return {
      success: true,
      data: documents
    };
  } catch (error) {
    console.error('Get SP uploaded documents error:', error);
    return {
      success: false,
      error: 'Failed to get uploaded documents',
      details: error.message
    };
  }
}

/**
 * ============================================
 * ADMIN - Review Documents
 * ============================================
 */

async function listUploadedDocuments(filters = {}) {
  const { status, businessId } = filters;

  const where = {};
  if (status) {
    where.status = status;
  }

  // If businessId filter provided, get the owner's userId
  if (businessId) {
    const business = await prisma.business.findUnique({
      where: { id: parseInt(businessId) },
      select: { ownerId: true }
    });
    if (business && business.ownerId) {
      where.userId = business.ownerId;
    }
  }

  try {
    const documents = await prisma.uploadedDocument.findMany({
      where,
      include: {
        documentType: true,
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          },
          include: {
            businesses: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        reviewedBy: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      },
      orderBy: { uploadedAt: 'desc' }
    });

    return {
      success: true,
      data: documents
    };
  } catch (error) {
    console.error('List uploaded documents error:', error);
    return {
      success: false,
      error: 'Failed to list uploaded documents',
      details: error.message
    };
  }
}

async function approveDocument(documentId, adminId) {
  try {
    const document = await prisma.uploadedDocument.update({
      where: { id: parseInt(documentId) },
      data: {
        status: 'APPROVED',
        reviewedById: parseInt(adminId),
        reviewedAt: new Date()
      }
    });

    return {
      success: true,
      data: document
    };
  } catch (error) {
    console.error('Approve document error:', error);
    return {
      success: false,
      error: 'Failed to approve document',
      details: error.message
    };
  }
}

async function rejectDocument(documentId, adminId, adminNotes) {
  if (!adminNotes) {
    return { success: false, error: 'Admin notes are required when rejecting a document' };
  }

  try {
    const document = await prisma.uploadedDocument.update({
      where: { id: parseInt(documentId) },
      data: {
        status: 'REJECTED',
        reviewedById: parseInt(adminId),
        reviewedAt: new Date(),
        adminNotes
      }
    });

    return {
      success: true,
      data: document
    };
  } catch (error) {
    console.error('Reject document error:', error);
    return {
      success: false,
      error: 'Failed to reject document',
      details: error.message
    };
  }
}

async function updateDocumentVisibility(documentId, isPublic) {
  try {
    const document = await prisma.uploadedDocument.update({
      where: { id: parseInt(documentId) },
      data: { isPublic }
    });

    return {
      success: true,
      data: document
    };
  } catch (error) {
    console.error('Update visibility error:', error);
    return {
      success: false,
      error: 'Failed to update document visibility',
      details: error.message
    };
  }
}

/**
 * ============================================
 * COMPUTED STATUS
 * ============================================
 */

async function getDocumentStatus(businessId) {
  try {
    // Get required documents info
    const requiredDocsResult = await getRequiredDocuments(businessId);

    if (!requiredDocsResult.success) {
      return requiredDocsResult;
    }

    const requiredDocs = requiredDocsResult.data;

    // If no documents required, status is complete
    if (requiredDocs.length === 0) {
      return {
        success: true,
        data: {
          status: 'העלאת מסמכים הושלמה',
          statusCode: 'COMPLETE',
          requiredCount: 0,
          uploadedCount: 0,
          pendingCount: 0,
          approvedCount: 0,
          rejectedCount: 0
        }
      };
    }

    let uploadedCount = 0;
    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;

    requiredDocs.forEach(doc => {
      if (doc.uploaded) {
        uploadedCount++;
        if (doc.uploadStatus === 'PENDING') {
          pendingCount++;
        } else if (doc.uploadStatus === 'APPROVED') {
          approvedCount++;
        } else if (doc.uploadStatus === 'REJECTED') {
          rejectedCount++;
        }
      }
    });

    const missingCount = requiredDocs.length - uploadedCount;

    let status;
    let statusCode;

    // Logic:
    // - If any documents missing or rejected → נדרש להשלים העלאת מסמכים
    // - If all uploaded and at least one pending → העלאת מסמכים בבדיקה
    // - If all uploaded and all approved → העלאת מסמכים הושלמה

    if (missingCount > 0 || rejectedCount > 0) {
      status = 'נדרש להשלים העלאת מסמכים';
      statusCode = 'INCOMPLETE';
    } else if (pendingCount > 0) {
      status = 'העלאת מסמכים בבדיקה';
      statusCode = 'UNDER_REVIEW';
    } else if (approvedCount === requiredDocs.length) {
      status = 'העלאת מסמכים הושלמה';
      statusCode = 'COMPLETE';
    } else {
      // Fallback (shouldn't happen in normal flow)
      status = 'נדרש להשלים העלאת מסמכים';
      statusCode = 'INCOMPLETE';
    }

    return {
      success: true,
      data: {
        status,
        statusCode,
        requiredCount: requiredDocs.length,
        uploadedCount,
        pendingCount,
        approvedCount,
        rejectedCount,
        missingCount
      }
    };
  } catch (error) {
    console.error('Get document status error:', error);
    return {
      success: false,
      error: 'Failed to get document status',
      details: error.message
    };
  }
}

module.exports = {
  // Admin - Document Types
  createDocumentType,
  updateDocumentType,
  archiveDocumentType,
  restoreDocumentType,
  deleteDocumentType,
  listDocumentTypes,

  // Admin - Service Document Requirements
  addServiceDocumentRequirement,
  updateServiceDocumentRequirement,
  removeServiceDocumentRequirement,
  listServiceDocumentRequirements,

  // Service Provider - Documents
  getRequiredDocuments,
  uploadDocument,
  getDocumentStatus,
  getServiceProviderUploadedDocuments,

  // Admin - Review
  listUploadedDocuments,
  approveDocument,
  rejectDocument,
  updateDocumentVisibility
};
