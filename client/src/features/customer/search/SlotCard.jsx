import React, { useState } from 'react';
import { api } from '../../../api';

/**
 * SlotCard - Individual slot display card (Sprint C: booking submission)
 */
function SlotCard({ slot, onSelect, showMessage, setView, user }) {
  const [selectedService, setSelectedService] = useState(null);
  const [availableTimes, setAvailableTimes] = useState(null);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    customerName: user?.fullName || '',
    customerPhone: user?.phone || '',
    customerEmail: user?.email || '',
    customerNote: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const calculateDiscount = (regular, deal) => {
    if (!deal) return 0;
    return Math.round(((regular - deal) / regular) * 100);
  };

  const calculateSavings = (regular, deal) => {
    if (!deal) return 0;
    return regular - deal;
  };

  const getUrgencyBadge = (dateStr) => {
    const slotDate = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    nextWeek.setHours(0, 0, 0, 0);
    slotDate.setHours(0, 0, 0, 0);

    if (slotDate.getTime() === today.getTime()) return { text: 'היום', color: 'danger' };
    if (slotDate.getTime() === tomorrow.getTime()) return { text: 'מחר', color: 'warning' };
    if (slotDate <= nextWeek) return { text: 'השבוע', color: 'accent' };
    return null;
  };

  // Fetch available times for selected service
  const fetchAvailableTimes = async (serviceId) => {
    setLoadingTimes(true);
    try {
      const response = await api(`/slots/${slot.id}/available-times?businessServiceId=${serviceId}`);
      setAvailableTimes(response.availableTimes);
    } catch (err) {
      console.error('Failed to fetch available times:', err);
      setAvailableTimes([]);
    } finally {
      setLoadingTimes(false);
    }
  };

  // Handle service selection
  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setSelectedTime(null);
    setShowBookingForm(false);
    fetchAvailableTimes(service.id);
  };

  // Handle time selection
  const handleTimeSelect = (time) => {
    setSelectedTime(time);
  };

  // Handle booking submission
  const handleBookingSubmit = async (e) => {
    e.preventDefault();

    if (!selectedService || !selectedTime) {
      showMessage?.('אנא בחר שירות ושעה');
      return;
    }

    setSubmitting(true);

    try {
      await api('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          slotId: slot.id,
          businessServiceId: selectedService.id,
          startTime: selectedTime,
          ...bookingForm
        })
      });

      showMessage?.('ההזמנה נוצרה בהצלחה! העסק יאשר בקרוב');
      setShowBookingForm(false);
      setSelectedService(null);
      setSelectedTime(null);
      setAvailableTimes(null);
      setBookingForm({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        customerNote: ''
      });

      // Optionally reload or update UI
      if (onSelect) {
        onSelect(slot);
      }
    } catch (err) {
      if (err.status === 401) {
        // Unauthorized - redirect to login
        showMessage?.('נדרש התחברות. מעבר לדף התחברות...');
        setTimeout(() => setView('auth'), 1500);
      } else if (err.status === 403) {
        // Forbidden
        showMessage?.('אין הרשאה לבצע פעולה זו');
      } else if (err.status === 409) {
        // Conflict - time no longer available
        showMessage?.(err.message || 'השעה כבר לא זמינה. אנא בחר שעה אחרת');
        // Refetch available times
        if (selectedService) {
          fetchAvailableTimes(selectedService.id);
        }
        setSelectedTime(null);
      } else {
        showMessage?.(err.message || 'שגיאה ביצירת הזמנה');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const discount = calculateDiscount(slot.regularPrice, slot.dealPrice);
  const savings = calculateSavings(slot.regularPrice, slot.dealPrice);
  const hasDeal = slot.dealPrice && slot.dealPrice < slot.regularPrice;
  const urgency = getUrgencyBadge(slot.date);

  // Use allowedServices if available, otherwise fall back to legacy service
  const allowedServices = slot.allowedServices || (slot.service ? [slot.service] : []);

  return (
    <div className="slot-card-v2">
      {/* Badges */}
      <div className="slot-badges">
        {hasDeal && (
          <div className="slot-badge slot-badge-discount">
            🔥 {discount}% הנחה
          </div>
        )}
        {urgency && (
          <div className={`slot-badge slot-badge-${urgency.color}`}>
            ⚡ {urgency.text}
          </div>
        )}
      </div>

      {/* Business Info */}
      <div className="slot-business-info">
        <h3 className="slot-business-name">{slot.business.name}</h3>
        <div className="slot-location">
          📍 {slot.business.city}
        </div>
        {setView && (
          <button
            onClick={() => setView({ view: 'business-profile', businessId: slot.business.id })}
            style={{
              marginTop: '6px',
              padding: '4px 12px',
              fontSize: '12px',
              color: '#0B4A78',
              backgroundColor: 'transparent',
              border: '1px solid #0B4A78',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            צפה בפרופיל העסק →
          </button>
        )}
      </div>

      {/* Allowed Services */}
      {allowedServices.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#4a5568' }}>
            שירותים זמינים בתור זה:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {allowedServices.map(service => (
              <label
                key={service.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: selectedService?.id === service.id ? '#ebf8ff' : '#fff',
                  transition: 'all 0.2s'
                }}
              >
                <input
                  type="radio"
                  name={`service-${slot.id}`}
                  checked={selectedService?.id === service.id}
                  onChange={() => handleServiceSelect(service)}
                  style={{ marginLeft: '8px' }}
                />
                <span style={{ flex: 1, fontSize: '14px' }}>{service.name}</span>
                <span style={{ fontSize: '12px', color: '#718096' }}>
                  {service.durationMinutes} דקות
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Details */}
      <div className="slot-details-grid">
        <div className="slot-detail">
          <span className="detail-icon">📅</span>
          <span className="detail-text">{slot.date}</span>
        </div>
        <div className="slot-detail">
          <span className="detail-icon">⏰</span>
          <span className="detail-text">{slot.startTime} - {slot.endTime}</span>
        </div>
      </div>

      {/* Available Times */}
      {selectedService && (
        <div style={{ marginTop: '12px', marginBottom: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#4a5568' }}>
            שעות התחלה אפשריות:
          </div>
          {loadingTimes ? (
            <div style={{ textAlign: 'center', padding: '12px', color: '#718096' }}>
              טוען...
            </div>
          ) : availableTimes && availableTimes.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
              gap: '6px'
            }}>
              {availableTimes.map(time => {
                const timeStr = typeof time === 'string' ? time : time.startTime;
                const isSelected = selectedTime === timeStr;
                return (
                  <button
                    key={timeStr}
                    onClick={() => handleTimeSelect(timeStr)}
                    style={{
                      padding: '8px 6px',
                      textAlign: 'center',
                      border: isSelected ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                      borderRadius: '4px',
                      fontSize: '13px',
                      backgroundColor: isSelected ? '#dbeafe' : '#f7fafc',
                      cursor: 'pointer',
                      fontWeight: isSelected ? '600' : 'normal',
                      transition: 'all 0.2s'
                    }}
                  >
                    {timeStr}
                  </button>
                );
              })}
            </div>
          ) : availableTimes && availableTimes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '12px', color: '#e53e3e', fontSize: '13px' }}>
              אין שעות זמינות לשירות זה
            </div>
          ) : null}
        </div>
      )}

      {/* Booking Form / Login Required */}
      {selectedTime && !showBookingForm && !user && (
        <button
          onClick={() => setView('auth')}
          style={{
            width: '100%',
            padding: '12px',
            marginTop: '12px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          🔐 התחבר כדי לקבוע תור
        </button>
      )}
      {selectedTime && !showBookingForm && user && (
        <button
          onClick={() => setShowBookingForm(true)}
          style={{
            width: '100%',
            padding: '12px',
            marginTop: '12px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          המשך להזמנה
        </button>
      )}

      {showBookingForm && (
        <form onSubmit={handleBookingSubmit} style={{ marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#1f2937' }}>
            פרטי ההזמנה
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#4b5563' }}>
              שם מלא *
            </label>
            <input
              type="text"
              required
              value={bookingForm.customerName}
              onChange={(e) => setBookingForm({ ...bookingForm, customerName: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#4b5563' }}>
              טלפון *
            </label>
            <input
              type="tel"
              required
              value={bookingForm.customerPhone}
              onChange={(e) => setBookingForm({ ...bookingForm, customerPhone: e.target.value })}
              placeholder="050-1234567"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#4b5563' }}>
              אימייל (אופציונלי)
            </label>
            <input
              type="email"
              value={bookingForm.customerEmail}
              onChange={(e) => setBookingForm({ ...bookingForm, customerEmail: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#4b5563' }}>
              הערות (אופציונלי)
            </label>
            <textarea
              value={bookingForm.customerNote}
              onChange={(e) => setBookingForm({ ...bookingForm, customerNote: e.target.value })}
              rows="2"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: submitting ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? 'שולח...' : 'אשר הזמנה'}
            </button>
            <button
              type="button"
              onClick={() => setShowBookingForm(false)}
              disabled={submitting}
              style={{
                padding: '12px 20px',
                backgroundColor: 'white',
                color: '#6b7280',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '15px',
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              ביטול
            </button>
          </div>
        </form>
      )}

      {/* Pricing */}
      <div className="slot-pricing">
        <div className="slot-price-main">
          ₪{slot.dealPrice || slot.regularPrice}
        </div>
        {hasDeal && (
          <div className="slot-price-details">
            <span className="slot-price-original">₪{slot.regularPrice}</span>
            <span className="slot-savings">חוסכים ₪{savings}</span>
          </div>
        )}
      </div>

    </div>
  );
}

export default SlotCard;
