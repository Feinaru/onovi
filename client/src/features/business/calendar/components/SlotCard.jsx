import React from 'react';
import QuickActionsMenu from './QuickActionsMenu';
import './SlotCard.css';

/**
 * SlotCard - Published gap container with bookings inside
 *
 * A Slot is a published availability window that remains visible
 * even when bookings exist inside it.
 */
function SlotCard({ slot, onClick, onEdit, onDelete, onToggleStatus }) {
  const getStatusLabel = () => {
    if (slot.status === 'OPEN') {
      return 'Live on Lomea';
    }
    if (slot.status === 'CANCELLED' || slot.status === 'EXPIRED') {
      return 'Unpublished';
    }
    return slot.status;
  };

  const getCapacityIndicator = () => {
    const { capacity, bookedCount, status } = slot;

    if (status !== 'OPEN') {
      return {
        icon: '💤',
        text: 'No longer visible to customers',
        color: '#9ca3af'
      };
    }

    if (bookedCount === 0) {
      return {
        icon: '💚',
        text: `${capacity} spots open`,
        color: '#059669'
      };
    }

    if (bookedCount === capacity) {
      return {
        icon: '🔴',
        text: `Full (${bookedCount}/${capacity})`,
        color: '#dc2626'
      };
    }

    const fillPercent = (bookedCount / capacity) * 100;
    if (fillPercent >= 75) {
      return {
        icon: '🧡',
        text: `${bookedCount} of ${capacity} spots booked`,
        color: '#ea580c'
      };
    }

    return {
      icon: '💛',
      text: `${bookedCount} of ${capacity} spots booked`,
      color: '#d97706'
    };
  };

  const capacityInfo = getCapacityIndicator();
  const isUnpublished = slot.status !== 'OPEN';

  return (
    <div
      className={`slot-card ${isUnpublished ? 'unpublished' : ''}`}
      onClick={onClick}
      style={{
        backgroundColor: isUnpublished ? '#f3f4f633' : `${slot.color}1A`,
        borderLeftColor: isUnpublished ? '#9ca3af' : slot.color
      }}
    >
      {/* Slot header */}
      <div className="slot-card-header">
        <div className="slot-card-status">
          <span className="slot-card-icon">
            {isUnpublished ? '⭕' : '🟢'}
          </span>
          <span className="slot-card-status-text">
            {getStatusLabel()}
          </span>
        </div>
        <QuickActionsMenu
          event={slot}
          onView={onClick}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleStatus={onToggleStatus}
        />
      </div>

      {/* Service info */}
      <div className="slot-card-service">
        {slot.serviceName} • {slot.serviceDuration}min
      </div>

      {/* Bookings inside slot */}
      {slot.bookings && slot.bookings.length > 0 && (
        <div className="slot-card-bookings">
          {slot.bookings.map((booking) => (
            <div
              key={booking.id}
              className="booking-card-mini"
              onClick={(e) => {
                e.stopPropagation();
                // Open booking details
              }}
            >
              <div className="booking-card-mini-icon">🔵</div>
              <div className="booking-card-mini-content">
                <div className="booking-card-mini-name">{booking.customerName}</div>
                <div className="booking-card-mini-phone">{booking.customerPhone}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Capacity indicator */}
      <div
        className="slot-card-capacity"
        style={{ color: capacityInfo.color }}
      >
        <span className="slot-card-capacity-icon">{capacityInfo.icon}</span>
        <span className="slot-card-capacity-text">{capacityInfo.text}</span>
      </div>
    </div>
  );
}

export default SlotCard;
