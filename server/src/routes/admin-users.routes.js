const express = require('express');
const { auth, requireRole } = require('../middleware/auth');
const userService = require('../services/userManagement.service');
const prisma = require('../lib/prisma');

const router = express.Router();

// All routes require admin authentication
router.use(auth());
router.use(requireRole('ADMIN'));

/**
 * GET /api/admin/users/stats
 * Get user statistics
 */
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await userService.getUserStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/users
 * List users with filters and pagination
 */
router.get('/', async (req, res, next) => {
  try {
    const filters = {
      role: req.query.role,
      status: req.query.status,
      tags: req.query.tags ? req.query.tags.split(',').map(Number) : undefined,
      search: req.query.search,
      from: req.query.from,
      to: req.query.to,
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 20,
      sortBy: req.query.sortBy || 'createdAt',
      order: req.query.order || 'desc'
    };

    const result = await userService.getUsers(filters);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/users/:id
 * Get single user with full details
 */
router.get('/:id', async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/admin/users/:id
 * Update user details
 */
router.patch('/:id', async (req, res, next) => {
  try {
    const user = await userService.updateUser(
      req.params.id,
      req.body,
      req.user.id
    );
    res.json(user);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/admin/users/:id/status
 * Change user status
 */
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status, reason } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'סטטוס חובה' });
    }

    const validStatuses = ['ACTIVE', 'PENDING', 'HIDDEN', 'SUSPENDED', 'BLOCKED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'סטטוס לא חוקי' });
    }

    const user = await userService.changeUserStatus(
      req.params.id,
      status,
      req.user.id,
      reason
    );
    res.json(user);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/users/:id/notes
 * Add admin note to user
 */
router.post('/:id/notes', async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'תוכן הערה חובה' });
    }

    const note = await userService.addUserNote(
      req.params.id,
      req.user.id,
      content.trim()
    );
    res.json(note);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/users/:id/notes
 * Get user notes
 */
router.get('/:id/notes', async (req, res, next) => {
  try {
    const notes = await userService.getUserNotes(req.params.id);
    res.json(notes);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/users/:id/activity
 * Get user activity log
 */
router.get('/:id/activity', async (req, res, next) => {
  try {
    const activities = await userService.getUserActivity(req.params.id);
    res.json(activities);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/users/:id/tags
 * Add tag to user
 */
router.post('/:id/tags', async (req, res, next) => {
  try {
    const { tagId } = req.body;

    if (!tagId) {
      return res.status(400).json({ error: 'מזהה תגית חובה' });
    }

    const result = await userService.addTagToUser(
      req.params.id,
      tagId,
      req.user.id
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/admin/users/:id/tags/:tagId
 * Remove tag from user
 */
router.delete('/:id/tags/:tagId', async (req, res, next) => {
  try {
    const result = await userService.removeTagFromUser(
      req.params.id,
      req.params.tagId,
      req.user.id
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/users/:id/readiness
 * Get user readiness check
 */
router.get('/:id/readiness', async (req, res, next) => {
  try {
    const readiness = await userService.getUserReadiness(req.params.id);
    res.json(readiness);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/users/:id/reset-password
 * Trigger password reset for user
 */
router.post('/:id/reset-password', async (req, res, next) => {
  try {
    // TODO: Implement password reset logic
    // For now, just log the activity
    await userService.logActivity(
      req.params.id,
      req.user.id,
      'PASSWORD_RESET',
      'מנהל ביקש איפוס סיסמה'
    );

    res.json({
      success: true,
      message: 'בקשת איפוס סיסמה נשלחה (TODO: implement actual reset)'
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/tags
 * List all tags
 */
router.get('/tags/list', async (req, res, next) => {
  try {
    const tags = await prisma.userTag.findMany({
      orderBy: [
        { isSystem: 'desc' },
        { name: 'asc' }
      ]
    });
    res.json(tags);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/tags
 * Create new tag
 */
router.post('/tags/create', async (req, res, next) => {
  try {
    const { name, color, description } = req.body;

    if (!name || !color) {
      return res.status(400).json({ error: 'שם וצבע חובה' });
    }

    const tag = await prisma.userTag.create({
      data: {
        name: name.trim(),
        color,
        description: description?.trim(),
        isSystem: false
      }
    });

    res.json(tag);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/admin/tags/:id
 * Update tag
 */
router.patch('/tags/:id', async (req, res, next) => {
  try {
    const { name, color, description } = req.body;

    const tag = await prisma.userTag.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name: name?.trim(),
        color,
        description: description?.trim()
      }
    });

    res.json(tag);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/admin/tags/:id
 * Delete tag
 */
router.delete('/tags/:id', async (req, res, next) => {
  try {
    const tag = await prisma.userTag.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (tag?.isSystem) {
      return res.status(400).json({ error: 'לא ניתן למחוק תגית מערכת' });
    }

    await prisma.userTag.delete({
      where: { id: parseInt(req.params.id) }
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
