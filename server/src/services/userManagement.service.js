const prisma = require('../lib/prisma');

/**
 * User Management Service
 * Handles all user management operations for admin panel
 */

/**
 * Get users with filters and pagination
 */
async function getUsers(filters = {}) {
  const {
    role,
    status,
    tags,
    search,
    from,
    to,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    order = 'desc'
  } = filters;

  const where = {};

  if (role) where.role = role;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
      { email: { contains: search, mode: 'insensitive' } }
    ];
  }
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }
  if (tags && tags.length > 0) {
    where.tags = {
      some: {
        tagId: { in: tags }
      }
    };
  }

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: order },
      include: {
        businesses: {
          select: { id: true, name: true, status: true }
        },
        bookings: {
          select: { id: true }
        },
        tags: {
          include: {
            tag: true
          }
        }
      }
    }),
    prisma.user.count({ where })
  ]);

  return {
    users,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

/**
 * Get user statistics
 */
async function getUserStats() {
  const [
    totalUsers,
    customers,
    businesses,
    suspended,
    pending
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.user.count({ where: { role: 'BUSINESS' } }),
    prisma.user.count({ where: { status: 'SUSPENDED' } }),
    prisma.user.count({ where: { status: 'PENDING' } })
  ]);

  return {
    total: totalUsers,
    customers,
    businesses,
    suspended,
    pending
  };
}

/**
 * Get single user with full details
 */
async function getUserById(userId) {
  const user = await prisma.user.findUnique({
    where: { id: parseInt(userId) },
    include: {
      businesses: {
        include: {
          category: true,
          services: true,
          slots: true
        }
      },
      bookings: {
        include: {
          business: true,
          service: true,
          slot: true
        },
        orderBy: { createdAt: 'desc' }
      },
      tags: {
        include: {
          tag: true
        }
      },
      notes: {
        include: {
          admin: {
            select: { id: true, fullName: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
      activities: {
        include: {
          admin: {
            select: { id: true, fullName: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      }
    }
  });

  if (!user) {
    throw new Error('משתמש לא נמצא');
  }

  return user;
}

/**
 * Update user details
 */
async function updateUser(userId, data, adminId) {
  const user = await prisma.user.update({
    where: { id: parseInt(userId) },
    data: {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      updatedAt: new Date()
    }
  });

  // Log activity
  await logActivity(userId, adminId, 'USER_UPDATED', 'פרטי משתמש עודכנו על ידי מנהל');

  return user;
}

/**
 * Change user status
 */
async function changeUserStatus(userId, newStatus, adminId, reason) {
  const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
  if (!user) throw new Error('משתמש לא נמצא');

  const oldStatus = user.status;

  const updated = await prisma.user.update({
    where: { id: parseInt(userId) },
    data: { status: newStatus, updatedAt: new Date() }
  });

  // Log activity with status change details
  const statusLabels = {
    ACTIVE: 'פעיל',
    PENDING: 'ממתין לאישור',
    HIDDEN: 'מוסתר',
    SUSPENDED: 'מושעה',
    BLOCKED: 'חסום'
  };

  await logActivity(
    userId,
    adminId,
    'STATUS_CHANGED',
    `סטטוס שונה מ-${statusLabels[oldStatus]} ל-${statusLabels[newStatus]}${reason ? `: ${reason}` : ''}`
  );

  return updated;
}

/**
 * Add note to user
 */
async function addUserNote(userId, adminId, content) {
  const note = await prisma.userNote.create({
    data: {
      userId: parseInt(userId),
      adminId: parseInt(adminId),
      content
    },
    include: {
      admin: {
        select: { id: true, fullName: true }
      }
    }
  });

  await logActivity(userId, adminId, 'NOTE_ADDED', 'נוספה הערת מנהל');

  return note;
}

/**
 * Get user notes
 */
async function getUserNotes(userId) {
  return prisma.userNote.findMany({
    where: { userId: parseInt(userId) },
    include: {
      admin: {
        select: { id: true, fullName: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Add tag to user
 */
async function addTagToUser(userId, tagId, adminId) {
  const existing = await prisma.userToTag.findUnique({
    where: {
      userId_tagId: {
        userId: parseInt(userId),
        tagId: parseInt(tagId)
      }
    }
  });

  if (existing) {
    throw new Error('תגית כבר קיימת למשתמש זה');
  }

  const tag = await prisma.userTag.findUnique({ where: { id: parseInt(tagId) } });

  await prisma.userToTag.create({
    data: {
      userId: parseInt(userId),
      tagId: parseInt(tagId)
    }
  });

  await logActivity(userId, adminId, 'TAG_ADDED', `נוספה תגית: ${tag.name}`);

  return { success: true };
}

/**
 * Remove tag from user
 */
async function removeTagFromUser(userId, tagId, adminId) {
  const tag = await prisma.userTag.findUnique({ where: { id: parseInt(tagId) } });

  await prisma.userToTag.delete({
    where: {
      userId_tagId: {
        userId: parseInt(userId),
        tagId: parseInt(tagId)
      }
    }
  });

  await logActivity(userId, adminId, 'TAG_REMOVED', `הוסרה תגית: ${tag.name}`);

  return { success: true };
}

/**
 * Get user activity log
 */
async function getUserActivity(userId) {
  return prisma.userActivityLog.findMany({
    where: { userId: parseInt(userId) },
    include: {
      admin: {
        select: { id: true, fullName: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 100
  });
}

/**
 * Log user activity
 */
async function logActivity(userId, adminId, action, description, metadata = null) {
  return prisma.userActivityLog.create({
    data: {
      userId: parseInt(userId),
      adminId: adminId ? parseInt(adminId) : null,
      action,
      description,
      metadata: metadata ? JSON.stringify(metadata) : null
    }
  });
}

/**
 * Calculate user readiness score
 */
async function getUserReadiness(userId) {
  const user = await prisma.user.findUnique({
    where: { id: parseInt(userId) },
    include: {
      businesses: {
        include: {
          services: true,
          slots: true
        }
      },
      bookings: true
    }
  });

  const checks = [];
  let completedCount = 0;

  if (user.role === 'CUSTOMER') {
    // Customer readiness checks
    checks.push({
      key: 'email',
      label: 'אימייל',
      completed: !!user.email,
      required: false
    });
    checks.push({
      key: 'phone',
      label: 'טלפון',
      completed: !!user.phone,
      required: true
    });
    checks.push({
      key: 'profile',
      label: 'פרופיל מלא',
      completed: !!(user.fullName && user.phone),
      required: true
    });

    completedCount = checks.filter(c => c.completed).length;
  } else if (user.role === 'BUSINESS') {
    // Business readiness checks
    checks.push({
      key: 'business',
      label: 'עסק נוצר',
      completed: user.businesses.length > 0,
      required: true
    });
    checks.push({
      key: 'service',
      label: 'שירות אחד לפחות',
      completed: user.businesses.some(b => b.services.length > 0),
      required: true
    });
    checks.push({
      key: 'slot',
      label: 'תור אחד לפחות',
      completed: user.businesses.some(b => b.slots.length > 0),
      required: true
    });
    checks.push({
      key: 'address',
      label: 'כתובת מדויקת',
      completed: user.businesses.some(b => b.latitude && b.longitude),
      required: true
    });
    checks.push({
      key: 'phone',
      label: 'טלפון מאומת',
      completed: !!user.phone,
      required: true
    });

    completedCount = checks.filter(c => c.completed).length;
  }

  const totalChecks = checks.length;
  const percentage = totalChecks > 0 ? Math.round((completedCount / totalChecks) * 100) : 0;

  let level = 'red';
  let label = 'לא ניתן לפרסום';
  if (percentage >= 90) {
    level = 'green';
    label = 'מוכן לפרסום';
  } else if (percentage >= 60) {
    level = 'yellow';
    label = 'חסר מידע';
  } else if (percentage >= 30) {
    level = 'orange';
    label = 'דורש השלמה';
  }

  return {
    level,
    label,
    percentage,
    completedCount,
    totalChecks,
    checks
  };
}

module.exports = {
  getUsers,
  getUserStats,
  getUserById,
  updateUser,
  changeUserStatus,
  addUserNote,
  getUserNotes,
  addTagToUser,
  removeTagFromUser,
  getUserActivity,
  logActivity,
  getUserReadiness
};
