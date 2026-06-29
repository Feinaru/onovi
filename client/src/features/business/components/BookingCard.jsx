import React from 'react';

/**
 * BookingCard - Displays booking information in a table row
 */
function BookingCard({ booking, onStatusChange }) {
  return (
    <tr>
      <td>
        <div style={{ fontWeight: 'var(--font-semibold)' }}>{booking.customerName}</div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          📞 {booking.customerPhone}
        </div>
      </td>
      <td>{booking.service?.name}</td>
      <td>
        <div>{booking.slot?.date}</div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          {booking.slot?.startTime}
        </div>
      </td>
      <td style={{ fontWeight: 'var(--font-semibold)' }}>₪{booking.price}</td>
      <td>
        <span className={`badge ${
          booking.status === 'APPROVED' ? 'badge-success' :
          booking.status === 'PENDING' ? 'badge-warning' :
          booking.status === 'COMPLETED' ? 'badge-primary' :
          booking.status === 'REJECTED' || booking.status === 'CANCELLED' ? 'badge-danger' :
          'badge-gray'
        }`}>
          {booking.status === 'APPROVED' ? '✓ מאושר' :
           booking.status === 'PENDING' ? '⏳ ממתין' :
           booking.status === 'COMPLETED' ? '✅ הושלם' :
           booking.status === 'REJECTED' ? '✗ נדחה' :
           booking.status === 'CANCELLED' ? '✗ בוטל' :
           booking.status}
        </span>
      </td>
      <td>
        <select
          value={booking.status}
          onChange={e => onStatusChange(booking.id, e.target.value)}
          style={{
            fontSize: 'var(--text-sm)',
            padding: 'var(--space-2) var(--space-3)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <option value="PENDING">⏳ ממתין</option>
          <option value="APPROVED">✓ מאושר</option>
          <option value="REJECTED">✗ נדחה</option>
          <option value="COMPLETED">✅ הושלם</option>
          <option value="CANCELLED">✗ בוטל</option>
        </select>
      </td>
    </tr>
  );
}

export default BookingCard;
