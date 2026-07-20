import React from 'react';

/**
 * Status pill for catalog items. Reuses the existing `badge` classes so the
 * catalog matches the rest of the admin panel (no new badge system).
 */
export function StatusPill({ status }) {
  if (status === 'ARCHIVED') {
    return <span className="badge badge-gray">בארכיון</span>;
  }
  return <span className="badge badge-success">פעיל</span>;
}

/** Format an optional price (whole shekels) or a dash. */
export function formatPrice(price) {
  if (price === null || price === undefined || price === '') return '—';
  return `₪${price}`;
}

/** Format duration in minutes or a dash. */
export function formatDuration(minutes) {
  if (!minutes) return '—';
  return `${minutes} דקות`;
}
