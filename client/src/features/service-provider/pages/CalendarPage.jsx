import { useState, useEffect } from 'react';
import { api } from '../../../api';
import SlotForm from '../../business/components/SlotForm';
import SlotCard from '../../business/components/SlotCard';
import CalendarShell from '../../../shared/calendar/CalendarShell';
import CalendarDayView from '../components/calendar/CalendarDayView';
import { formatDateLocal, addDays, addMonths } from '../../../shared/calendar/utils/calendarUtils';

/**
 * CalendarPage - Standalone slot management for Service Provider Workspace
 * Migrated to use provider-scoped API routes (Phase B)
 * Unified Calendar System - Day/Week/Month views with shared CalendarShell
 */

/**
 * Active booking statuses (block editing/deleting availability)
 */
const ACTIVE_BOOKING_STATUSES = ['PENDING', 'APPROVED', 'CONFIRMED', 'COMPLETED', 'NO_SHOW'];

/**
 * Helper: Get active bookings from slot bookings array
 */
function getActiveBookings(slot) {
  if (!slot || !slot.bookings || !Array.isArray(slot.bookings)) {
    return [];
  }
  return slot.bookings.filter(b => ACTIVE_BOOKING_STATUSES.includes(b.status));
}

export default function CalendarPage({ user }) {
  const [business, setBusiness] = useState(null);
  const [services, setServices] = useState([]);
  const [slots, setSlots] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Current date for calendar navigation - initialize intelligently
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    // Will be updated to smart date after slots load
    return today;
  });

  // Current view - day/week/month
  const [currentView, setCurrentView] = useState('day');

  // Slot form state - businessId kept for SlotForm compatibility but not sent to backend
  const [slotForm, setSlotForm] = useState({
    businessId: '',
    date: '',
    startTime: '',
    endTime: '',
    regularPrice: '',
    dealPrice: '',
    status: 'OPEN',
    allowedServiceIds: [] // Epic 2: Multiple services per slot
  });

  const [editingSlot, setEditingSlot] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      // Fetch provider business profile
      const businessRes = await api('/api/service-provider/business/profile');
      if (businessRes.success && businessRes.data) {
        const businessData = businessRes.data;
        setBusiness(businessData);

        // Set businessId in form for SlotForm compatibility (not sent to backend)
        if (!slotForm.businessId) {
          setSlotForm(prev => ({ ...prev, businessId: businessData.id }));
        }
      }

      // Fetch provider services
      const servicesRes = await api('/api/service-provider/services');
      if (servicesRes.success && Array.isArray(servicesRes.data)) {
        setServices(servicesRes.data);
      }

      // Fetch provider slots
      const slotsRes = await api('/api/service-provider/slots');
      if (slotsRes.success && Array.isArray(slotsRes.data)) {
        const slotsData = slotsRes.data;
        setSlots(slotsData);

        // Smart currentDate initialization: use earliest upcoming slot date or today
        if (slotsData.length > 0) {
          const today = formatDateLocal(new Date());
          const upcomingSlots = slotsData.filter(s => s.date >= today).sort((a, b) => a.date.localeCompare(b.date));

          if (upcomingSlots.length > 0) {
            // Use earliest upcoming slot date
            const [year, month, day] = upcomingSlots[0].date.split('-').map(Number);
            setCurrentDate(new Date(year, month - 1, day));
          } else {
            // No upcoming slots, use first slot date
            const [year, month, day] = slotsData[0].date.split('-').map(Number);
            setCurrentDate(new Date(year, month - 1, day));
          }
        }
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      showMessage('שגיאה בטעינת נתונים');
    } finally {
      setLoading(false);
    }
  }

  function showMessage(msg) {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  }

  async function createSlot(e) {
    e.preventDefault();

    // Validate allowedServiceIds
    if (!slotForm.allowedServiceIds || slotForm.allowedServiceIds.length === 0) {
      showMessage('חובה לבחור לפחות שירות אחד');
      return;
    }

    try {
      // Extract only fields needed by backend (no businessId)
      const slotData = {
        date: slotForm.date,
        startTime: slotForm.startTime,
        endTime: slotForm.endTime,
        regularPrice: slotForm.regularPrice,
        dealPrice: slotForm.dealPrice || undefined,
        allowedServiceIds: slotForm.allowedServiceIds
      };

      const result = await api('/api/service-provider/slots', {
        method: 'POST',
        body: JSON.stringify(slotData)
      });

      if (result.success) {
        showMessage('התור פורסם');
        await loadData();

        // Reset form
        setSlotForm({
          businessId: slotForm.businessId, // Keep for SlotForm compatibility
          date: '',
          startTime: '',
          endTime: '',
          regularPrice: '',
          dealPrice: '',
          status: 'OPEN',
          allowedServiceIds: []
        });
      } else {
        showMessage(result.error || 'שגיאה ביצירת תור');
      }
    } catch (err) {
      showMessage(err.message || 'שגיאה ביצירת תור');
    }
  }

  async function updateSlot(e) {
    e.preventDefault();

    try {
      // Extract only fields that can be updated
      const updateData = {
        date: editingSlot.date,
        startTime: editingSlot.startTime,
        endTime: editingSlot.endTime,
        regularPrice: editingSlot.regularPrice,
        dealPrice: editingSlot.dealPrice || null,
        note: editingSlot.note
      };

      const result = await api(`/api/service-provider/slots/${editingSlot.id}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      });

      if (result.success) {
        showMessage('התור עודכן');
        setEditingSlot(null);
        await loadData();
      } else {
        showMessage(result.error || 'שגיאה בעדכון תור');
      }
    } catch (err) {
      showMessage(err.message || 'שגיאה בעדכון תור');
    }
  }

  async function deleteSlot(id) {
    if (!confirm('למחוק זמינות זו?')) return;

    try {
      const result = await api(`/api/service-provider/slots/${id}`, {
        method: 'DELETE'
      });

      if (result.success) {
        showMessage('הזמינות נמחקה');
        await loadData();
      } else {
        showMessage(result.error || 'שגיאה במחיקת זמינות');
      }
    } catch (err) {
      showMessage(err.message || 'שגיאה במחיקת זמינות');
    }
  }

  // Navigation handlers
  function handlePrevious() {
    if (currentView === 'month') {
      setCurrentDate(prev => addMonths(prev, -1));
    } else if (currentView === 'week') {
      setCurrentDate(prev => addDays(prev, -7));
    } else {
      setCurrentDate(prev => addDays(prev, -1));
    }
  }

  function handleNext() {
    if (currentView === 'month') {
      setCurrentDate(prev => addMonths(prev, 1));
    } else if (currentView === 'week') {
      setCurrentDate(prev => addDays(prev, 7));
    } else {
      setCurrentDate(prev => addDays(prev, 1));
    }
  }

  function handleToday() {
    setCurrentDate(new Date());
  }

  // Handle slot click from visual calendar
  function handleSlotClick(slot) {
    setEditingSlot(slot);
  }

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>טוען...</div>;
  }

  const businessServices = services.filter(s => s.businessId === Number(slotForm.businessId));

  return (
    <div>
      {/* Message Toast */}
      {message && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 1000
        }}>
          {message}
        </div>
      )}

      {/* Slot Creation Form */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h3 className="card-title">פתח זמינות חדשה</h3>
          <p className="card-description">צור זמינות חדשה עם בחירת שירותים מרובים</p>
        </div>
        <div className="card-body">
          <SlotForm
            slotForm={slotForm}
            setSlotForm={setSlotForm}
            businesses={business ? [business] : []}
            services={businessServices}
            onSubmit={createSlot}
            showMessage={showMessage}
            showBusinessSelect={false}
          />
        </div>
      </div>

      {/* Calendar with Shell */}
      <CalendarShell
        currentDate={currentDate}
        currentView={currentView}
        availableViews={['day', 'week', 'month']}
        onViewChange={setCurrentView}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onToday={handleToday}
      >
        {currentView === 'day' && (
          <CalendarDayView
            slots={slots}
            currentDate={currentDate}
            onSlotClick={handleSlotClick}
          />
        )}
        {currentView === 'week' && (
          <div style={{
            padding: 'var(--space-4)',
            textAlign: 'center',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--text-secondary)'
          }}>
            תצוגת שבוע - בפיתוח
          </div>
        )}
        {currentView === 'month' && (
          <div style={{
            padding: 'var(--space-4)',
            textAlign: 'center',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--text-secondary)'
          }}>
            תצוגת חודש - בפיתוח
          </div>
        )}
      </CalendarShell>

      {/* Edit Modal (if needed) */}
      {editingSlot && (() => {
        const activeBookings = getActiveBookings(editingSlot);
        const hasActiveBookings = activeBookings.length > 0;

        return (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div className="card" style={{ maxWidth: '600px', width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
              <div className="card-header">
                <h3 className="card-title">עריכת זמינות</h3>
                <button onClick={() => setEditingSlot(null)} className="btn-ghost">✕</button>
              </div>

              {/* Warning Banner */}
              {hasActiveBookings && (
                <div style={{
                  background: '#FEF3C7',
                  border: '1px solid #FCD34D',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-3)',
                  margin: 'var(--space-4)',
                  color: '#92400E'
                }}>
                  <strong>⚠️ זמינות עם הזמנות פעילות</strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>
                    קיימות {activeBookings.length} הזמנות פעילות. ניתן לערוך רק את ההערה.
                  </p>
                </div>
              )}

              <div className="card-body">
                <SlotForm
                  slotForm={editingSlot}
                  setSlotForm={setEditingSlot}
                  businesses={business ? [business] : []}
                  services={services.filter(s => s.businessId === editingSlot.businessId)}
                  onSubmit={updateSlot}
                  showMessage={showMessage}
                  isEditing={true}
                  hasActiveBookings={hasActiveBookings}
                  showBusinessSelect={false}
                />
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
