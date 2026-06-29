import { useState, useEffect, useMemo } from 'react';
import { api } from '../../../api';

/**
 * useBusinessData - Hook for managing business data (businesses, bookings, categories)
 */
export function useBusinessData(user) {
  const [businesses, setBusinesses] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [msg, setMsg] = useState('');

  const services = useMemo(() => businesses.flatMap(b => b.services || []), [businesses]);
  const slots = useMemo(() => businesses.flatMap(b => b.slots || []), [businesses]);

  async function loadBusinesses() {
    if (!user) return;
    const myBusinesses = await api('/businesses/my');
    setBusinesses(myBusinesses);

    const allBookings = await api('/bookings');
    setBookings(allBookings.filter(b => myBusinesses.some(mb => mb.id === b.businessId)));
  }

  useEffect(() => {
    api('/categories').then(cats => {
      setCategories(cats);
    });
  }, []);

  useEffect(() => {
    loadBusinesses();
  }, [user]);

  function showMessage(message) {
    setMsg(message);
    setTimeout(() => setMsg(''), 3000);
  }

  return {
    businesses,
    bookings,
    categories,
    services,
    slots,
    msg,
    setMsg,
    showMessage,
    reload: loadBusinesses
  };
}
