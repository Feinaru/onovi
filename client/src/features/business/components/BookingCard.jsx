import React from 'react';
import BookingStatusBadge from '../../../shared/ui/BookingStatusBadge';

/**
 * BookingCard - Displays booking information
 * Can render as table row (asTableRow=true) or as card (default)
 * Supports both onStatusChange (legacy) and onUpdateStatus (new)
 */
function BookingCard({ booking, onStatusChange, onUpdateStatus, onCancel, showMessage, onViewDetails, asTableRow = false }) {
  const handleStatusChange = onUpdateStatus || onStatusChange;

  if (asTableRow) {
    return (
      <tr>
        <td>
          <div style={{ fontWeight: 'var(--font-semibold)' }}>{booking.customerName}</div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            📞 {booking.customerPhone}
          </div>
        </td>
        <td>{booking.businessService?.serviceTemplate?.name || booking.service?.name}</td>
        <td>
          <div>{booking.slot?.date}</div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            {booking.startTime}
          </div>
        </td>
        <td style={{ fontWeight: 'var(--font-semibold)' }}>₪{booking.businessService?.regularPrice || booking.price}</td>
        <td>
          <BookingStatusBadge status={booking.status} context="provider" />
        </td>
        <td>
          <select
            value={booking.status}
            onChange={e => handleStatusChange && handleStatusChange(booking.id, e.target.value)}
            style={{
              fontSize: 'var(--text-sm)',
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <option value="PENDING">⏳ ממתין לאישור</option>
            <option value="CONFIRMED">✓ מאושר</option>
            <option value="REJECTED">✗ נדחה</option>
            <option value="COMPLETED">✅ הושלם</option>
            <option value="NO_SHOW">❌ לא הגיע</option>
            <option value="CANCELLED_BY_BUSINESS">✗ בוטל על ידי העסק</option>
          </select>
        </td>
      </tr>
    );
  }

  // Card view for BookingsPage
  return (
    <div className="card" style={{ padding: 'var(--space-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
        <div>
          <div style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-lg)' }}>
            {booking.customerName}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
            📞 {booking.customerPhone}
          </div>
        </div>
        <BookingStatusBadge status={booking.status} context="provider" />
      </div>

      <div style={{ display: 'grid', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <span style={{ color: 'var(--text-secondary)' }}>שירות:</span>
          <span>{booking.businessService?.serviceTemplate?.name || 'לא ידוע'}</span>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <span style={{ color: 'var(--text-secondary)' }}>תאריך:</span>
          <span>{booking.slot?.date || 'לא ידוע'}</span>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <span style={{ color: 'var(--text-secondary)' }}>שעה:</span>
          <span>{booking.startTime} - {booking.endTime}</span>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <span style={{ color: 'var(--text-secondary)' }}>מחיר:</span>
          <span style={{ fontWeight: 'var(--font-semibold)' }}>₪{booking.businessService?.regularPrice || 0}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'stretch', marginBottom: onViewDetails ? 'var(--space-2)' : 0 }}>
        <label style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', alignSelf: 'center' }}>עדכן סטטוס:</label>
        <select
          value={booking.status}
          onChange={e => handleStatusChange && handleStatusChange(booking.id, e.target.value)}
          className="form-input"
          style={{ flex: 1 }}
        >
          <option value="PENDING">⏳ ממתין לאישור</option>
          <option value="CONFIRMED">✓ מאושר</option>
          <option value="REJECTED">✗ נדחה</option>
          <option value="COMPLETED">✅ הושלם</option>
          <option value="NO_SHOW">❌ לא הגיע</option>
          <option value="CANCELLED_BY_BUSINESS">✗ בוטל על ידי העסק</option>
        </select>
      </div>

      {/* View details button */}
      {onViewDetails && (
        <button
          onClick={() => onViewDetails(booking.id)}
          className="btn-secondary"
          style={{ width: '100%' }}
        >
          פרטים
        </button>
      )}
    </div>
  );
}

export default BookingCard;
