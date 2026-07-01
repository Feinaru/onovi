import React, { useState } from 'react';
import useCalendarData from './hooks/useCalendarData';
import CalendarHeader from './components/CalendarHeader';
import DayView from './components/DayView';
import KPIBar from './components/KPIBar';
import EventDetailsModal from './components/EventDetailsModal';
import CreateEditEventModal from './components/CreateEditEventModal';
import { api } from '../../../api';
import './CalendarPage.css';

/**
 * Format date to YYYY-MM-DD in local timezone (avoiding UTC conversion)
 */
function formatDateLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * CalendarPage - Main calendar workspace for business owners
 */
function CalendarPage({ businesses }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('day'); // Only 'day' implemented for now
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [creatingEventType, setCreatingEventType] = useState(null);
  const [createInitialData, setCreateInitialData] = useState(null);
  const [showHeatMap, setShowHeatMap] = useState(false);

  // Get current user's business
  const businessId = businesses && businesses.length > 0 ? businesses[0].id : 1;

  // For day view, use same date for from/to (use local timezone, not UTC)
  const dateStr = formatDateLocal(currentDate);
  const { events, vacations, metrics, heatMap, loading, error, refetch } = useCalendarData(businessId, dateStr, dateStr);

  function handlePreviousPeriod() {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  }

  function handleNextPeriod() {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  }

  function handleToday() {
    setCurrentDate(new Date());
  }

  function handleEventClick(event) {
    setSelectedEvent(event);
  }

  function handleCloseDetailsModal() {
    setSelectedEvent(null);
  }

  function handleCloseCreateEditModal() {
    setEditingEvent(null);
    setCreatingEventType(null);
    setCreateInitialData(null);
  }

  function handleEventUpdated() {
    refetch();
    handleCloseDetailsModal();
    handleCloseCreateEditModal();
  }

  function handleCreateEvent(eventType, data) {
    setCreatingEventType(eventType);
    setCreateInitialData(data);
  }

  function handleCreateSlot(data) {
    setCreatingEventType('SLOT');
    setCreateInitialData(data);
  }

  function handleEditEvent(event) {
    handleCloseDetailsModal();
    setEditingEvent(event);
  }

  async function handleDeleteEvent(event) {
    // Handled by EventDetailsModal
  }

  async function handleToggleSlotStatus(event) {
    // Handled by EventDetailsModal
  }

  async function handleCancelBooking(event) {
    // Handled by EventDetailsModal
  }

  function getEventTypeLabel(eventType) {
    const labels = {
      SLOT: 'חלון זמן פנוי',
      BOOKING: 'תור Onovi',
      CALENDAR_EVENT: 'אירוע ביומן',
      TIME_BLOCK: 'חסימת זמן',
      VACATION: 'חופשה'
    };
    return labels[eventType] || 'אירוע';
  }

  return (
    <div className="calendar-page">
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        onViewChange={setView}
        onPrevious={handlePreviousPeriod}
        onNext={handleNextPeriod}
        onToday={handleToday}
        onCreateEvent={handleCreateEvent}
        showHeatMap={showHeatMap}
        onToggleHeatMap={() => setShowHeatMap(!showHeatMap)}
      />

      <KPIBar metrics={metrics} />

      <div className="calendar-page-content">
        {loading ? (
          <div className="calendar-loading">טוען לוח שנה...</div>
        ) : error ? (
          <div className="calendar-error">שגיאה בטעינת הלוח שנה</div>
        ) : (
          <DayView
            currentDate={currentDate}
            events={events}
            vacations={vacations}
            heatMap={heatMap}
            showHeatMap={showHeatMap}
            onEventClick={handleEventClick}
            onEditEvent={handleEditEvent}
            onDeleteEvent={handleDeleteEvent}
            onToggleSlotStatus={handleToggleSlotStatus}
            onCancelBooking={handleCancelBooking}
            onCreateSlot={handleCreateSlot}
            onCreateCalendarEvent={(data) => handleCreateEvent('CALENDAR_EVENT', data)}
            onCreateTimeBlock={(data) => handleCreateEvent('TIME_BLOCK', data)}
          />
        )}
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          businessId={businessId}
          onClose={handleCloseDetailsModal}
          onEventUpdated={handleEventUpdated}
          onEdit={handleEditEvent}
          onDelete={handleDeleteEvent}
        />
      )}

      {/* Create/Edit Modal */}
      {(creatingEventType || editingEvent) && (
        <CreateEditEventModal
          eventType={creatingEventType || editingEvent?.eventType}
          event={editingEvent}
          initialData={createInitialData}
          businessId={businessId}
          onClose={handleCloseCreateEditModal}
          onSuccess={handleEventUpdated}
        />
      )}
    </div>
  );
}

export default CalendarPage;
