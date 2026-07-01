import { useState, useEffect } from 'react';
import { api } from '../../../../api';

/**
 * useCalendarData - Fetch all calendar events for a business
 *
 * Returns unified format with all event types:
 * - PUBLISHED_GAP (🟢)
 * - BOOKING (🔵)
 * - CALENDAR_EVENT (⚪)
 * - TIME_BLOCK (🟡)
 * - VACATION (🟣)
 */
function useCalendarData(businessId, from, to) {
  const [events, setEvents] = useState([]);
  const [vacations, setVacations] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [heatMap, setHeatMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchCalendar() {
    if (!businessId) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (from) params.append('from', from);
      if (to) params.append('to', to);

      const data = await api(`/api/calendar/${businessId}?${params.toString()}`);
      setEvents(data.events || []);
      setVacations(data.vacations || []);
      setMetrics(data.metrics || null);
      setHeatMap(data.heatMap || null);
    } catch (err) {
      setError(err.message || 'Failed to load calendar');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCalendar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, from, to]);

  return {
    events,
    vacations,
    metrics,
    heatMap,
    loading,
    error,
    refetch: fetchCalendar
  };
}

export default useCalendarData;
