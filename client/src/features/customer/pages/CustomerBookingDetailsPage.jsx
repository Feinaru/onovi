import { useState, useEffect } from 'react';
import { api } from '../../../api';

/**
 * CustomerBookingDetailsPage - Individual booking details for customers
 */
export default function CustomerBookingDetailsPage({ bookingId, setView }) {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRescheduleOptions, setShowRescheduleOptions] = useState(false);
  const [rescheduleOptions, setRescheduleOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [rescheduleError, setRescheduleError] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleSuccess, setRescheduleSuccess] = useState(false);

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

  async function loadRescheduleOptions() {
    try {
      setLoadingOptions(true);
      setRescheduleError(null);
      const data = await api(`/bookings/${bookingId}/reschedule-options`);
      setRescheduleOptions(data.options || []);
      setShowRescheduleOptions(true);
    } catch (err) {
      console.error('Failed to load reschedule options:', err);
      setRescheduleError(err.message || 'שגיאה בטעינת מועדים זמינים');
    } finally {
      setLoadingOptions(false);
    }
  }

  async function handleRescheduleConfirm() {
    if (!selectedOption) return;

    try {
      setRescheduling(true);
      setRescheduleError(null);
      const result = await api(`/bookings/${bookingId}/reschedule`, {
        method: 'PATCH',
        body: JSON.stringify({
          slotId: selectedOption.slotId,
          startTime: selectedOption.startTime
        })
      });

      if (result.success) {
        setRescheduleSuccess(true);
        setShowConfirmation(false);
        setShowRescheduleOptions(false);
        setSelectedOption(null);
        // Reload booking to show updated time
        await loadBooking();
        // Show success message briefly
        setTimeout(() => setRescheduleSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to reschedule:', err);
      setRescheduleError(err.message || 'שגיאה בשינוי התור');
    } finally {
      setRescheduling(false);
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

      {/* Success message */}
      {rescheduleSuccess && (
        <div style={{
          padding: '16px',
          marginBottom: '24px',
          backgroundColor: '#d1fae5',
          color: '#065f46',
          borderRadius: '8px',
          border: '1px solid #a7f3d0',
          textAlign: 'center',
          fontWeight: '500'
        }}>
          ✓ התור עודכן בהצלחה
        </div>
      )}

      {/* Reschedule section */}
      {booking.reschedule && (
        <div style={{ marginBottom: '24px' }}>
          {booking.reschedule.canReschedule ? (
            <button
              onClick={loadRescheduleOptions}
              disabled={loadingOptions}
              className="btn-primary"
              style={{ fontSize: '16px', padding: '12px 24px' }}
            >
              {loadingOptions ? 'טוען מועדים...' : '🔄 שנה תור'}
            </button>
          ) : (
            <div style={{
              padding: '16px',
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ fontWeight: '500', marginBottom: '4px' }}>לא ניתן לשנות את התור</div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                {booking.reschedule.blockedReasonMessage || 'לא ניתן לשנות את התור במצב הנוכחי'}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reschedule error */}
      {rescheduleError && (
        <div style={{
          padding: '16px',
          marginBottom: '24px',
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          borderRadius: '8px',
          border: '1px solid #fecaca'
        }}>
          ⚠️ {rescheduleError}
        </div>
      )}

      {/* Reschedule options modal */}
      {showRescheduleOptions && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '24px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
              בחר מועד חדש
            </h3>

            {rescheduleOptions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
                <div>אין מועדים חלופיים זמינים כרגע</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
                {rescheduleOptions.map((option, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      setSelectedOption(option);
                      setShowConfirmation(true);
                    }}
                    style={{
                      padding: '16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      ':hover': {
                        borderColor: '#3b82f6',
                        backgroundColor: '#eff6ff'
                      }
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.backgroundColor = '#eff6ff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.backgroundColor = 'white';
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <div>
                          <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                            📅 {option.date}
                          </div>
                          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '2px' }}>
                            🕐 תור: {option.startTime} - {option.endTime}
                          </div>
                          {option.slotStartTime && option.slotEndTime && (
                            <div style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' }}>
                              בתוך זמינות: {option.slotStartTime} - {option.slotEndTime}
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: '600', color: '#10b981' }}>
                          ₪{option.price}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => {
                setShowRescheduleOptions(false);
                setRescheduleError(null);
              }}
              className="btn-secondary"
              style={{ width: '100%' }}
            >
              ביטול
            </button>
          </div>
        </div>
      )}

      {/* Confirmation modal */}
      {showConfirmation && selectedOption && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001,
          padding: '24px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '400px',
            width: '100%'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
              האם לשנות את התור?
            </h3>

            <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>מועד חדש:</div>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                📅 {selectedOption.date}
              </div>
              <div style={{ color: '#6b7280' }}>
                🕐 {selectedOption.startTime} - {selectedOption.endTime}
              </div>
            </div>

            {rescheduleError && (
              <div style={{
                padding: '12px',
                marginBottom: '16px',
                backgroundColor: '#fee2e2',
                color: '#991b1b',
                borderRadius: '6px',
                fontSize: '14px'
              }}>
                {rescheduleError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleRescheduleConfirm}
                disabled={rescheduling}
                className="btn-primary"
                style={{ flex: 1 }}
              >
                {rescheduling ? 'משנה...' : 'כן, שנה תור'}
              </button>
              <button
                onClick={() => {
                  setShowConfirmation(false);
                  setSelectedOption(null);
                  setRescheduleError(null);
                }}
                disabled={rescheduling}
                className="btn-secondary"
                style={{ flex: 1 }}
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

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
