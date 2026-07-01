import React from 'react';
import './StatusBadge.css';

/**
 * StatusBadge - Visual status indicator with color coding
 * Maps technical status values to Hebrew display text
 */

const STATUS_CONFIG = {
  ACTIVE: { label: 'פעיל', color: 'green' },
  PENDING: { label: 'ממתין לאישור', color: 'yellow' },
  HIDDEN: { label: 'מוסתר', color: 'gray' },
  SUSPENDED: { label: 'מושעה', color: 'orange' },
  BLOCKED: { label: 'חסום', color: 'red' }
};

function StatusBadge({ status, size = 'medium' }) {
  const config = STATUS_CONFIG[status] || { label: status, color: 'gray' };

  return (
    <span className={`status-badge status-badge--${config.color} status-badge--${size}`}>
      {config.label}
    </span>
  );
}

export default StatusBadge;
