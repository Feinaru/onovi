import { useState, useEffect, useMemo } from 'react';
import { api } from '../../../api';

/**
 * Booking status constants
 */
const ACTIVE_STATUSES = ['PENDING', 'CONFIRMED', 'APPROVED'];
const CANCELLED_STATUSES = ['CANCELLED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_BUSINESS', 'REJECTED'];
const COMPLETED_STATUSES = ['COMPLETED', 'NO_SHOW'];

/**
 * useMyBookings - Fetches and filters customer's bookings
 */
export function useMyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('upcoming');

  async function fetchBookings() {
    try {
      setLoading(true);
      setError(null);
      const data = await api('/bookings?mine=true');
      setBookings(data);
    } catch (err) {
      setError(err.message || 'שגיאה בטעינת התורים');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBookings();
  }, []);

  /**
   * Get today's date at midnight for comparison
   */
  const getTodayMidnight = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  /**
   * Parse booking date (slot.date is in YYYY-MM-DD format)
   */
  const parseBookingDate = (booking) => {
    if (!booking.slot?.date) return null;
    return new Date(booking.slot.date + 'T00:00:00');
  };

  /**
   * Filter bookings by category
   */
  const filteredBookings = useMemo(() => {
    const today = getTodayMidnight();

    return bookings.filter(booking => {
      const bookingDate = parseBookingDate(booking);
      const status = booking.status;

      if (activeFilter === 'upcoming') {
        // Upcoming: active status AND date >= today
        return ACTIVE_STATUSES.includes(status) &&
               bookingDate &&
               bookingDate >= today;
      } else if (activeFilter === 'past') {
        // Past: NOT cancelled AND (date < today OR completed/no-show status)
        // Cancelled bookings should only appear in "cancelled" tab
        return !CANCELLED_STATUSES.includes(status) &&
               ((bookingDate && bookingDate < today) || COMPLETED_STATUSES.includes(status));
      } else if (activeFilter === 'cancelled') {
        // Cancelled: any cancelled/rejected status
        return CANCELLED_STATUSES.includes(status);
      }

      return false;
    });
  }, [bookings, activeFilter]);

  /**
   * Calculate counts for each filter
   */
  const counts = useMemo(() => {
    const today = getTodayMidnight();

    const upcoming = bookings.filter(b => {
      const bookingDate = parseBookingDate(b);
      return ACTIVE_STATUSES.includes(b.status) &&
             bookingDate &&
             bookingDate >= today;
    }).length;

    const past = bookings.filter(b => {
      const bookingDate = parseBookingDate(b);
      return !CANCELLED_STATUSES.includes(b.status) &&
             ((bookingDate && bookingDate < today) || COMPLETED_STATUSES.includes(b.status));
    }).length;

    const cancelled = bookings.filter(b =>
      CANCELLED_STATUSES.includes(b.status)
    ).length;

    return { upcoming, past, cancelled };
  }, [bookings]);

  /**
   * Cancel a booking
   */
  async function cancelBooking(bookingId) {
    try {
      await api(`/bookings/${bookingId}/cancel`, { method: 'PATCH' });
      // Refetch bookings to get updated data
      await fetchBookings();
      return { success: true, message: 'התור בוטל בהצלחה' };
    } catch (err) {
      return { success: false, message: err.message || 'שגיאה בביטול התור' };
    }
  }

  /**
   * Check if a booking can be cancelled
   */
  function canCancelBooking(booking) {
    return ACTIVE_STATUSES.includes(booking.status);
  }

  return {
    bookings,
    filteredBookings,
    activeFilter,
    setActiveFilter,
    counts,
    loading,
    error,
    refetch: fetchBookings,
    cancelBooking,
    canCancelBooking
  };
}
