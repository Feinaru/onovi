/**
 * Shared Calendar Status Colors
 * Maps booking statuses to visual styling
 */

export const STATUS_META = {
  PENDING: {
    label: 'ממתין לאישור',
    colorVariant: 'warning',
    dotColor: '#f59e0b',
    bgColor: '#fef3c7',
    textColor: '#92400e',
    borderColor: '#f59e0b'
  },
  CONFIRMED: {
    label: 'מאושר',
    colorVariant: 'success',
    dotColor: '#10b981',
    bgColor: '#d1fae5',
    textColor: '#065f46',
    borderColor: '#10b981'
  },
  APPROVED: {
    label: 'מאושר',
    colorVariant: 'success',
    dotColor: '#10b981',
    bgColor: '#d1fae5',
    textColor: '#065f46',
    borderColor: '#10b981'
  },
  COMPLETED: {
    label: 'הושלם',
    colorVariant: 'info',
    dotColor: '#3b82f6',
    bgColor: '#dbeafe',
    textColor: '#1e40af',
    borderColor: '#3b82f6'
  },
  CANCELLED: {
    label: 'בוטל',
    colorVariant: 'muted',
    dotColor: '#6b7280',
    bgColor: '#f3f4f6',
    textColor: '#4b5563',
    borderColor: '#9ca3af'
  },
  CANCELLED_BY_CUSTOMER: {
    label: 'בוטל על ידך',
    colorVariant: 'muted',
    dotColor: '#6b7280',
    bgColor: '#f3f4f6',
    textColor: '#4b5563',
    borderColor: '#9ca3af'
  },
  CANCELLED_BY_BUSINESS: {
    label: 'בוטל על ידי העסק',
    colorVariant: 'muted',
    dotColor: '#6b7280',
    bgColor: '#f3f4f6',
    textColor: '#4b5563',
    borderColor: '#9ca3af'
  },
  REJECTED: {
    label: 'נדחה',
    colorVariant: 'danger',
    dotColor: '#ef4444',
    bgColor: '#fee2e2',
    textColor: '#991b1b',
    borderColor: '#ef4444'
  },
  NO_SHOW: {
    label: 'לא הגעת',
    colorVariant: 'danger',
    dotColor: '#ef4444',
    bgColor: '#fee2e2',
    textColor: '#991b1b',
    borderColor: '#ef4444'
  }
};

/**
 * Get calendar status metadata
 * Returns styling and label for a booking status
 */
export function getCalendarStatusMeta(status) {
  return STATUS_META[status] || {
    label: status,
    colorVariant: 'neutral',
    dotColor: '#9ca3af',
    bgColor: '#f9fafb',
    textColor: '#6b7280',
    borderColor: '#d1d5db'
  };
}
