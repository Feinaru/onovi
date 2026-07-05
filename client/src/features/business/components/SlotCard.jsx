import React, { useState, useEffect } from 'react';
import { api } from '../../../api';

/**
 * SlotCard - Single slot row in table (Sprint C: with bookings management)
 */
function SlotCard({ slot, onEdit, onDelete, showMessage }) {
  const [showBookings, setShowBookings] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Fetch bookings when expanded
  const fetchBookings = async () => {
    if (bookings.length > 0) return; // Already loaded

    setLoadingBookings(true);
    try {
      const data = await api(`/bookings?slotId=${slot.id}`);
      setBookings(data);
    } catch (err) {
      showMessage?.(err.message || 'שגיאה בטעינת הזמנות');
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleToggleBookings = () => {
    if (!showBookings) {
      fetchBookings();
    }
    setShowBookings(!showBookings);
  };

  // Update booking status
  const handleUpdateStatus = async (bookingId, status) => {
    try {
      await api(`/bookings/${bookingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });

      showMessage?.('הסטטוס עודכן בהצלחה');

      // Refresh bookings
      setBookings([]);
      fetchBookings();
    } catch (err) {
      showMessage?.(err.message || 'שגיאה בעדכון סטטוס');
    }
  };

  // Cancel booking
  const handleCancelBooking = async (bookingId) => {
    if (!confirm('האם לבטל הזמנה זו?')) return;

    try {
      await api(`/bookings/${bookingId}/cancel`, {
        method: 'PATCH'
      });

      showMessage?.('ההזמנה בוטלה');

      // Refresh bookings
      setBookings([]);
      fetchBookings();
    } catch (err) {
      showMessage?.(err.message || 'שגיאה בביטול הזמנה');
    }
  };

  const activeBookings = bookings.filter(b =>
    ['PENDING', 'CONFIRMED'].includes(b.status)
  );

  return (
    <>
      <tr>
        <td style={{ fontWeight: 'var(--font-semibold)' }}>
          {slot.allowedServices?.length > 0
            ? `${slot.allowedServices.length} שירותים`
            : slot.service?.name || 'שירות'}
        </td>
        <td>{slot.date}</td>
        <td>{slot.startTime}-{slot.endTime}</td>
        <td>
          {slot.dealPrice && slot.dealPrice < slot.regularPrice ? (
            <span>
              <span style={{ color: 'var(--primary-600)', fontWeight: 'var(--font-bold)' }}>
                ₪{slot.dealPrice}
              </span>
              {' '}
              <span style={{
                textDecoration: 'line-through',
                color: 'var(--text-tertiary)',
                fontSize: 'var(--text-sm)'
              }}>
                ₪{slot.regularPrice}
              </span>
            </span>
          ) : (
            <span>₪{slot.regularPrice}</span>
          )}
        </td>
        <td>
          <span className={`badge ${
            slot.status === 'OPEN' ? 'badge-success' :
            slot.status === 'FULL' ? 'badge-danger' :
            'badge-gray'
          }`}>
            {slot.status === 'OPEN' ? '✓ פתוח' :
             slot.status === 'FULL' ? '■ מלא' :
             slot.status}
          </span>
        </td>
        <td>
          <div className="flex gap-2">
            <button
              className="btn-sm btn-secondary"
              onClick={handleToggleBookings}
            >
              {showBookings ? '▼' : '▶'} הזמנות ({activeBookings.length})
            </button>
            <button className="btn-sm btn-secondary" onClick={() => onEdit(slot)}>
              ✏️ ערוך
            </button>
            <button className="btn-sm btn-danger" onClick={() => onDelete(slot.id)}>
              🗑️ מחק
            </button>
          </div>
        </td>
      </tr>

      {/* Bookings Section */}
      {showBookings && (
        <tr>
          <td colSpan="6" style={{ padding: '16px', backgroundColor: '#f9fafb' }}>
            {loadingBookings ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>טוען הזמנות...</div>
            ) : bookings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                אין הזמנות לתור זה
              </div>
            ) : (
              <div>
                <h4 style={{ marginBottom: '12px', fontSize: '15px', fontWeight: '600' }}>
                  הזמנות ({bookings.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {bookings.map(booking => (
                    <div
                      key={booking.id}
                      style={{
                        padding: '12px',
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                            {booking.customerName}
                          </div>
                          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                            📞 {booking.customerPhone}
                          </div>
                          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                            ⏰ {booking.startTime} - {booking.endTime}
                          </div>
                          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                            💼 {booking.businessService?.name || 'שירות'}
                          </div>
                          {booking.customerNote && (
                            <div style={{ fontSize: '13px', color: '#9ca3af', marginTop: '6px', fontStyle: 'italic' }}>
                              הערה: {booking.customerNote}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                          <span className={`badge ${
                            booking.status === 'PENDING' ? 'badge-warning' :
                            booking.status === 'CONFIRMED' ? 'badge-success' :
                            booking.status === 'COMPLETED' ? 'badge-primary' :
                            booking.status === 'NO_SHOW' ? 'badge-danger' :
                            'badge-gray'
                          }`}>
                            {booking.status === 'PENDING' ? 'ממתין לאישור' :
                             booking.status === 'CONFIRMED' ? 'מאושר' :
                             booking.status === 'COMPLETED' ? 'הושלם' :
                             booking.status === 'NO_SHOW' ? 'לא הגיע' :
                             booking.status}
                          </span>

                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            {booking.status === 'PENDING' && (
                              <>
                                <button
                                  className="btn-sm btn-success"
                                  onClick={() => handleUpdateStatus(booking.id, 'CONFIRMED')}
                                  style={{ fontSize: '12px' }}
                                >
                                  ✓ אשר
                                </button>
                                <button
                                  className="btn-sm btn-danger"
                                  onClick={() => handleUpdateStatus(booking.id, 'REJECTED')}
                                  style={{ fontSize: '12px' }}
                                >
                                  ✗ דחה
                                </button>
                              </>
                            )}

                            {booking.status === 'CONFIRMED' && (
                              <>
                                <button
                                  className="btn-sm btn-success"
                                  onClick={() => handleUpdateStatus(booking.id, 'COMPLETED')}
                                  style={{ fontSize: '12px' }}
                                >
                                  ✓ הושלם
                                </button>
                                <button
                                  className="btn-sm btn-warning"
                                  onClick={() => handleUpdateStatus(booking.id, 'NO_SHOW')}
                                  style={{ fontSize: '12px' }}
                                >
                                  ⚠ לא הגיע
                                </button>
                              </>
                            )}

                            {['PENDING', 'CONFIRMED'].includes(booking.status) && (
                              <button
                                className="btn-sm btn-secondary"
                                onClick={() => handleCancelBooking(booking.id)}
                                style={{ fontSize: '12px' }}
                              >
                                ביטול
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

export default SlotCard;
