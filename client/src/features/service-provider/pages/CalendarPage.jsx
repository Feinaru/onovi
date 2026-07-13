import { useState, useEffect } from 'react';
import { api } from '../../../api';
import SlotForm from '../../business/components/SlotForm';
import SlotCard from '../../business/components/SlotCard';
import CalendarShell from '../../../shared/calendar/CalendarShell';
import CalendarDayView from '../components/calendar/CalendarDayView';
import CalendarMonthGrid from '../../../shared/calendar/CalendarMonthGrid';
import CalendarEventCard from '../../../shared/calendar/CalendarEventCard';
import { formatDateLocal, addDays, addMonths, formatDateDisplayHebrew, getHebrewDayName } from '../../../shared/calendar/utils/calendarUtils';

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

/**
 * Convert Slot objects to provider calendar events for month/week views
 * Does not mutate slots, does not change Booking.price
 */
function slotsToProviderEvents(slots, onSlotClick) {
  return slots.map(slot => {
    const activeBookings = getActiveBookings(slot);
    const totalBookings = slot.bookings ? slot.bookings.length : 0;

    // Build service names for display
    const serviceNames = slot.allowedServices && slot.allowedServices.length > 0
      ? slot.allowedServices.map(s => s.name).join(', ')
      : 'שירותים';

    return {
      id: slot.id,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      title: `${slot.startTime} - ${slot.endTime}`,
      subtitle: serviceNames,
      status: slot.status,
      bookingCount: totalBookings,
      activeBookingCount: activeBookings.length,
      hasActiveBookings: activeBookings.length > 0,
      sourceSlot: slot,
      onClick: () => onSlotClick(slot)
    };
  });
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
  const [viewingSlot, setViewingSlot] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

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
        showMessage('הזמינות נוצרה');
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
        showMessage(result.error || 'שגיאה ביצירת זמינות');
      }
    } catch (err) {
      showMessage(err.message || 'שגיאה ביצירת זמינות');
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
        showMessage('הזמינות עודכנה');
        setEditingSlot(null);
        await loadData();
      } else {
        showMessage(result.error || 'שגיאה בעדכון זמינות');
      }
    } catch (err) {
      showMessage(err.message || 'שגיאה בעדכון זמינות');
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
    setViewingSlot(slot);
  }

  // Handle date click from month view
  function handleDateClick(date) {
    setSelectedDate(date);
    setCurrentView('day');
    setCurrentDate(date);
  }

  // Convert slots to provider calendar events
  const providerEvents = slotsToProviderEvents(slots, handleSlotClick);

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
        {currentView === 'week' && (() => {
          // Calculate week start (Sunday)
          const weekStart = new Date(currentDate);
          weekStart.setDate(currentDate.getDate() - currentDate.getDay());

          const weekDays = Array.from({ length: 7 }, (_, i) => {
            const day = new Date(weekStart);
            day.setDate(weekStart.getDate() + i);
            return day;
          });

          return (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 'var(--space-2)',
              marginTop: 'var(--space-4)'
            }}>
              {weekDays.map(day => {
                const dayStr = formatDateLocal(day);
                const daySlots = slots.filter(s => s.date === dayStr);
                const isToday = formatDateLocal(new Date()) === dayStr;

                return (
                  <div
                    key={dayStr}
                    style={{
                      background: 'var(--bg-primary)',
                      borderRadius: 'var(--radius-lg)',
                      border: isToday ? '2px solid var(--primary-color)' : '1px solid var(--border-subtle)',
                      padding: 'var(--space-3)',
                      minHeight: '200px'
                    }}
                  >
                    <div style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: 'var(--font-semibold)',
                      marginBottom: 'var(--space-2)',
                      color: isToday ? 'var(--primary-color)' : 'var(--text-primary)'
                    }}>
                      {getHebrewDayName(day)}
                    </div>
                    <div style={{
                      fontSize: 'var(--text-2xl)',
                      fontWeight: 'var(--font-bold)',
                      marginBottom: 'var(--space-3)',
                      color: isToday ? 'var(--primary-color)' : 'var(--text-primary)'
                    }}>
                      {day.getDate()}
                    </div>

                    {daySlots.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {daySlots.map(slot => {
                          const activeBookings = getActiveBookings(slot);
                          const totalBookings = slot.bookings ? slot.bookings.length : 0;

                          return (
                            <div
                              key={slot.id}
                              onClick={() => handleSlotClick(slot)}
                              style={{
                                padding: 'var(--space-2)',
                                background: 'var(--bg-secondary)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-subtle)',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontSize: 'var(--text-xs)'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'var(--bg-tertiary)';
                                e.currentTarget.style.transform = 'scale(1.02)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'var(--bg-secondary)';
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                            >
                              <div style={{ fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-1)' }}>
                                {slot.startTime} - {slot.endTime}
                              </div>
                              {totalBookings > 0 && (
                                <div style={{
                                  fontSize: '10px',
                                  color: activeBookings.length > 0 ? 'var(--primary-color)' : 'var(--text-secondary)'
                                }}>
                                  {totalBookings === 1 ? 'הזמנה אחת' : `${totalBookings} הזמנות`}
                                  {activeBookings.length > 0 && ` (${activeBookings.length} פעילות)`}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-secondary)',
                        textAlign: 'center',
                        padding: 'var(--space-2)'
                      }}>
                        אין זמינויות
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}
        {currentView === 'month' && (
          <div>
            <CalendarMonthGrid
              currentMonth={currentDate}
              events={providerEvents}
              selectedDate={selectedDate}
              onDateClick={handleDateClick}
            />

            {slots.length === 0 && (
              <div style={{
                marginTop: 'var(--space-4)',
                padding: 'var(--space-6)',
                textAlign: 'center',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                color: 'var(--text-secondary)'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: 'var(--space-2)' }}>📅</div>
                <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-medium)' }}>
                  אין זמינויות בחודש זה
                </div>
              </div>
            )}
          </div>
        )}
      </CalendarShell>

      {/* Availability Details Modal */}
      {viewingSlot && (() => {
        const activeBookings = getActiveBookings(viewingSlot);
        const hasActiveBookings = activeBookings.length > 0;
        const totalBookings = viewingSlot.bookings ? viewingSlot.bookings.length : 0;

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
                <h3 className="card-title">פרטי זמינות</h3>
                <button onClick={() => setViewingSlot(null)} className="btn-ghost">✕</button>
              </div>

              <div className="card-body">
                {/* Date and Time */}
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>
                    תאריך ושעה
                  </div>
                  <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>
                    {viewingSlot.date}
                  </div>
                  <div style={{ fontSize: 'var(--text-base)', marginTop: 'var(--space-1)' }}>
                    {viewingSlot.startTime} - {viewingSlot.endTime}
                  </div>
                </div>

                {/* Status */}
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>
                    סטטוס
                  </div>
                  <div>
                    {viewingSlot.status === 'OPEN' && <span style={{ color: '#10b981', fontWeight: 'var(--font-semibold)' }}>פנוי</span>}
                    {viewingSlot.status === 'FULL' && <span style={{ color: '#f59e0b', fontWeight: 'var(--font-semibold)' }}>מלא</span>}
                    {viewingSlot.status === 'CANCELLED' && <span style={{ color: '#6b7280', fontWeight: 'var(--font-semibold)' }}>בוטל</span>}
                  </div>
                </div>

                {/* Services */}
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>
                    שירותים
                  </div>
                  {viewingSlot.allowedServices && viewingSlot.allowedServices.length > 0 ? (
                    <ul style={{ margin: 0, paddingRight: 'var(--space-4)' }}>
                      {viewingSlot.allowedServices.map((service, idx) => (
                        <li key={idx}>{service.name}</li>
                      ))}
                    </ul>
                  ) : (
                    <div style={{ color: 'var(--text-secondary)' }}>לא הוגדרו שירותים לזמינות זו</div>
                  )}
                </div>

                {/* Pricing */}
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>
                    מחיר
                  </div>
                  <div>
                    <span>מחיר רגיל: ₪{viewingSlot.regularPrice}</span>
                    {viewingSlot.dealPrice && (
                      <span style={{ marginRight: 'var(--space-3)', color: '#10b981' }}>
                        מחיר מבצע: ₪{viewingSlot.dealPrice}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bookings */}
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>
                    הזמנות
                  </div>
                  <div>
                    <div>סה"כ הזמנות: {totalBookings}</div>
                    {hasActiveBookings && (
                      <div style={{ color: 'var(--primary-color)', fontWeight: 'var(--font-semibold)' }}>
                        הזמנות פעילות: {activeBookings.length}
                      </div>
                    )}
                  </div>
                </div>

                {/* Note */}
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>
                    הערות
                  </div>
                  <div style={{ color: viewingSlot.note ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {viewingSlot.note || 'אין הערות'}
                  </div>
                </div>

                {/* Warning Banner */}
                {hasActiveBookings && (
                  <div style={{
                    background: '#FEF3C7',
                    border: '1px solid #FCD34D',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-3)',
                    marginBottom: 'var(--space-4)',
                    color: '#92400E'
                  }}>
                    <strong>⚠️ קיימות {activeBookings.length} הזמנות פעילות בזמינות זו.</strong>
                    <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>
                      עריכת תאריך, שעה ומחיר חסומה. ניתן לערוך הערות בלבד.
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{
                padding: 'var(--space-4)',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                gap: 'var(--space-2)',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      setEditingSlot(viewingSlot);
                      setViewingSlot(null);
                    }}
                  >
                    {hasActiveBookings ? 'ערוך זמינות מוגבלת' : 'ערוך זמינות'}
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => setViewingSlot(null)}
                  >
                    סגור
                  </button>
                </div>
                {!hasActiveBookings && (
                  <button
                    className="btn-danger"
                    onClick={() => {
                      deleteSlot(viewingSlot.id);
                      setViewingSlot(null);
                    }}
                  >
                    מחק זמינות
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

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
