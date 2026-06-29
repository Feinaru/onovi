import React from 'react';

/**
 * BookingSuccess - Success confirmation screen
 */
function BookingSuccess({ slot, customerPhone }) {
  return (
    <div className="booking-success-content">
      <div className="success-icon-large">✓</div>
      <h2 className="success-title">בקשת ההזמנה נשלחה!</h2>
      <p className="success-description">
        העסק יאשר את התור בהקדם האפשרי.<br />
        תקבל עדכון בטלפון {customerPhone}
      </p>
      <div className="success-details">
        <div className="success-detail-row">
          <span>📅</span>
          <span>{slot.date} בשעה {slot.startTime}</span>
        </div>
        <div className="success-detail-row">
          <span>📍</span>
          <span>{slot.business.name}</span>
        </div>
      </div>
    </div>
  );
}

export default BookingSuccess;
