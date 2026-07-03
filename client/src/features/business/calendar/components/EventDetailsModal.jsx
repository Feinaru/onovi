import React, { useState, useEffect } from 'react';
import { api } from '../../../../api';
import './EventDetailsModal.css';

/**
 * EventDetailsModal - Comprehensive event details and actions
 * Handles: Slot, Booking, CalendarEvent, TimeBlock, Vacation
 */
function EventDetailsModal({ event, businessId, onClose, onEventUpdated, onEdit, onDelete }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Handle escape key
  useEffect(() => {
    function handleEscape(e) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!event) return null;

  const getEventTypeLabel = (eventType) => {
    const labels = {
      SLOT: 'חלון זמן פנוי',
      BOOKING: 'תור Lomea',
      CALENDAR_EVENT: 'אירוע ביומן',
      TIME_BLOCK: 'חסימת זמן',
      VACATION: 'חופשה'
    };
    return labels[eventType] || 'אירוע';
  };

  const getEventIcon = (eventType) => {
    const icons = {
      SLOT: '🟢',
      BOOKING: '🔵',
      CALENDAR_EVENT: '⚪',
      TIME_BLOCK: '🟡',
      VACATION: '🟣'
    };
    return icons[eventType] || '⚪';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      PHONE_BOOKING: '📞',
      WHATSAPP_BOOKING: '💬',
      MEETING: '👥',
      PERSONAL: '🏠',
      LUNCH: '🍽️',
      TRAINING: '📚',
      BREAK: '☕',
      APPOINTMENT: '⚪',
      OTHER: '⚪'
    };
    return icons[category] || '⚪';
  };

  const getStatusLabel = (status) => {
    const labels = {
      OPEN: 'פתוח',
      CANCELLED: 'בוטל',
      EXPIRED: 'פג תוקף',
      CONFIRMED: 'מאושר',
      PENDING: 'ממתין',
      CANCELLED_BY_CUSTOMER: 'בוטל על ידי לקוח',
      CANCELLED_BY_BUSINESS: 'בוטל על ידי העסק'
    };
    return labels[status] || status;
  };

  async function handleToggleStatus() {
    if (event.eventType !== 'SLOT') return;

    setIsProcessing(true);
    setError(null);

    try {
      const newStatus = event.status === 'OPEN' ? 'CANCELLED' : 'OPEN';
      await api(`/api/calendar/${businessId}/slots/${event.originalId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      onEventUpdated();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleCancelBooking() {
    if (event.eventType !== 'BOOKING') return;
    if (!confirm('האם לבטל הזמנה זו?')) return;

    setIsProcessing(true);
    setError(null);

    try {
      await api(`/bookings/${event.originalId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'CANCELLED_BY_BUSINESS' })
      });
      onEventUpdated();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  async function handleDeleteEvent() {
    if (!confirm(`האם למחוק ${getEventTypeLabel(event.eventType)}?`)) return;

    setIsProcessing(true);
    setError(null);

    try {
      if (event.eventType === 'SLOT') {
        await api(`/api/calendar/${businessId}/slots/${event.originalId}`, { method: 'DELETE' });
      } else if (event.eventType === 'CALENDAR_EVENT') {
        await api(`/api/calendar/${businessId}/calendar-events/${event.originalId}`, { method: 'DELETE' });
      } else if (event.eventType === 'TIME_BLOCK') {
        await api(`/api/calendar/${businessId}/time-blocks/${event.originalId}`, { method: 'DELETE' });
      } else if (event.eventType === 'VACATION') {
        await api(`/api/calendar/${businessId}/vacations/${event.originalId}`, { method: 'DELETE' });
      }
      onEventUpdated();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  }

  function renderSlotDetails() {
    const hasBookings = event.bookings && event.bookings.length > 0;
    const canModifyService = !hasBookings;

    return (
      <>
        <div className="event-details-section">
          <div className="event-details-row">
            <label>שירות</label>
            <div className="event-details-value">{event.serviceName}</div>
          </div>

          <div className="event-details-row">
            <label>משך</label>
            <div className="event-details-value">{event.serviceDuration} דקות</div>
          </div>

          <div className="event-details-row">
            <label>שעות</label>
            <div className="event-details-value">{event.startTime} - {event.endTime}</div>
          </div>

          <div className="event-details-row">
            <label>קיבולת</label>
            <div className="event-details-value">
              {event.bookedCount || 0} מתוך {event.capacity} ({event.remainingCapacity} פנויים)
            </div>
          </div>

          <div className="event-details-row">
            <label>סטטוס</label>
            <div className="event-details-value">
              <span className={`status-badge status-${event.status.toLowerCase()}`}>
                {event.status === 'OPEN' ? '🟢 Live on Lomea' : '💤 לא מפורסם'}
              </span>
            </div>
          </div>

          <div className="event-details-row">
            <label>מחיר</label>
            <div className="event-details-value">
              ₪{event.regularPrice}
              {event.dealPrice && event.dealPrice < event.regularPrice && (
                <span className="deal-price"> (מבצע: ₪{event.dealPrice})</span>
              )}
            </div>
          </div>

          {event.note && (
            <div className="event-details-row">
              <label>הערה</label>
              <div className="event-details-value">{event.note}</div>
            </div>
          )}
        </div>

        {hasBookings && (
          <div className="event-details-section">
            <h4>הזמנות ({event.bookings.length})</h4>
            <div className="bookings-list">
              {event.bookings.map((booking, idx) => (
                <div key={idx} className="booking-item">
                  <div className="booking-item-header">
                    <span className="booking-customer">{booking.customerName}</span>
                    <span className={`status-badge status-${booking.status.toLowerCase()}`}>
                      {getStatusLabel(booking.status)}
                    </span>
                  </div>
                  <div className="booking-item-details">
                    <span>📞 {booking.customerPhone}</span>
                    <span>₪{booking.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <div className="event-details-error">{error}</div>}

        <div className="event-details-actions">
          {event.status === 'OPEN' && (
            <button
              className="btn-secondary"
              onClick={handleToggleStatus}
              disabled={isProcessing}
            >
              {isProcessing ? 'מעדכן...' : '❌ הסר מפרסום'}
            </button>
          )}
          {event.status !== 'OPEN' && !hasBookings && (
            <button
              className="btn-primary"
              onClick={handleToggleStatus}
              disabled={isProcessing}
            >
              {isProcessing ? 'מעדכן...' : '✅ פרסם מחדש'}
            </button>
          )}
          {!hasBookings && onDelete && (
            <button
              className="btn-danger"
              onClick={handleDeleteEvent}
              disabled={isProcessing}
            >
              {isProcessing ? 'מוחק...' : '🗑️ מחק'}
            </button>
          )}
          {hasBookings && (
            <div className="event-details-warning">
              לא ניתן למחוק סלוט עם הזמנות קיימות
            </div>
          )}
        </div>
      </>
    );
  }

  function renderBookingDetails() {
    const canCancel = event.status === 'CONFIRMED' || event.status === 'PENDING';

    return (
      <>
        <div className="event-details-section">
          <div className="event-details-row">
            <label>לקוח</label>
            <div className="event-details-value">{event.customerName}</div>
          </div>

          <div className="event-details-row">
            <label>טלפון</label>
            <div className="event-details-value">{event.customerPhone}</div>
          </div>

          <div className="event-details-row">
            <label>שירות</label>
            <div className="event-details-value">{event.serviceName}</div>
          </div>

          <div className="event-details-row">
            <label>שעות</label>
            <div className="event-details-value">{event.startTime} - {event.endTime}</div>
          </div>

          <div className="event-details-row">
            <label>מחיר</label>
            <div className="event-details-value">₪{event.price}</div>
          </div>

          <div className="event-details-row">
            <label>סטטוס</label>
            <div className="event-details-value">
              <span className={`status-badge status-${event.status.toLowerCase()}`}>
                {getStatusLabel(event.status)}
              </span>
            </div>
          </div>

          {event.note && (
            <div className="event-details-row">
              <label>הערות</label>
              <div className="event-details-value">{event.note}</div>
            </div>
          )}
        </div>

        {error && <div className="event-details-error">{error}</div>}

        <div className="event-details-actions">
          {canCancel && (
            <button
              className="btn-danger"
              onClick={handleCancelBooking}
              disabled={isProcessing}
            >
              {isProcessing ? 'מבטל...' : '❌ בטל הזמנה'}
            </button>
          )}
          {!canCancel && (
            <div className="event-details-info">
              הזמנה זו כבר {getStatusLabel(event.status)}
            </div>
          )}
        </div>
      </>
    );
  }

  function renderCalendarEventDetails() {
    return (
      <>
        <div className="event-details-section">
          <div className="event-details-row">
            <label>קטגוריה</label>
            <div className="event-details-value">
              {getCategoryIcon(event.category)} {event.category || event.eventType}
            </div>
          </div>

          {event.title && (
            <div className="event-details-row">
              <label>כותרת</label>
              <div className="event-details-value">{event.title}</div>
            </div>
          )}

          <div className="event-details-row">
            <label>שעות</label>
            <div className="event-details-value">{event.startTime} - {event.endTime}</div>
          </div>

          {event.customerName && (
            <div className="event-details-row">
              <label>לקוח</label>
              <div className="event-details-value">
                {event.customerName}
                {event.customerPhone && ` • ${event.customerPhone}`}
              </div>
            </div>
          )}

          {event.description && (
            <div className="event-details-row">
              <label>תיאור</label>
              <div className="event-details-value">{event.description}</div>
            </div>
          )}
        </div>

        {error && <div className="event-details-error">{error}</div>}

        <div className="event-details-actions">
          {onEdit && (
            <button className="btn-primary" onClick={() => onEdit(event)}>
              ✏️ ערוך
            </button>
          )}
          {onDelete && (
            <button
              className="btn-danger"
              onClick={handleDeleteEvent}
              disabled={isProcessing}
            >
              {isProcessing ? 'מוחק...' : '🗑️ מחק'}
            </button>
          )}
        </div>
      </>
    );
  }

  function renderTimeBlockDetails() {
    return (
      <>
        <div className="event-details-section">
          <div className="event-details-row">
            <label>סוג</label>
            <div className="event-details-value">{event.blockType || 'חסימת זמן'}</div>
          </div>

          <div className="event-details-row">
            <label>שעות</label>
            <div className="event-details-value">{event.startTime} - {event.endTime}</div>
          </div>

          {event.description && (
            <div className="event-details-row">
              <label>תיאור</label>
              <div className="event-details-value">{event.description}</div>
            </div>
          )}

          {event.recurring && (
            <div className="event-details-row">
              <label>חזרה</label>
              <div className="event-details-value">
                {event.recurringPattern || 'חוזר'}
              </div>
            </div>
          )}
        </div>

        {error && <div className="event-details-error">{error}</div>}

        <div className="event-details-actions">
          {onEdit && (
            <button className="btn-primary" onClick={() => onEdit(event)}>
              ✏️ ערוך
            </button>
          )}
          {onDelete && (
            <button
              className="btn-danger"
              onClick={handleDeleteEvent}
              disabled={isProcessing}
            >
              {isProcessing ? 'מוחק...' : '🗑️ מחק'}
            </button>
          )}
        </div>
      </>
    );
  }

  function renderVacationDetails() {
    return (
      <>
        <div className="event-details-section">
          <div className="event-details-row">
            <label>תאריכים</label>
            <div className="event-details-value">
              {event.startDate} - {event.endDate}
            </div>
          </div>

          {event.description && (
            <div className="event-details-row">
              <label>תיאור</label>
              <div className="event-details-value">{event.description}</div>
            </div>
          )}
        </div>

        {error && <div className="event-details-error">{error}</div>}

        <div className="event-details-actions">
          {onEdit && (
            <button className="btn-primary" onClick={() => onEdit(event)}>
              ✏️ ערוך
            </button>
          )}
          {onDelete && (
            <button
              className="btn-danger"
              onClick={handleDeleteEvent}
              disabled={isProcessing}
            >
              {isProcessing ? 'מוחק...' : '🗑️ מחק'}
            </button>
          )}
        </div>
      </>
    );
  }

  function renderEventDetails() {
    switch (event.eventType) {
      case 'SLOT':
        return renderSlotDetails();
      case 'BOOKING':
        return renderBookingDetails();
      case 'CALENDAR_EVENT':
        return renderCalendarEventDetails();
      case 'TIME_BLOCK':
        return renderTimeBlockDetails();
      case 'VACATION':
        return renderVacationDetails();
      default:
        return <div>פרטי אירוע לא נתמכים</div>;
    }
  }

  return (
    <div className="modal-backdrop-v2" onClick={onClose}>
      <div className="modal-v2 event-details-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close-v2" onClick={onClose}>✕</button>

        <div className="event-details-header">
          <span className="event-details-icon">
            {getEventIcon(event.eventType)}
          </span>
          <h2 className="event-details-title">
            {getEventTypeLabel(event.eventType)}
          </h2>
          <div className="event-details-date">{event.date}</div>
        </div>

        <div className="event-details-content">
          {renderEventDetails()}
        </div>
      </div>
    </div>
  );
}

export default EventDetailsModal;
