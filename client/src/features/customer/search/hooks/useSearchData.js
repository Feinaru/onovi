import { useState, useEffect, useMemo } from 'react';
import { api } from '../../../../api';

/**
 * useSearchData - Manages slot search data and filtering logic
 */
export function useSearchData() {
  const [slots, setSlots] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    categoryId: '',
    city: '',
    street: '',
    houseNumber: '',
    searchLocation: null,
    date: '',
    timeOfDay: '',
    minPrice: '',
    maxPrice: '',
    onlyDiscounted: false
  });

  async function load() {
    const query = new URLSearchParams(
      Object.fromEntries(
        Object.entries(filters)
          .filter(([k, v]) => v && k !== 'timeOfDay' && k !== 'minPrice' && k !== 'maxPrice' && k !== 'onlyDiscounted')
      )
    ).toString();
    const fetchedSlots = await api(`/slots${query ? `?${query}` : ''}`);
    setSlots(fetchedSlots);
  }

  useEffect(() => {
    api('/categories').then(setCategories);
  }, []);

  useEffect(() => {
    load();
  }, []);

  const getTimeOfDay = (time) => {
    const hour = parseInt(time.split(':')[0]);
    if (hour >= 6 && hour < 12) return 'בוקר';
    if (hour >= 12 && hour < 17) return 'צהריים';
    return 'ערב';
  };

  const filteredSlots = useMemo(() => {
    return slots.filter(slot => {
      if (filters.timeOfDay) {
        const slotTimeOfDay = getTimeOfDay(slot.startTime);
        if (slotTimeOfDay !== filters.timeOfDay) return false;
      }

      const price = slot.dealPrice || slot.regularPrice;
      if (filters.minPrice && price < parseFloat(filters.minPrice)) return false;
      if (filters.maxPrice && price > parseFloat(filters.maxPrice)) return false;

      if (filters.onlyDiscounted) {
        const hasDeal = slot.dealPrice && slot.dealPrice < slot.regularPrice;
        if (!hasDeal) return false;
      }

      return true;
    });
  }, [slots, filters]);

  const resetFilters = () => {
    setFilters({
      categoryId: '',
      city: '',
      date: '',
      timeOfDay: '',
      minPrice: '',
      maxPrice: '',
      onlyDiscounted: false
    });
  };

  const hasActiveFilters = filters.categoryId || filters.city || filters.date ||
    filters.timeOfDay || filters.minPrice || filters.maxPrice || filters.onlyDiscounted;

  return {
    slots,
    categories,
    filters,
    setFilters,
    filteredSlots,
    load,
    resetFilters,
    hasActiveFilters
  };
}
