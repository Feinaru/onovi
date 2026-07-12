import React from 'react';
import BookingStatusBadge from '../../../shared/ui/BookingStatusBadge';

/**
 * MyBookingCard - Displays a single booking for customer view
 */
export default function MyBookingCard({ booking, canCancel, onCancel, setView }) {

  /**
   * Get service name with null-safety
   */
  const getServiceName = () => {
    if (booking.businessService?.serviceTemplate?.name) {
      return booking.businessService.serviceTemplate.name;
    }
    if (booking.service?.name) {
      return booking.service.name;
    }
    return 'שירות לא זמין';
  };

  /**
   * Get business name with null-safety
   */
  const getBusinessName = () => {
    return booking.business?.name || 'עסק לא זמין';
  };

  /**
   * Get business city with null-safety
   */
  const getBusinessCity = () => {
    return booking.business?.city || '';
  };

  /**
   * Format date from YYYY-MM-DD to Hebrew readable format
   */
  const formatDate = (dateStr) => {
    if (!dateStr) return 'תאריך לא זמין';

    try {
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString('he-IL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-3)' }}>
      {/* Header with service name and status */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 'var(--space-3)',
        gap: 'var(--space-2)'
      }}>
        <div>
          <h3 style={{
            fontSize: 'var(--text-lg)',
            fontWeight: 'var(--font-semibold)',
            marginBottom: 'var(--space-1)'
          }}>
            {getServiceName()}
          </h3>
          <div style={{
            color: 'var(--text-secondary)',
            fontSize: 'var(--text-sm)'
          }}>
            📍 {getBusinessName()}
            {getBusinessCity() && `, ${getBusinessCity()}`}
          </div>
        </div>
        <BookingStatusBadge status={booking.status} context="customer" />
      </div>

      {/* Booking details */}
      <div style={{
        display: 'grid',
        gap: 'var(--space-2)',
        marginBottom: 'var(--space-3)'
      }}>
        {/* Date */}
        {booking.slot?.date && (
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>📅 תאריך:</span>
            <span style={{ fontWeight: 'var(--font-medium)' }}>
              {formatDate(booking.slot.date)}
            </span>
          </div>
        )}

        {/* Time */}
        {booking.startTime && booking.endTime && (
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>⏰ שעה:</span>
            <span style={{ fontWeight: 'var(--font-medium)' }}>
              {booking.startTime} - {booking.endTime}
            </span>
          </div>
        )}

        {/* Price */}
        {booking.price && (
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>💰 מחיר:</span>
            <span style={{ fontWeight: 'var(--font-semibold)' }}>
              ₪{booking.price}
            </span>
          </div>
        )}

        {/* Customer note */}
        {booking.customerNote && (
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>📝 הערה:</span>
            <span>{booking.customerNote}</span>
          </div>
        )}

        {/* Booking ID */}
        {(booking.publicId || booking.id) && (
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
              מספר הזמנה:
            </span>
            <span style={{ fontSize: 'var(--text-sm)', fontFamily: 'monospace' }}>
              {booking.publicId?.substring(0, 8) || booking.id}
            </span>
          </div>
        )}
      </div>

      {/* Business contact (if available) */}
      {booking.business?.phone && (
        <div style={{
          paddingTop: 'var(--space-3)',
          borderTop: '1px solid var(--border-color)',
          marginBottom: canCancel ? 'var(--space-3)' : '0'
        }}>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            📞 טלפון העסק: <a href={`tel:${booking.business.phone}`}>{booking.business.phone}</a>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {(canCancel || setView) && (
        <div style={{
          paddingTop: booking.business?.phone ? '0' : 'var(--space-3)',
          borderTop: booking.business?.phone ? 'none' : '1px solid var(--border-color)',
          display: 'flex',
          gap: 'var(--space-2)'
        }}>
          {/* Details button */}
          {setView && (
            <button
              onClick={() => setView({ view: 'booking-details', bookingId: booking.id })}
              className="btn-secondary"
              style={{ flex: 1 }}
            >
              פרטים
            </button>
          )}

          {/* Cancel button for active bookings */}
          {canCancel && onCancel && (
            <button
              onClick={() => onCancel(booking)}
              className="btn-secondary"
              style={{
                flex: 1,
                color: 'var(--danger-color)',
                borderColor: 'var(--danger-color)'
              }}
            >
              ביטול התור
            </button>
          )}
        </div>
      )}
    </div>
  );
}
