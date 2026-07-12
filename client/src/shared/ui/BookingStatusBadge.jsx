import React from 'react';
import { getCalendarStatusMeta } from '../calendar/utils/statusColors';

/**
 * BookingStatusBadge - Unified status badge for booking displays
 *
 * Props:
 * - status: Booking status enum (PENDING, CONFIRMED, etc.)
 * - context: Optional role context ('customer', 'provider', 'admin')
 * - showIcon: Whether to show status icon (default: true)
 * - size: Badge size ('sm' or 'md', default: 'md')
 * - className: Additional CSS classes
 *
 * This component uses the canonical status metadata from statusColors.js
 * and automatically applies context-specific labels (e.g., "לא הגעת" for
 * customer vs "לא הגיע" for provider/admin).
 */
export default function BookingStatusBadge({
  status,
  context = null,
  showIcon = true,
  size = 'md',
  className = ''
}) {
  // Get canonical status metadata with context-aware label
  const meta = getCalendarStatusMeta(status, context);

  // Build display label with optional icon
  const displayLabel = showIcon && meta.icon
    ? `${meta.icon} ${meta.label}`
    : meta.label;

  // Build CSS classes
  const badgeClasses = [
    'badge',
    meta.badgeClass || 'badge-secondary',
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={badgeClasses}>
      {displayLabel}
    </span>
  );
}
