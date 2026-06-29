import React from 'react';

/**
 * BookingForm - Step 2: Customer details form
 */
function BookingForm({ bookingForm, setBookingForm, onSubmit, onBack, status }) {
  return (
    <div className="booking-step-content">
      <h2 className="booking-title">הפרטים שלך</h2>

      <form onSubmit={onSubmit} className="booking-form">
        <div className="form-group">
          <label className="form-label">שם מלא *</label>
          <input
            placeholder="הזן שם מלא"
            value={bookingForm.customerName}
            onChange={e => setBookingForm({ ...bookingForm, customerName: e.target.value })}
            required
            className="form-input-large"
          />
        </div>

        <div className="form-group">
          <label className="form-label">טלפון *</label>
          <input
            placeholder="050-1234567"
            value={bookingForm.customerPhone}
            onChange={e => setBookingForm({ ...bookingForm, customerPhone: e.target.value })}
            required
            className="form-input-large"
          />
        </div>

        <div className="form-group">
          <label className="form-label">הערה (אופציונלי)</label>
          <textarea
            placeholder="הערות לעסק..."
            value={bookingForm.customerNote}
            onChange={e => setBookingForm({ ...bookingForm, customerNote: e.target.value })}
            rows={3}
            className="form-textarea-large"
          />
        </div>

        <div className="booking-info-box">
          <div className="info-icon">💡</div>
          <div className="info-text">
            העסק יאשר את התור שלך בהקדם האפשרי. תקבל עדכון לטלפון.
          </div>
        </div>

        <div className="booking-actions">
          <button type="button" className="btn-secondary btn-lg" onClick={onBack}>
            חזור
          </button>
          <button type="submit" className="btn-primary btn-lg" style={{ flex: 1 }}>
            שלח בקשה
          </button>
        </div>
      </form>

      {status && (
        <div className="booking-error">
          {status}
        </div>
      )}
    </div>
  );
}

export default BookingForm;
