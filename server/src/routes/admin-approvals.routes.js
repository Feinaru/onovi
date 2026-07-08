const express = require('express');
const prisma = require('../lib/prisma');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and admin role to all routes
router.use(auth());
router.use(requireRole('ADMIN'));

/**
 * List pending service provider registrations
 * GET /api/admin/approvals
 */
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;

    const where = {};
    if (status) {
      where.status = status;
    } else {
      // Default: show pending approvals
      where.status = 'PENDING_APPROVAL';
    }

    const approvals = await prisma.serviceProviderApproval.findMany({
      where,
      include: {
        serviceProvider: {
          include: {
            owner: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                email: true,
                role: true
              }
            },
            category: {
              select: {
                id: true,
                name: true
              }
            },
            professions: {
              include: {
                profession: {
                  include: {
                    field: {
                      select: {
                        id: true,
                        name: true,
                        nameHebrew: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        reviewedBy: {
          select: {
            id: true,
            fullName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(approvals);
  } catch (err) {
    next(err);
  }
});

/**
 * Get one registration detail
 * GET /api/admin/approvals/:id
 */
router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const approval = await prisma.serviceProviderApproval.findUnique({
      where: { id },
      include: {
        serviceProvider: {
          include: {
            owner: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                email: true,
                role: true,
                createdAt: true
              }
            },
            category: true,
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
              where: {
                active: true
              },
              include: {
                serviceTemplate: true
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
      }
    });

    if (!approval) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    // Fetch uploaded documents for this service provider
    const documents = await prisma.uploadedDocument.findMany({
      where: {
        userId: approval.serviceProvider.ownerId
      },
      include: {
        documentType: true,
        reviewedBy: {
          select: {
            id: true,
            fullName: true
          }
        }
      },
      orderBy: {
        uploadedAt: 'desc'
      }
    });

    // Fetch legal consents
    const consents = await prisma.userConsent.findMany({
      where: {
        userId: approval.serviceProvider.ownerId
      },
      include: {
        consentType: true
      },
      orderBy: {
        agreedAt: 'desc'
      }
    });

    res.json({
      ...approval,
      documents,
      consents
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Approve registration
 * POST /api/admin/approvals/:id/approve
 */
router.post('/:id/approve', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const adminId = req.user.id;
    const { adminNote } = req.body;

    // Use transaction to update both Business and ServiceProviderApproval atomically
    const result = await prisma.$transaction(async (tx) => {
      // Get the approval record
      const approval = await tx.serviceProviderApproval.findUnique({
        where: { id },
        include: {
          serviceProvider: true
        }
      });

      if (!approval) {
        throw new Error('Registration not found');
      }

      if (approval.status === 'APPROVED') {
        throw new Error('Registration already approved');
      }

      if (approval.status === 'REJECTED') {
        throw new Error('Cannot approve rejected registration');
      }

      // Update ServiceProviderApproval
      const updatedApproval = await tx.serviceProviderApproval.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewedById: adminId,
          reviewedAt: new Date(),
          adminNote: adminNote || null
        }
      });

      // Update Business status
      const updatedBusiness = await tx.business.update({
        where: { id: approval.serviceProviderId },
        data: {
          status: 'ACTIVE'
        }
      });

      return {
        approval: updatedApproval,
        business: updatedBusiness
      };
    });

    res.json({
      success: true,
      message: 'Registration approved successfully',
      data: result
    });
  } catch (err) {
    if (err.message === 'Registration not found') {
      return res.status(404).json({ success: false, message: err.message });
    }
    if (err.message.includes('already approved') || err.message.includes('rejected')) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
});

/**
 * Reject registration
 * POST /api/admin/approvals/:id/reject
 */
router.post('/:id/reject', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const adminId = req.user.id;
    const { adminNote } = req.body;

    if (!adminNote || adminNote.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    // Use transaction to update both Business and ServiceProviderApproval atomically
    const result = await prisma.$transaction(async (tx) => {
      // Get the approval record
      const approval = await tx.serviceProviderApproval.findUnique({
        where: { id },
        include: {
          serviceProvider: true
        }
      });

      if (!approval) {
        throw new Error('Registration not found');
      }

      if (approval.status === 'REJECTED') {
        throw new Error('Registration already rejected');
      }

      if (approval.status === 'APPROVED') {
        throw new Error('Cannot reject approved registration');
      }

      // Update ServiceProviderApproval
      const updatedApproval = await tx.serviceProviderApproval.update({
        where: { id },
        data: {
          status: 'REJECTED',
          reviewedById: adminId,
          reviewedAt: new Date(),
          adminNote: adminNote.trim()
        }
      });

      // Keep Business status as PENDING_APPROVAL or set to SUSPENDED
      // (Business owner can re-submit or appeal)
      const updatedBusiness = await tx.business.update({
        where: { id: approval.serviceProviderId },
        data: {
          status: 'SUSPENDED'
        }
      });

      return {
        approval: updatedApproval,
        business: updatedBusiness
      };
    });

    res.json({
      success: true,
      message: 'Registration rejected',
      data: result
    });
  } catch (err) {
    if (err.message === 'Registration not found') {
      return res.status(404).json({ success: false, message: err.message });
    }
    if (err.message.includes('already rejected') || err.message.includes('approved')) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
});

module.exports = router;
