import React from 'react';
import BookingSummary from './BookingSummary';
import BookingForm from './BookingForm';
import BookingSuccess from './BookingSuccess';

/**
 * BookingDialog - Complete booking modal with steps
 */
function BookingDialog({
  slot,
  bookingStep,
  setBookingStep,
  bookingForm,
  setBookingForm,
  onSubmit,
  onCancel,
  status,
  showSuccess
}) {
  return (
    <div className="modal-backdrop-v2" onClick={onCancel}>
      <div className={`modal-v2 ${showSuccess ? 'modal-success' : ''}`} onClick={e => e.stopPropagation()}>
        {!showSuccess ? (
          <>
            <button className="modal-close-v2" onClick={onCancel}>✕</button>

            {/* Steps Indicator */}
            <div className="booking-steps">
              <div className={`booking-step ${bookingStep >= 1 ? 'active' : ''} ${bookingStep > 1 ? 'completed' : ''}`}>
                <div className="step-number">{bookingStep > 1 ? '✓' : '1'}</div>
                <div className="step-label">פרטי התור</div>
              </div>
              <div className="step-line" />
              <div className={`booking-step ${bookingStep >= 2 ? 'active' : ''} ${bookingStep > 2 ? 'completed' : ''}`}>
                <div className="step-number">{bookingStep > 2 ? '✓' : '2'}</div>
                <div className="step-label">הפרטים שלך</div>
              </div>
              <div className="step-line" />
              <div className={`booking-step ${bookingStep >= 3 ? 'active' : ''}`}>
                <div className="step-number">3</div>
                <div className="step-label">אישור</div>
              </div>
            </div>

            {/* Step Content */}
            {bookingStep === 1 && (
              <BookingSummary slot={slot} onContinue={() => setBookingStep(2)} />
            )}

            {bookingStep === 2 && (
              <BookingForm
                bookingForm={bookingForm}
                setBookingForm={setBookingForm}
                onSubmit={onSubmit}
                onBack={() => setBookingStep(1)}
                status={status}
              />
            )}
          </>
        ) : (
          <BookingSuccess slot={slot} customerPhone={bookingForm.customerPhone} />
        )}
      </div>
    </div>
  );
}

export default BookingDialog;
