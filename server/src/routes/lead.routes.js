const router = require('express').Router();
const prisma = require('../lib/prisma');
const { auth, requireRole } = require('../middleware/auth');
const { validateIdentifier, maskIdentifier } = require('../utils/identifierValidation');

/**
 * Calculate registration status for a lead
 * @param {Object} lead - Lead object with linkedBusiness relation
 * @returns {string} NOT_REGISTERED | REGISTERED
 */
function getRegistrationStatus(lead) {
  return lead.linkedBusiness ? 'REGISTERED' : 'NOT_REGISTERED';
}

/**
 * Calculate priority level for a lead
 * @param {Object} lead - Lead with status, nextActionAt, linkedBusiness
 * @param {string} followUpState - NONE | SCHEDULED | TODAY | OVERDUE
 * @returns {string} HIGH | MEDIUM | LOW
 */
function calculatePriority(lead, followUpState) {
  const daysSinceCreation = Math.floor((Date.now() - lead.createdAt) / (1000 * 60 * 60 * 24));

  // HIGH priority conditions
  if (followUpState === 'OVERDUE') return 'HIGH';
  if (followUpState === 'TODAY') return 'HIGH';
  if (lead.status === 'INTERESTED') return 'HIGH';
  if (lead.status === 'PROPOSAL_SENT') return 'HIGH';

  // MEDIUM priority conditions
  if (lead.status === 'CONTACTED') return 'MEDIUM';
  if (lead.status === 'MEETING_SCHEDULED') return 'MEDIUM';
  if (daysSinceCreation <= 7) return 'MEDIUM';
  if (lead.linkedBusiness && lead.status !== 'CLOSED_WON') return 'MEDIUM';

  // Everything else is LOW
  return 'LOW';
}

/**
 * Calculate follow-up state
 * @param {Date|null} nextActionAt
 * @param {Date} now
 * @returns {string} NONE | SCHEDULED | TODAY | OVERDUE
 */
function getFollowUpState(nextActionAt, now) {
  if (!nextActionAt) return 'NONE';

  const actionDate = new Date(nextActionAt);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (actionDate < today) return 'OVERDUE';
  if (actionDate >= today && actionDate < tomorrow) return 'TODAY';
  return 'SCHEDULED';
}

/**
 * Enrich lead with computed fields
 */
function enrichLead(lead, now, currentUser) {
  const daysSinceCreation = Math.floor((now - lead.createdAt) / (1000 * 60 * 60 * 24));
  const daysSinceLastActivity = (lead.timelineEvents && lead.timelineEvents[0])
    ? Math.floor((now - lead.timelineEvents[0].createdAt) / (1000 * 60 * 60 * 24))
    : daysSinceCreation;

  const isOverdue = lead.nextActionAt && lead.nextActionAt < now;
  const registrationStatus = getRegistrationStatus(lead);
  const followUpState = getFollowUpState(lead.nextActionAt, now);

  // Privacy: mask identifier for non-admin users
  const shouldMask = currentUser.role !== 'ADMIN';
  const displayIdentifier = shouldMask
    ? maskIdentifier(lead.identifierType, lead.identifierValue)
    : lead.identifierValue;

  return {
    ...lead,
    identifierValue: displayIdentifier,
    identifierValueMasked: shouldMask,
    daysSinceCreation,
    daysSinceLastActivity,
    isOverdue,
    registrationStatus,
    followUpState,
    priority: calculatePriority(lead, followUpState)
  };
}

// GET /api/leads/work-queue - Get work queue (grouped by priority)
router.get('/work-queue', auth(), requireRole('ADMIN'), async (req, res, next) => {
  try {
    const now = new Date();

    // Fetch all leads with relations in a single query
    const allLeads = await prisma.lead.findMany({
      where: {
        status: {
          notIn: ['CLOSED_WON', 'CLOSED_LOST', 'INACTIVE']
        }
      },
      include: {
        category: true,
        linkedBusiness: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        timelineEvents: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        notes: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Enrich all leads
    const enrichedLeads = allLeads.map(lead => enrichLead(lead, now, req.user));

    // Group leads by priority
    const overdue = [];
    const today = [];
    const newLeads = [];
    const recent = [];

    for (const lead of enrichedLeads) {
      if (lead.followUpState === 'OVERDUE') {
        overdue.push(lead);
      } else if (lead.followUpState === 'TODAY') {
        today.push(lead);
      } else if (lead.status === 'NEW') {
        newLeads.push(lead);
      } else {
        recent.push(lead);
      }
    }

    // Helper function to get priority order value
    const getPriorityOrder = (priority) => {
      if (priority === 'HIGH') return 3;
      if (priority === 'MEDIUM') return 2;
      return 1; // LOW
    };

    // Sort each group by priority first, then existing criteria
    // Overdue: priority, then oldest overdue first
    overdue.sort((a, b) => {
      const priorityDiff = getPriorityOrder(b.priority) - getPriorityOrder(a.priority);
      if (priorityDiff !== 0) return priorityDiff;
      if (!a.nextActionAt || !b.nextActionAt) return 0;
      return new Date(a.nextActionAt) - new Date(b.nextActionAt);
    });

    // Today: priority, then earliest time first
    today.sort((a, b) => {
      const priorityDiff = getPriorityOrder(b.priority) - getPriorityOrder(a.priority);
      if (priorityDiff !== 0) return priorityDiff;
      if (!a.nextActionAt || !b.nextActionAt) return 0;
      return new Date(a.nextActionAt) - new Date(b.nextActionAt);
    });

    // New: priority, then newest first
    newLeads.sort((a, b) => {
      const priorityDiff = getPriorityOrder(b.priority) - getPriorityOrder(a.priority);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Recent: priority, then updatedAt DESC, limit to 10
    recent.sort((a, b) => {
      const priorityDiff = getPriorityOrder(b.priority) - getPriorityOrder(a.priority);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
    const recentLimited = recent.slice(0, 10);

    res.json({
      overdue,
      today,
      newLeads,
      recent: recentLimited
    });
  } catch (e) {
    console.error('[LeadRoutes] Work queue error:', e);
    next(e);
  }
});

// GET /api/leads - Get all leads (prioritized)
router.get('/', auth(), requireRole('ADMIN'), async (req, res, next) => {
  try {
    const now = new Date();

    // Query parameters for filtering
    const { status, search } = req.query;

    const where = {};

    // Valid lead statuses (mirrors the LeadStatus enum in prisma/schema.prisma)
    const VALID_STATUSES = ['NEW', 'CONTACTED', 'INTERESTED', 'MEETING_SCHEDULED', 'PROPOSAL_SENT', 'CLOSED_WON', 'CLOSED_LOST', 'INACTIVE'];

    // Filter by status:
    //   status=ALL     -> no status restriction (all leads incl. closed/inactive)
    //   status=A,B,C   -> Prisma { in: [...] } (comma-separated list)
    //   status=A       -> exact match (backward-compatible)
    //   omitted        -> default: exclude closed leads (backward-compatible)
    if (status === 'ALL') {
      // no status restriction
    } else if (status) {
      const statuses = String(status).split(',').map(s => s.trim()).filter(Boolean);
      const invalid = statuses.filter(s => !VALID_STATUSES.includes(s));
      if (invalid.length > 0) {
        return res.status(400).json({
          message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')} (or ALL)`
        });
      }
      where.status = statuses.length > 1 ? { in: statuses } : statuses[0];
    } else {
      // By default, exclude closed leads
      where.status = {
        notIn: ['CLOSED_WON', 'CLOSED_LOST']
      };
    }

    // Search by name, phone, business name
    if (search) {
      where.OR = [
        { businessName: { contains: search } },
        { contactPersonName: { contains: search } },
        { phone: { contains: search } }
      ];
    }

    const leads = await prisma.lead.findMany({
      where,
      include: {
        category: true,
        linkedBusiness: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        timelineEvents: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        notes: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Enrich and prioritize
    const enrichedLeads = leads
      .map(lead => enrichLead(lead, now, req.user))
      .sort((a, b) => b.priority - a.priority);

    res.json(enrichedLeads);
  } catch (e) {
    next(e);
  }
});

// GET /api/leads/:id - Get single lead
router.get('/:id', auth(), requireRole('ADMIN'), async (req, res, next) => {
  try {
    const leadId = Number(req.params.id);

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        category: true,
        linkedBusiness: true,
        timelineEvents: {
          orderBy: { createdAt: 'desc' }
        },
        notes: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!lead) {
      return res.status(404).json({ message: 'ליד לא נמצא' });
    }

    const enriched = enrichLead(lead, new Date(), req.user);
    res.json(enriched);
  } catch (e) {
    next(e);
  }
});

// POST /api/leads - Create new lead
router.post('/', auth(), requireRole('ADMIN'), async (req, res, next) => {
  try {
    const {
      identifierType,
      identifierValue,
      businessName,
      contactPersonName,
      phone,
      email,
      categoryId,
      source,
      status,
      initialNote
    } = req.body;

    console.log('[LeadRoutes] POST /leads', {
      identifierType,
      identifierValue,
      businessName,
      phone
    });

    // Validate required fields
    if (!identifierType || !identifierValue || !businessName || !phone) {
      return res.status(400).json({
        message: 'identifierType, identifierValue, businessName and phone are required'
      });
    }

    // Validate identifier
    const validation = validateIdentifier(identifierType, identifierValue);
    if (!validation.valid) {
      return res.status(400).json({
        message: validation.error
      });
    }

    const normalizedIdentifier = validation.normalized;

    // Check for duplicate identifier
    const existingLead = await prisma.lead.findUnique({
      where: {
        identifierType_identifierValue: {
          identifierType,
          identifierValue: normalizedIdentifier
        }
      },
      include: {
        linkedBusiness: true
      }
    });

    if (existingLead) {
      return res.status(409).json({
        error: 'DUPLICATE_IDENTIFIER',
        message: existingLead.linkedBusiness
          ? 'עסק רשום עם מזהה זה כבר קיים במערכת'
          : 'ליד עם מזהה זה כבר קיים במערכת',
        existingLead: {
          id: existingLead.id,
          businessName: existingLead.businessName,
          phone: existingLead.phone,
          status: existingLead.status,
          isRegistered: !!existingLead.linkedBusiness
        }
      });
    }

    // Check if business with this identifier already exists - auto-link if found
    const existingBusiness = await prisma.business.findUnique({
      where: {
        identifierType_identifierValue: {
          identifierType,
          identifierValue: normalizedIdentifier
        }
      }
    });

    // Create lead - link to business if it exists
    const lead = await prisma.lead.create({
      data: {
        identifierType,
        identifierValue: normalizedIdentifier,
        businessName,
        contactPersonName,
        phone,
        email,
        categoryId: categoryId ? Number(categoryId) : null,
        source: source || 'Direct',
        status: status || 'NEW',
        linkedBusinessId: existingBusiness ? existingBusiness.id : null
      },
      include: {
        category: true,
        linkedBusiness: true
      }
    });

    if (existingBusiness) {
      console.log('[LeadRoutes] Auto-linked Lead #', lead.id, 'to existing Business #', existingBusiness.id);
    }

    // Create timeline event: LEAD_CREATED
    await prisma.timelineEvent.create({
      data: {
        leadId: lead.id,
        type: 'LEAD_CREATED',
        description: `מקור: ${lead.source}`
      }
    });

    // Create initial note if provided
    if (initialNote) {
      await prisma.leadNote.create({
        data: {
          leadId: lead.id,
          content: initialNote
        }
      });

      await prisma.timelineEvent.create({
        data: {
          leadId: lead.id,
          type: 'NOTE_ADDED',
          description: initialNote
        }
      });
    }

    console.log('[LeadRoutes] Lead created:', lead.id);

    // Refetch lead with timeline events and notes
    const leadWithTimeline = await prisma.lead.findUnique({
      where: { id: lead.id },
      include: {
        category: true,
        linkedBusiness: true,
        timelineEvents: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        notes: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    // Return enriched lead
    const enriched = enrichLead(leadWithTimeline, new Date(), req.user);
    res.status(201).json(enriched);
  } catch (e) {
    console.error('[LeadRoutes] Create error:', e);
    next(e);
  }
});

// PATCH /api/leads/:id - Update lead
router.patch('/:id', auth(), requireRole('ADMIN'), async (req, res, next) => {
  try {
    const leadId = Number(req.params.id);
    const {
      businessName,
      contactPersonName,
      phone,
      email,
      categoryId,
      source,
      status,
      nextFollowUpDate
    } = req.body;

    console.log('[LeadRoutes] PATCH /leads/:id', { leadId, status });

    const existing = await prisma.lead.findUnique({
      where: { id: leadId }
    });

    if (!existing) {
      return res.status(404).json({ message: 'ליד לא נמצא' });
    }

    const updateData = {};
    if (businessName !== undefined) updateData.businessName = businessName;
    if (contactPersonName !== undefined) updateData.contactPersonName = contactPersonName;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (categoryId !== undefined) updateData.categoryId = categoryId ? Number(categoryId) : null;
    if (source !== undefined) updateData.source = source;
    if (nextFollowUpDate !== undefined) {
      updateData.nextFollowUpDate = nextFollowUpDate ? new Date(nextFollowUpDate) : null;
    }

    // Track status changes
    if (status !== undefined && status !== existing.status) {
      updateData.status = status;

      // Create timeline event for status change
      await prisma.timelineEvent.create({
        data: {
          leadId,
          type: 'STATUS_CHANGED',
          description: `סטטוס שונה מ-${existing.status} ל-${status}`
        }
      });
    }

    const updated = await prisma.lead.update({
      where: { id: leadId },
      data: updateData,
      include: {
        category: true,
        linkedBusiness: true,
        timelineEvents: {
          orderBy: { createdAt: 'desc' }
        },
        notes: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    console.log('[LeadRoutes] Lead updated:', leadId);

    const enriched = enrichLead(updated, new Date(), req.user);
    res.json(enriched);
  } catch (e) {
    console.error('[LeadRoutes] Update error:', e);
    next(e);
  }
});

// DELETE /api/leads/:id - Delete lead
router.delete('/:id', auth(), requireRole('ADMIN'), async (req, res, next) => {
  try {
    const leadId = Number(req.params.id);

    const existing = await prisma.lead.findUnique({
      where: { id: leadId }
    });

    if (!existing) {
      return res.status(404).json({ message: 'ליד לא נמצא' });
    }

    await prisma.lead.delete({
      where: { id: leadId }
    });

    console.log('[LeadRoutes] Lead deleted:', leadId);
    res.json({ message: 'Lead deleted' });
  } catch (e) {
    next(e);
  }
});

// POST /api/leads/:id/notes - Add note to lead
router.post('/:id/notes', auth(), requireRole('ADMIN'), async (req, res, next) => {
  try {
    const leadId = Number(req.params.id);
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'תוכן נדרש' });
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    });

    if (!lead) {
      return res.status(404).json({ message: 'ליד לא נמצא' });
    }

    const note = await prisma.leadNote.create({
      data: {
        leadId,
        content
      }
    });

    // Create timeline event
    await prisma.timelineEvent.create({
      data: {
        leadId,
        type: 'NOTE_ADDED',
        description: content
      }
    });

    // Update lead timestamp
    await prisma.lead.update({
      where: { id: leadId },
      data: { updatedAt: new Date() }
    });

    res.status(201).json(note);
  } catch (e) {
    next(e);
  }
});

// POST /api/leads/:id/timeline - Add timeline event
router.post('/:id/timeline', auth(), requireRole('ADMIN'), async (req, res, next) => {
  try {
    const leadId = Number(req.params.id);
    const { type, description } = req.body;

    if (!type) {
      return res.status(400).json({ message: 'סוג נדרש' });
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    });

    if (!lead) {
      return res.status(404).json({ message: 'ליד לא נמצא' });
    }

    const event = await prisma.timelineEvent.create({
      data: {
        leadId,
        type,
        description
      }
    });

    // Update lead timestamp
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        updatedAt: new Date(),
        lastContactedAt: ['PHONE_CALL_OUTBOUND', 'PHONE_CALL_INBOUND', 'EMAIL_SENT', 'WHATSAPP_SENT'].includes(type)
          ? new Date()
          : lead.lastContactedAt
      }
    });

    res.status(201).json(event);
  } catch (e) {
    next(e);
  }
});

// PATCH /api/leads/:id/follow-up - Set follow-up
router.patch('/:id/follow-up', auth(), requireRole('ADMIN'), async (req, res, next) => {
  try {
    const leadId = Number(req.params.id);
    const { nextAction, nextActionAt } = req.body;

    // Validation
    if (!nextAction) {
      return res.status(400).json({ message: 'פעולה הבאה נדרשת' });
    }

    if (!nextActionAt) {
      return res.status(400).json({ message: 'תאריך פעולה נדרש' });
    }

    const actionDate = new Date(nextActionAt);
    if (isNaN(actionDate.getTime())) {
      return res.status(400).json({ message: 'תאריך לא תקין' });
    }

    // Only allow today and future dates
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    if (actionDate < today) {
      return res.status(400).json({ message: 'לא ניתן לתזמן מעקב לתאריך בעבר' });
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    });

    if (!lead) {
      return res.status(404).json({ message: 'ליד לא נמצא' });
    }

    // Update lead
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        nextAction,
        nextActionAt: actionDate,
        updatedAt: new Date()
      }
    });

    // Create timeline event
    const formattedDate = actionDate.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    await prisma.timelineEvent.create({
      data: {
        leadId,
        type: 'FOLLOW_UP_SCHEDULED',
        description: `Next action: ${nextAction}\nScheduled for ${formattedDate}`
      }
    });

    console.log('[LeadRoutes] Follow-up set:', leadId, nextAction, actionDate);

    // Fetch updated lead with all relations
    const updatedLead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        category: true,
        linkedBusiness: true,
        timelineEvents: {
          orderBy: { createdAt: 'desc' }
        },
        notes: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    const enriched = enrichLead(updatedLead, new Date(), req.user);
    res.json(enriched);
  } catch (e) {
    console.error('[LeadRoutes] Follow-up error:', e);
    next(e);
  }
});

// POST /api/leads/:id/actions - Log quick action
router.post('/:id/actions', auth(), requireRole('ADMIN'), async (req, res, next) => {
  try {
    const leadId = Number(req.params.id);
    const { action } = req.body;

    // Validate action
    const validActions = ['CALL', 'WHATSAPP', 'EMAIL'];

    if (!action) {
      return res.status(400).json({ message: 'פעולה נדרשת' });
    }

    if (!validActions.includes(action)) {
      return res.status(400).json({
        message: `Invalid action. Must be one of: ${validActions.join(', ')}`
      });
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    });

    if (!lead) {
      return res.status(404).json({ message: 'ליד לא נמצא' });
    }

    // Map actions to timeline event types
    const actionMapping = {
      CALL: { type: 'PHONE_CALL_OUTBOUND', description: 'Phone call logged.' },
      WHATSAPP: { type: 'WHATSAPP_SENT', description: 'WhatsApp conversation logged.' },
      EMAIL: { type: 'EMAIL_SENT', description: 'Email sent.' }
    };

    const { type, description } = actionMapping[action];

    // Create timeline event
    await prisma.timelineEvent.create({
      data: {
        leadId,
        type,
        description
      }
    });

    // Update lead's lastContactedAt and updatedAt
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        lastContactedAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('[LeadRoutes] Quick action logged:', leadId, action);

    // Fetch updated lead with all relations
    const updatedLead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        category: true,
        linkedBusiness: true,
        timelineEvents: {
          orderBy: { createdAt: 'desc' }
        },
        notes: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    const enriched = enrichLead(updatedLead, new Date(), req.user);
    res.status(201).json(enriched);
  } catch (e) {
    console.error('[LeadRoutes] Quick action error:', e);
    next(e);
  }
});

// PATCH /api/leads/:id/status - Update lead status
router.patch('/:id/status', auth(), requireRole('ADMIN'), async (req, res, next) => {
  try {
    const leadId = Number(req.params.id);
    const { status } = req.body;

    // Validate status
    const validStatuses = ['NEW', 'CONTACTED', 'INTERESTED', 'MEETING_SCHEDULED', 'PROPOSAL_SENT', 'CLOSED_WON', 'CLOSED_LOST', 'INACTIVE'];

    if (!status) {
      return res.status(400).json({ message: 'סטטוס נדרש' });
    }

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    });

    if (!lead) {
      return res.status(404).json({ message: 'ליד לא נמצא' });
    }

    // Don't create duplicate timeline events if status hasn't changed
    if (lead.status === status) {
      // Just return the existing lead
      const enriched = enrichLead(lead, new Date(), req.user);
      return res.json(enriched);
    }

    const oldStatus = lead.status;

    // Update status
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        status,
        updatedAt: new Date()
      }
    });

    // Create timeline event for status change
    const statusLabels = {
      NEW: 'New',
      CONTACTED: 'Contacted',
      INTERESTED: 'Interested',
      MEETING_SCHEDULED: 'Meeting Scheduled',
      PROPOSAL_SENT: 'Proposal Sent',
      CLOSED_WON: 'Closed Won',
      CLOSED_LOST: 'Closed Lost',
      INACTIVE: 'Inactive'
    };

    await prisma.timelineEvent.create({
      data: {
        leadId,
        type: 'STATUS_CHANGED',
        description: `Status changed from "${statusLabels[oldStatus] || oldStatus}" to "${statusLabels[status] || status}"`
      }
    });

    console.log('[LeadRoutes] Status updated:', leadId, oldStatus, '->', status);

    // Fetch updated lead with all relations
    const updatedLead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        category: true,
        linkedBusiness: true,
        timelineEvents: {
          orderBy: { createdAt: 'desc' }
        },
        notes: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    const enriched = enrichLead(updatedLead, new Date(), req.user);
    res.json(enriched);
  } catch (e) {
    console.error('[LeadRoutes] Status update error:', e);
    next(e);
  }
});

module.exports = router;
