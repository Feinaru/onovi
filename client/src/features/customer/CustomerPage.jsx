import React, { useState } from 'react';
import LocationHeader from './location/LocationHeader';
import SearchFilters from './search/SearchFilters';
import SearchResults from './search/SearchResults';
import BookingDialog from './booking/BookingDialog';
import { useSearchData } from './search/hooks/useSearchData';
import { useBooking } from './booking/hooks/useBooking';

/**
 * CustomerPage - Main customer view orchestrator
 */
export default function CustomerPage({ user, setView }) {
  const [userLocation, setUserLocation] = useState(null);

  const {
    slots,
    categories,
    filters,
    setFilters,
    filteredSlots,
    load,
    resetFilters,
    hasActiveFilters
  } = useSearchData();

  const {
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
  } = useBooking(user);

  const handleQuickBook = () => {
    const searchSection = document.querySelector('.customer-search-section');
    if (searchSection) {
      searchSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleLocationSelect = (location) => {
    setUserLocation(location);
    const locationCity = location?.city || location?.cityNameHebrew;
    if (locationCity && locationCity !== 'המיקום שלי') {
      setFilters(prev => ({ ...prev, city: locationCity }));
    }
  };

  const handleSlotSelect = (slot) => {
    setSelected(slot);
    setBookingStep(1);
  };

  const handleBookingSubmit = (e) => {
    submitBooking(e, load);
  };

  return (
    <div className="customer-page">
      <LocationHeader
        userLocation={userLocation}
        onLocationSelect={handleLocationSelect}
        categories={categories}
        onQuickBook={handleQuickBook}
      />

      <SearchFilters
        categories={categories}
        filters={filters}
        setFilters={setFilters}
        onSearch={load}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={resetFilters}
      />

      <SearchResults
        filteredSlots={filteredSlots}
        allSlots={slots}
        filters={filters}
        onSlotSelect={handleSlotSelect}
        onResetFilters={resetFilters}
        user={user}
        setView={setView}
      />

      {selected && (
        <BookingDialog
          slot={selected}
          bookingStep={bookingStep}
          setBookingStep={setBookingStep}
          bookingForm={bookingForm}
          setBookingForm={setBookingForm}
          onSubmit={handleBookingSubmit}
          onCancel={cancelBooking}
          status={status}
          showSuccess={showSuccess}
        />
      )}

      {status && !selected && (
        <div className={`toast ${status.includes('✓') ? 'toast-success' : 'toast-error'}`}>
          {status}
        </div>
      )}
    </div>
  );
}
