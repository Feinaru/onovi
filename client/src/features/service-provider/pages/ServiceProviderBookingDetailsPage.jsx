import { useState, useEffect } from 'react';
import { api } from '../../../api';

/**
 * ServiceProviderBookingDetailsPage - Detailed view of a single booking for service providers
 * Shows customer info, service details, and allows status updates
 */
export default function ServiceProviderBookingDetailsPage({ bookingId, onBack }) {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  async function loadBooking() {
    try {
      setLoading(true);
      setError('');

      const response = await api(`/api/service-provider/bookings/${bookingId}`);

      if (response.success && response.data) {
        setBooking(response.data);
      } else {
        setError(response.error || 'לא נמצאה הזמנה');
      }
    } catch (err) {
      setError(err.message || 'שגיאה בטעינת פרטי הזמנה');
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(newStatus) {
    if (!confirm(`האם לעדכן את הסטטוס ל-${getStatusLabel(newStatus)}?`)) {
      return;
    }

    try {
      setUpdating(true);
      setError('');
      setMessage('');

      const response = await api(`/api/service-provider/bookings/${bookingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });

      if (response.success) {
        setMessage('הסטטוס עודכן בהצלחה');
        await loadBooking();
      } else {
        setError(response.error || 'שגיאה בעדכון סטטוס');
      }
    } catch (err) {
      setError(err.message || 'שגיאה בעדכון סטטוס');
    } finally {
      setUpdating(false);
    }
  }

  function getStatusLabel(status) {
    const labels = {
      PENDING: 'ממתין לאישור',
      CONFIRMED: 'מאושר',
      REJECTED: 'נדחה',
      COMPLETED: 'הושלם',
      NO_SHOW: 'לא הגיע',
      CANCELLED_BY_CUSTOMER: 'בוטל על ידי הלקוח',
      CANCELLED_BY_BUSINESS: 'בוטל על ידי העסק'
    };
    return labels[status] || status;
  }

  function getStatusBadge(status) {
    const statusConfig = {
      PENDING: { bg: '#fef3c7', color: '#92400e', label: '⏳ ממתין לאישור' },
      CONFIRMED: { bg: '#d1fae5', color: '#065f46', label: '✓ מאושר' },
      COMPLETED: { bg: '#dbeafe', color: '#1e40af', label: '✅ הושלם' },
      CANCELLED_BY_CUSTOMER: { bg: '#fee2e2', color: '#991b1b', label: '✗ בוטל ע"י לקוח' },
      CANCELLED_BY_BUSINESS: { bg: '#fee2e2', color: '#991b1b', label: '✗ בוטל ע"י העסק' },
      REJECTED: { bg: '#fee2e2', color: '#991b1b', label: '✗ נדחה' },
      NO_SHOW: { bg: '#fee2e2', color: '#991b1b', label: '❌ לא הגיע' }
    };

    const config = statusConfig[status] || { bg: '#f3f4f6', color: '#374151', label: status };

    return (
      <span style={{
        display: 'inline-block',
        padding: 'var(--space-2) var(--space-3)',
        background: config.bg,
        color: config.color,
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--font-semibold)'
      }}>
        {config.label}
      </span>
    );
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'לא זמין';

    try {
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString('he-IL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });
    } catch {
      return dateStr;
    }
  }

  function formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return 'לא זמין';

    try {
      const date = new Date(dateTimeStr);
      return date.toLocaleString('he-IL', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateTimeStr;
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
        <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)' }}>⏳</div>
        <div style={{ fontSize: 'var(--text-lg)', color: 'var(--text-secondary)' }}>טוען פרטי הזמנה...</div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div style={{ padding: 'var(--space-4)', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{
          textAlign: 'center',
          padding: 'var(--space-8)',
          background: 'var(--danger-50)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 'var(--space-4)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)' }}>⚠️</div>
          <div style={{ fontSize: 'var(--text-lg)', color: 'var(--danger-700)', marginBottom: 'var(--space-4)' }}>
            {error}
          </div>
        </div>
        {onBack && (
          <button onClick={onBack} className="btn-secondary">
            ← חזרה להזמנות
          </button>
        )}
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  const canUpdateStatus = ['PENDING', 'CONFIRMED'].includes(booking.status);

  return (
    <div style={{ padding: 'var(--space-4)', maxWidth: '800px', margin: '0 auto' }}>
      {/* Back Button */}
      {onBack && (
        <button onClick={onBack} className="btn-secondary" style={{ marginBottom: 'var(--space-4)' }}>
          ← חזרה להזמנות
        </button>
      )}

      {/* Messages */}
      {message && (
        <div style={{
          padding: 'var(--space-4)',
          background: 'var(--success-50)',
          color: 'var(--success-700)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 'var(--space-4)',
          border: '1px solid var(--success-200)'
        }}>
          ✓ {message}
        </div>
      )}

      {error && (
        <div style={{
          padding: 'var(--space-4)',
          background: 'var(--danger-50)',
          color: 'var(--danger-700)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 'var(--space-4)',
          border: '1px solid var(--danger-200)'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Header */}
      <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
        <div className="card-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 className="card-title">פרטי הזמנה</h2>
              <p className="card-description">מספר הזמנה: {booking.publicId?.substring(0, 8) || booking.id}</p>
            </div>
            {getStatusBadge(booking.status)}
          </div>
        </div>
      </div>

      {/* Customer Information */}
      <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
        <div className="card-header">
          <h3 className="card-title">👤 פרטי הלקוח</h3>
        </div>
        <div style={{ padding: 'var(--space-4)', display: 'grid', gap: 'var(--space-3)' }}>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-1)' }}>
              שם מלא
            </div>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>
              {booking.customer?.fullName || 'לא זמין'}
            </div>
          </div>
          {booking.customer?.phone && (
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-1)' }}>
                טלפון
              </div>
              <div>
                <a href={`tel:${booking.customer.phone}`} style={{ fontSize: 'var(--text-lg)' }}>
                  📞 {booking.customer.phone}
                </a>
              </div>
            </div>
          )}
          {booking.customer?.email && (
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-1)' }}>
                אימייל
              </div>
              <div>
                <a href={`mailto:${booking.customer.email}`}>
                  {booking.customer.email}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Booking Details */}
      <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
        <div className="card-header">
          <h3 className="card-title">📋 פרטי ההזמנה</h3>
        </div>
        <div style={{ padding: 'var(--space-4)', display: 'grid', gap: 'var(--space-3)' }}>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-1)' }}>
              שירות
            </div>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>
              {booking.businessService?.serviceTemplate?.name || booking.businessService?.name || 'לא זמין'}
            </div>
            {booking.businessService?.description && (
              <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
                {booking.businessService.description}
              </div>
            )}
          </div>

          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-1)' }}>
              תאריך
            </div>
            <div style={{ fontSize: 'var(--text-lg)' }}>
              📅 {formatDate(booking.slot?.date || booking.date)}
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-1)' }}>
              שעה
            </div>
            <div style={{ fontSize: 'var(--text-lg)' }}>
              ⏰ {booking.startTime} - {booking.endTime}
            </div>
          </div>

          {booking.businessService?.durationMinutes && (
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-1)' }}>
                משך
              </div>
              <div>{booking.businessService.durationMinutes} דקות</div>
            </div>
          )}

          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-1)' }}>
              מחיר
            </div>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: 'var(--primary-color)' }}>
              ₪{booking.price || booking.businessService?.regularPrice || 0}
            </div>
          </div>

          {booking.customerNote && (
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-1)' }}>
                הערת לקוח
              </div>
              <div style={{
                padding: 'var(--space-3)',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                fontStyle: 'italic'
              }}>
                "{booking.customerNote}"
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Timestamps */}
      <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
        <div className="card-header">
          <h3 className="card-title">🕐 זמנים</h3>
        </div>
        <div style={{ padding: 'var(--space-4)', display: 'grid', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>נוצרה:</span>
            <span>{formatDateTime(booking.createdAt)}</span>
          </div>
          {booking.confirmedAt && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>אושרה:</span>
              <span>{formatDateTime(booking.confirmedAt)}</span>
            </div>
          )}
          {booking.cancelledAt && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>בוטלה:</span>
              <span>{formatDateTime(booking.cancelledAt)}</span>
            </div>
          )}
          {booking.updatedAt && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>עודכנה:</span>
              <span>{formatDateTime(booking.updatedAt)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Status Update Actions */}
      {canUpdateStatus && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">⚙️ פעולות</h3>
            <p className="card-description">עדכן את סטטוס ההזמנה</p>
          </div>
          <div style={{ padding: 'var(--space-4)', display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            {booking.status === 'PENDING' && (
              <button
                onClick={() => updateStatus('CONFIRMED')}
                className="btn-primary"
                disabled={updating}
                style={{ flex: '1 1 auto' }}
              >
                ✓ אשר הזמנה
              </button>
            )}
            {booking.status === 'PENDING' && (
              <button
                onClick={() => updateStatus('REJECTED')}
                className="btn-secondary"
                disabled={updating}
                style={{
                  flex: '1 1 auto',
                  color: 'var(--danger-color)',
                  borderColor: 'var(--danger-color)'
                }}
              >
                ✗ דחה הזמנה
              </button>
            )}
            {booking.status === 'CONFIRMED' && (
              <button
                onClick={() => updateStatus('COMPLETED')}
                className="btn-primary"
                disabled={updating}
                style={{ flex: '1 1 auto' }}
              >
                ✅ סמן כהושלם
              </button>
            )}
            {booking.status === 'CONFIRMED' && (
              <button
                onClick={() => updateStatus('NO_SHOW')}
                className="btn-secondary"
                disabled={updating}
                style={{
                  flex: '1 1 auto',
                  color: 'var(--warning-color)',
                  borderColor: 'var(--warning-color)'
                }}
              >
                ❌ לקוח לא הגיע
              </button>
            )}
            {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
              <button
                onClick={() => updateStatus('CANCELLED_BY_BUSINESS')}
                className="btn-secondary"
                disabled={updating}
                style={{
                  flex: '1 1 100%',
                  color: 'var(--danger-color)',
                  borderColor: 'var(--danger-color)'
                }}
              >
                🚫 בטל הזמנה
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
