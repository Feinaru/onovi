import { useState, useEffect } from 'react';
import { api } from '../../../api';

/**
 * CustomerBookingDetailsPage - Individual booking details for customers
 */
export default function CustomerBookingDetailsPage({ bookingId, setView }) {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  async function loadBooking() {
    try {
      setLoading(true);
      setError(null);
      const data = await api(`/bookings/${bookingId}`);
      setBooking(data);
    } catch (err) {
      console.error('Failed to load booking:', err);
      setError(err.message || 'שגיאה בטעינת פרטי הזמנה');
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(status) {
    const statusConfig = {
      PENDING: { bg: '#fef3c7', color: '#92400e', label: 'ממתין לאישור' },
      CONFIRMED: { bg: '#d1fae5', color: '#065f46', label: 'מאושר' },
      COMPLETED: { bg: '#dbeafe', color: '#1e40af', label: 'הושלם' },
      CANCELLED_BY_CUSTOMER: { bg: '#f3f4f6', color: '#374151', label: 'בוטל על ידי' },
      CANCELLED_BY_BUSINESS: { bg: '#f3f4f6', color: '#374151', label: 'בוטל על ידי העסק' },
      NO_SHOW: { bg: '#fee2e2', color: '#991b1b', label: 'לא הגיע' },
      REJECTED: { bg: '#fee2e2', color: '#991b1b', label: 'נדחה' }
    };

    const config = statusConfig[status] || { bg: '#f3f4f6', color: '#374151', label: status };

    return (
      <span style={{
        display: 'inline-block',
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: '600',
        backgroundColor: config.bg,
        color: config.color
      }}>
        {config.label}
      </span>
    );
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'לא זמין';
    return dateStr;
  }

  function formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return 'לא זמין';
    const date = new Date(dateTimeStr);
    return `${date.toLocaleDateString('he-IL')} ${date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`;
  }

  if (loading) {
    return (
      <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <div>טוען פרטי הזמנה...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
        <button
          onClick={() => setView('my-bookings')}
          style={{
            padding: '8px 16px',
            marginBottom: '24px',
            backgroundColor: 'transparent',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          ← חזרה לתורים שלי
        </button>
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>שגיאה</h3>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>{error}</p>
          <button onClick={loadBooking} className="btn-primary">
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
        <button
          onClick={() => setView('my-bookings')}
          style={{
            padding: '8px 16px',
            marginBottom: '24px',
            backgroundColor: 'transparent',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          ← חזרה לתורים שלי
        </button>
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
          <h3 style={{ fontSize: '20px' }}>הזמנה לא נמצאה</h3>
        </div>
      </div>
    );
  }

  const serviceName = booking.businessService?.name ||
                      booking.businessService?.serviceTemplate?.name ||
                      'שירות לא זמין';
  const duration = booking.businessService?.durationMinutes ||
                   booking.businessService?.serviceTemplate?.defaultDurationMinutes ||
                   null;

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Back button */}
      <button
        onClick={() => setView('my-bookings')}
        style={{
          padding: '8px 16px',
          marginBottom: '24px',
          backgroundColor: 'transparent',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        ← חזרה לתורים שלי
      </button>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
          פרטי הזמנה
        </h1>
        <p style={{ color: '#6b7280' }}>הזמנה מספר #{booking.id}</p>
      </div>

      {/* Status badge */}
      <div style={{ marginBottom: '24px' }}>
        {getStatusBadge(booking.status)}
      </div>

      {/* Details card */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
          פרטי התור
        </h2>

        <div style={{ display: 'grid', gap: '16px' }}>
          {/* Business */}
          <div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>עסק</div>
            <div style={{ fontSize: '16px', fontWeight: '500' }}>
              {booking.business?.name || 'עסק לא זמין'}
            </div>
            {booking.business?.cityNameHebrew && (
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                📍 {booking.business.cityNameHebrew}
              </div>
            )}
          </div>

          {/* Service */}
          <div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>שירות</div>
            <div style={{ fontSize: '16px', fontWeight: '500' }}>{serviceName}</div>
            {duration && (
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                ⏱️ {duration} דקות
              </div>
            )}
          </div>

          {/* Date and Time */}
          <div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>תאריך ושעה</div>
            <div style={{ fontSize: '16px', fontWeight: '500' }}>
              📅 {formatDate(booking.slot?.date)}
            </div>
            <div style={{ fontSize: '16px', fontWeight: '500' }}>
              🕐 {booking.startTime} - {booking.endTime}
            </div>
          </div>

          {/* Price */}
          <div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>מחיר</div>
            <div style={{ fontSize: '20px', fontWeight: '600', color: '#10b981' }}>
              ₪{booking.price}
            </div>
          </div>

          {/* Customer Note */}
          {booking.customerNote && (
            <div>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>הערה</div>
              <div style={{
                fontSize: '14px',
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                border: '1px solid #e5e7eb'
              }}>
                {booking.customerNote}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Timestamps card */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '24px'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
          היסטוריה
        </h2>

        <div style={{ display: 'grid', gap: '12px', fontSize: '14px' }}>
          <div>
            <span style={{ color: '#6b7280' }}>נוצר ב: </span>
            <span style={{ fontWeight: '500' }}>{formatDateTime(booking.createdAt)}</span>
          </div>

          {booking.confirmedAt && (
            <div>
              <span style={{ color: '#6b7280' }}>אושר ב: </span>
              <span style={{ fontWeight: '500' }}>{formatDateTime(booking.confirmedAt)}</span>
            </div>
          )}

          {booking.cancelledAt && (
            <div>
              <span style={{ color: '#6b7280' }}>בוטל ב: </span>
              <span style={{ fontWeight: '500' }}>{formatDateTime(booking.cancelledAt)}</span>
            </div>
          )}

          <div>
            <span style={{ color: '#6b7280' }}>עודכן ב: </span>
            <span style={{ fontWeight: '500' }}>{formatDateTime(booking.updatedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
