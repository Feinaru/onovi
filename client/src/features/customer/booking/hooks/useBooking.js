import { useState, useEffect } from 'react';
import { api } from '../../../../api';

/**
 * useBooking - Manages booking state and submission
 */
export function useBooking(user) {
  const [selected, setSelected] = useState(null);
  const [bookingStep, setBookingStep] = useState(1);
  const [bookingForm, setBookingForm] = useState({
    customerName: user?.fullName || '',
    customerPhone: user?.phone || '',
    customerNote: ''
  });
  const [status, setStatus] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    setBookingForm(f => ({
      ...f,
      customerName: user?.fullName || f.customerName,
      customerPhone: user?.phone || f.customerPhone
    }));
  }, [user]);

  async function submitBooking(e, onSuccess) {
    e.preventDefault();
    setStatus('');
    try {
      await api('/bookings', {
        method: 'POST',
        body: JSON.stringify({ slotId: selected.id, ...bookingForm })
      });
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setSelected(null);
        setBookingStep(1);
        setBookingForm({
          customerName: user?.fullName || '',
          customerPhone: user?.phone || '',
          customerNote: ''
        });
        if (onSuccess) onSuccess();
      }, 3000);
    } catch (err) {
      setStatus(err.message);
      setTimeout(() => setStatus(''), 3000);
    }
  }

  function cancelBooking() {
    setSelected(null);
    setBookingStep(1);
    setShowSuccess(false);
  }

  return {
    selected,
    setSelected,
    bookingStep,
    setBookingStep,
    bookingForm,
    setBookingForm,
    status,
    showSuccess,
    submitBooking,
    cancelBooking
  };
}
