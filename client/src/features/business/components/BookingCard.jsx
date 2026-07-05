import React from 'react';

/**
 * BookingCard - Displays booking information
 * Can render as table row (asTableRow=true) or as card (default)
 * Supports both onStatusChange (legacy) and onUpdateStatus (new)
 */
function BookingCard({ booking, onStatusChange, onUpdateStatus, onCancel, showMessage, asTableRow = false }) {
  const handleStatusChange = onUpdateStatus || onStatusChange;

  const statusLabels = {
    'PENDING': '⏳ ממתין',
    'CONFIRMED': '✓ מאושר',
    'APPROVED': '✓ מאושר',
    'REJECTED': '✗ נדחה',
    'COMPLETED': '✅ הושלם',
    'CANCELLED_BY_CUSTOMER': '✗ בוטל ע"י לקוח',
    'CANCELLED_BY_BUSINESS': '✗ בוטל ע"י עסק',
    'NO_SHOW': '❌ לא הגיע'
  };

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
          <span className={`badge ${
            booking.status === 'CONFIRMED' || booking.status === 'APPROVED' ? 'badge-success' :
            booking.status === 'PENDING' ? 'badge-warning' :
            booking.status === 'COMPLETED' ? 'badge-primary' :
            'badge-danger'
          }`}>
            {statusLabels[booking.status] || booking.status}
          </span>
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
            <option value="PENDING">⏳ ממתין</option>
            <option value="CONFIRMED">✓ מאושר</option>
            <option value="REJECTED">✗ נדחה</option>
            <option value="COMPLETED">✅ הושלם</option>
            <option value="CANCELLED_BY_BUSINESS">✗ בוטל</option>
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
        <span className={`badge ${
          booking.status === 'CONFIRMED' || booking.status === 'APPROVED' ? 'badge-success' :
          booking.status === 'PENDING' ? 'badge-warning' :
          booking.status === 'COMPLETED' ? 'badge-primary' :
          'badge-danger'
        }`}>
          {statusLabels[booking.status] || booking.status}
        </span>
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

      <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
        <label style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>עדכן סטטוס:</label>
        <select
          value={booking.status}
          onChange={e => handleStatusChange && handleStatusChange(booking.id, e.target.value)}
          className="form-input"
          style={{ flex: 1 }}
        >
          <option value="PENDING">⏳ ממתין</option>
          <option value="CONFIRMED">✓ מאושר</option>
          <option value="REJECTED">✗ נדחה</option>
          <option value="COMPLETED">✅ הושלם</option>
          <option value="NO_SHOW">❌ לא הגיע</option>
          <option value="CANCELLED_BY_BUSINESS">✗ בוטל ע"י עסק</option>
        </select>
      </div>
    </div>
  );
}

export default BookingCard;
