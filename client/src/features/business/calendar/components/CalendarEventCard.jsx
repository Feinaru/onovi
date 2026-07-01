import React from 'react';
import QuickActionsMenu from './QuickActionsMenu';
import './CalendarEventCard.css';

/**
 * CalendarEventCard - Standalone calendar event
 * (phone booking, meeting, personal, etc.)
 */
function CalendarEventCard({ event, onClick, onEdit, onDelete }) {
  const getCategoryIcon = () => {
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
    return icons[event.category] || '⚪';
  };

  const getCategoryLabel = () => {
    const labels = {
      PHONE_BOOKING: 'Phone Booking',
      WHATSAPP_BOOKING: 'WhatsApp Booking',
      MEETING: 'Meeting',
      PERSONAL: 'Personal',
      LUNCH: 'Lunch',
      TRAINING: 'Training',
      BREAK: 'Break',
      APPOINTMENT: 'Appointment',
      OTHER: 'Event'
    };
    return labels[event.category] || 'Event';
  };

  return (
    <div
      className="calendar-event-card"
      onClick={onClick}
      style={{
        backgroundColor: `${event.color}26`,
        borderLeftColor: event.color
      }}
    >
      {/* Header */}
      <div className="calendar-event-header">
        <div className="calendar-event-title-row">
          <span className="calendar-event-icon">{getCategoryIcon()}</span>
          <span className="calendar-event-category">{getCategoryLabel()}</span>
        </div>
        <QuickActionsMenu
          event={event}
          onView={onClick}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>

      {/* Content */}
      <div className="calendar-event-content">
        {event.customerName && (
          <div className="calendar-event-customer">
            {event.customerName}
            {event.customerPhone && <span> • {event.customerPhone}</span>}
          </div>
        )}
        {event.description && !event.customerName && (
          <div className="calendar-event-description">{event.description}</div>
        )}
        {event.title && event.title !== getCategoryLabel() && (
          <div className="calendar-event-subtitle">{event.title}</div>
        )}
      </div>
    </div>
  );
}

export default CalendarEventCard;
