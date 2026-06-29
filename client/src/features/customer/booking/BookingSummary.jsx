import React from 'react';

/**
 * BookingSummary - Step 1: Display slot details summary
 */
function BookingSummary({ slot, onContinue }) {
  return (
    <div className="booking-step-content">
      <h2 className="booking-title">סיכום התור</h2>

      <div className="booking-summary-card">
        <div className="summary-row">
          <span className="summary-label">שירות</span>
          <span className="summary-value">{slot.service.name}</span>
        </div>
        <div className="summary-row">
          <span className="summary-label">עסק</span>
          <span className="summary-value">{slot.business.name}</span>
        </div>
        <div className="summary-row">
          <span className="summary-label">מיקום</span>
          <span className="summary-value">📍 {slot.business.city}</span>
        </div>
        <div className="summary-row">
          <span className="summary-label">תאריך</span>
          <span className="summary-value">📅 {slot.date}</span>
        </div>
        <div className="summary-row">
          <span className="summary-label">שעה</span>
          <span className="summary-value">⏰ {slot.startTime}</span>
        </div>
        <div className="summary-row">
          <span className="summary-label">משך</span>
          <span className="summary-value">⏱️ {slot.service.durationMinutes} דקות</span>
        </div>
        <div className="summary-row summary-row-highlight">
          <span className="summary-label">מחיר</span>
          <span className="summary-value-price">
            ₪{slot.dealPrice || slot.regularPrice}
            {slot.dealPrice && slot.dealPrice < slot.regularPrice && (
              <span className="summary-original-price">₪{slot.regularPrice}</span>
            )}
          </span>
        </div>
      </div>

      <button className="btn-primary btn-lg btn-full" onClick={onContinue}>
        המשך להזמנה
      </button>
    </div>
  );
}

export default BookingSummary;
