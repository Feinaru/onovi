/**
 * Shared Booking Status Colors and Labels
 * Canonical source for all booking status display across the app
 *
 * Context-specific labels:
 * - Customer context: 2nd person ("לא הגעת", "בוטל על ידך")
 * - Provider/Admin context: 3rd person ("לא הגיע", "בוטל על ידי הלקוח")
 */

export const STATUS_META = {
  PENDING: {
    label: 'ממתין לאישור',
    icon: '⏳',
    colorVariant: 'warning',
    dotColor: '#f59e0b',
    bgColor: '#fef3c7',
    textColor: '#92400e',
    borderColor: '#f59e0b',
    badgeClass: 'badge-warning'
  },
  CONFIRMED: {
    label: 'מאושר',
    icon: '✓',
    colorVariant: 'success',
    dotColor: '#10b981',
    bgColor: '#d1fae5',
    textColor: '#065f46',
    borderColor: '#10b981',
    badgeClass: 'badge-success'
  },
  APPROVED: {
    label: 'מאושר',
    icon: '✓',
    colorVariant: 'success',
    dotColor: '#10b981',
    bgColor: '#d1fae5',
    textColor: '#065f46',
    borderColor: '#10b981',
    badgeClass: 'badge-success'
  },
  COMPLETED: {
    label: 'הושלם',
    icon: '✅',
    colorVariant: 'info',
    dotColor: '#3b82f6',
    bgColor: '#dbeafe',
    textColor: '#1e40af',
    borderColor: '#3b82f6',
    badgeClass: 'badge-primary'
  },
  CANCELLED: {
    label: 'בוטל',
    icon: '✗',
    colorVariant: 'muted',
    dotColor: '#6b7280',
    bgColor: '#f3f4f6',
    textColor: '#4b5563',
    borderColor: '#9ca3af',
    badgeClass: 'badge-danger'
  },
  CANCELLED_BY_CUSTOMER: {
    label: 'בוטל על ידי הלקוח', // Default/provider/admin label
    labelCustomer: 'בוטל על ידך', // Customer-specific label
    icon: '✗',
    colorVariant: 'muted',
    dotColor: '#6b7280',
    bgColor: '#f3f4f6',
    textColor: '#4b5563',
    borderColor: '#9ca3af',
    badgeClass: 'badge-danger'
  },
  CANCELLED_BY_BUSINESS: {
    label: 'בוטל על ידי העסק',
    icon: '✗',
    colorVariant: 'muted',
    dotColor: '#6b7280',
    bgColor: '#f3f4f6',
    textColor: '#4b5563',
    borderColor: '#9ca3af',
    badgeClass: 'badge-danger'
  },
  REJECTED: {
    label: 'נדחה',
    icon: '✗',
    colorVariant: 'danger',
    dotColor: '#ef4444',
    bgColor: '#fee2e2',
    textColor: '#991b1b',
    borderColor: '#ef4444',
    badgeClass: 'badge-danger'
  },
  NO_SHOW: {
    label: 'לא הגיע', // Default/provider/admin label
    labelCustomer: 'לא הגעת', // Customer-specific label
    icon: '❌',
    colorVariant: 'danger',
    dotColor: '#ef4444',
    bgColor: '#fee2e2',
    textColor: '#991b1b',
    borderColor: '#ef4444',
    badgeClass: 'badge-danger'
  }
};

/**
 * Get calendar status metadata
 * Returns styling and label for a booking status
 *
 * @param {string} status - Booking status enum value
 * @param {string} context - Optional context: 'customer', 'provider', 'admin'
 * @returns {object} Status metadata with label, colors, and styling
 */
export function getCalendarStatusMeta(status, context = null) {
  const meta = STATUS_META[status] || {
    label: status,
    icon: '',
    colorVariant: 'neutral',
    dotColor: '#9ca3af',
    bgColor: '#f9fafb',
    textColor: '#6b7280',
    borderColor: '#d1d5db',
    badgeClass: 'badge-secondary'
  };

  // Apply context-specific label overrides
  if (context === 'customer') {
    if (status === 'CANCELLED_BY_CUSTOMER' && meta.labelCustomer) {
      return { ...meta, label: meta.labelCustomer };
    }
    if (status === 'NO_SHOW' && meta.labelCustomer) {
      return { ...meta, label: meta.labelCustomer };
    }
  }

  return meta;
}
