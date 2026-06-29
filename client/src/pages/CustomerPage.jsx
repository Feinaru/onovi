import { useEffect, useState, useMemo } from 'react';
import { api } from '../api';
import LiveAvailability from '../components/LiveAvailability';
import LocationSelector from '../components/LocationSelector';
import AddressSearchFilter from '../components/AddressSearchFilter';
import ErrorBoundary from '../components/ErrorBoundary';

export default function CustomerPage({ user, setView }) {
  const [slots, setSlots] = useState([]);
  const [categories, setCategories] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [filters, setFilters] = useState({
    categoryId: '',
    city: '',
    street: '',
    houseNumber: '',
    searchLocation: null, // Full address object from AddressSearchFilter
    date: '',
    timeOfDay: '', // בוקר, צהריים, ערב
    minPrice: '',
    maxPrice: '',
    onlyDiscounted: false
  });
  const [selected, setSelected] = useState(null);
  const [bookingStep, setBookingStep] = useState(1); // 1, 2, 3
  const [bookingForm, setBookingForm] = useState({
    customerName: user?.fullName || '',
    customerPhone: user?.phone || '',
    customerNote: ''
  });
  const [status, setStatus] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

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

  useEffect(() => {
    setBookingForm(f => ({
      ...f,
      customerName: user?.fullName || f.customerName,
      customerPhone: user?.phone || f.customerPhone
    }));
  }, [user]);

  async function book(e) {
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
        load();
      }, 3000);
    } catch (err) {
      setStatus(err.message);
      setTimeout(() => setStatus(''), 3000);
    }
  }

  const calculateDiscount = (regular, deal) => {
    if (!deal) return 0;
    return Math.round(((regular - deal) / regular) * 100);
  };

  const calculateSavings = (regular, deal) => {
    if (!deal) return 0;
    return regular - deal;
  };

  const getUrgencyBadge = (dateStr) => {
    const slotDate = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    nextWeek.setHours(0, 0, 0, 0);
    slotDate.setHours(0, 0, 0, 0);

    if (slotDate.getTime() === today.getTime()) return { text: 'היום', color: 'danger' };
    if (slotDate.getTime() === tomorrow.getTime()) return { text: 'מחר', color: 'warning' };
    if (slotDate <= nextWeek) return { text: 'השבוע', color: 'accent' };
    return null;
  };

  const getTimeOfDay = (time) => {
    const hour = parseInt(time.split(':')[0]);
    if (hour >= 6 && hour < 12) return 'בוקר';
    if (hour >= 12 && hour < 17) return 'צהריים';
    return 'ערב';
  };

  // Client-side filtering
  const filteredSlots = useMemo(() => {
    return slots.filter(slot => {
      // Time of day filter
      if (filters.timeOfDay) {
        const slotTimeOfDay = getTimeOfDay(slot.startTime);
        if (slotTimeOfDay !== filters.timeOfDay) return false;
      }

      // Price range filter
      const price = slot.dealPrice || slot.regularPrice;
      if (filters.minPrice && price < parseFloat(filters.minPrice)) return false;
      if (filters.maxPrice && price > parseFloat(filters.maxPrice)) return false;

      // Only discounted filter
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

  const hasActiveFilters = filters.categoryId || filters.city || filters.date || filters.timeOfDay || filters.minPrice || filters.maxPrice || filters.onlyDiscounted;

  const handleQuickBook = () => {
    // Scroll to search section
    const searchSection = document.querySelector('.customer-search-section');
    if (searchSection) {
      searchSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleLocationSelect = (location) => {
    setUserLocation(location);

    // Defensive fallback for city name
    const locationCity = location.city || location.cityNameHebrew;

    // If location has a city, pre-fill the city filter
    if (locationCity && locationCity !== 'המיקום שלי') {
      setFilters(prev => ({ ...prev, city: locationCity }));
    }
  };

  return (
    <div className="customer-page">
      {/* Location Selector */}
      <div className="location-header">
        <LocationSelector
          currentLocation={userLocation}
          onLocationSelect={handleLocationSelect}
        />
      </div>

      {/* Live Availability Section - Only show if location is selected */}
      {userLocation ? (
        <ErrorBoundary onReset={() => setUserLocation(null)}>
          <LiveAvailability
            onQuickBook={handleQuickBook}
            categories={categories}
            userLocation={userLocation}
          />
        </ErrorBoundary>
      ) : (
        <div className="location-prompt-section">
          <div className="location-prompt-card">
            <div className="location-prompt-icon">📍</div>
            <h2 className="location-prompt-title">בחר את המיקום שלך</h2>
            <p className="location-prompt-description">
              כדי לראות תורים זמינים באזור שלך, עלינו לדעת היכן אתה נמצא
            </p>
            <button
              className="btn-primary btn-lg"
              onClick={() => document.querySelector('.location-display-btn').click()}
            >
              📍 בחר מיקום
            </button>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="customer-search-section">
        <div className="search-card">
          {/* Main Filters */}
          <div className="search-main-filters">
            <div className="form-group-inline">
              <label className="form-label-inline">קטגוריה</label>
              <select
                value={filters.categoryId}
                onChange={e => setFilters({ ...filters, categoryId: e.target.value })}
                className="search-input"
              >
                <option value="">כל הקטגוריות</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <AddressSearchFilter
              value={filters.searchLocation}
              onChange={(addressData) => {
                setFilters({
                  ...filters,
                  city: addressData.city || '',
                  street: addressData.street || '',
                  houseNumber: addressData.houseNumber || '',
                  searchLocation: addressData
                });
              }}
            />

            <div className="form-group-inline">
              <label className="form-label-inline">תאריך</label>
              <input
                type="date"
                value={filters.date}
                onChange={e => setFilters({ ...filters, date: e.target.value })}
                className="search-input"
              />
            </div>

            <button className="btn-primary btn-search" onClick={load}>
              <span>🔍</span>
              <span>חפש</span>
            </button>
          </div>

          {/* Advanced Filters */}
          <div className="search-advanced-filters">
            <div className="filter-group">
              <label className="filter-label">זמן ביום</label>
              <div className="filter-chips">
                <button
                  className={`filter-chip ${filters.timeOfDay === 'בוקר' ? 'active' : ''}`}
                  onClick={() => setFilters({ ...filters, timeOfDay: filters.timeOfDay === 'בוקר' ? '' : 'בוקר' })}
                >
                  ☀️ בוקר
                </button>
                <button
                  className={`filter-chip ${filters.timeOfDay === 'צהריים' ? 'active' : ''}`}
                  onClick={() => setFilters({ ...filters, timeOfDay: filters.timeOfDay === 'צהריים' ? '' : 'צהריים' })}
                >
                  🌤️ צהריים
                </button>
                <button
                  className={`filter-chip ${filters.timeOfDay === 'ערב' ? 'active' : ''}`}
                  onClick={() => setFilters({ ...filters, timeOfDay: filters.timeOfDay === 'ערב' ? '' : 'ערב' })}
                >
                  🌙 ערב
                </button>
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">טווח מחירים</label>
              <div className="filter-price-range">
                <input
                  type="number"
                  placeholder="מינימום"
                  value={filters.minPrice}
                  onChange={e => setFilters({ ...filters, minPrice: e.target.value })}
                  className="price-input"
                />
                <span className="price-separator">-</span>
                <input
                  type="number"
                  placeholder="מקסימום"
                  value={filters.maxPrice}
                  onChange={e => setFilters({ ...filters, maxPrice: e.target.value })}
                  className="price-input"
                />
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-toggle">
                <input
                  type="checkbox"
                  checked={filters.onlyDiscounted}
                  onChange={e => setFilters({ ...filters, onlyDiscounted: e.target.checked })}
                />
                <span className="toggle-text">רק תורים מוזלים 🔥</span>
              </label>
            </div>

            {hasActiveFilters && (
              <button className="btn-text" onClick={resetFilters}>
                נקה פילטרים
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="customer-results-section">
        {filteredSlots.length > 0 && (
          <div className="results-header">
            <h2 className="results-title">
              נמצאו {filteredSlots.length} תורים זמינים
            </h2>
            {filters.onlyDiscounted && (
              <div className="results-badge">
                🔥 תורים מוזלים בלבד
              </div>
            )}
          </div>
        )}

        <div className="slots-grid">
          {filteredSlots.map(slot => {
            const discount = calculateDiscount(slot.regularPrice, slot.dealPrice);
            const savings = calculateSavings(slot.regularPrice, slot.dealPrice);
            const hasDeal = slot.dealPrice && slot.dealPrice < slot.regularPrice;
            const urgency = getUrgencyBadge(slot.date);

            return (
              <div className="slot-card-v2" key={slot.id}>
                {/* Badges */}
                <div className="slot-badges">
                  {hasDeal && (
                    <div className="slot-badge slot-badge-discount">
                      🔥 {discount}% הנחה
                    </div>
                  )}
                  {urgency && (
                    <div className={`slot-badge slot-badge-${urgency.color}`}>
                      ⚡ {urgency.text}
                    </div>
                  )}
                </div>

                {/* Business Info */}
                <div className="slot-business-info">
                  <h3 className="slot-business-name">{slot.business.name}</h3>
                  <div className="slot-location">
                    📍 {slot.business.city}
                  </div>
                </div>

                {/* Service Name */}
                <div className="slot-service-name">
                  {slot.service.name}
                </div>

                {/* Details */}
                <div className="slot-details-grid">
                  <div className="slot-detail">
                    <span className="detail-icon">📅</span>
                    <span className="detail-text">{slot.date}</span>
                  </div>
                  <div className="slot-detail">
                    <span className="detail-icon">⏰</span>
                    <span className="detail-text">{slot.startTime}</span>
                  </div>
                  <div className="slot-detail">
                    <span className="detail-icon">⏱️</span>
                    <span className="detail-text">{slot.service.durationMinutes} דקות</span>
                  </div>
                </div>

                {/* Pricing */}
                <div className="slot-pricing">
                  <div className="slot-price-main">
                    ₪{slot.dealPrice || slot.regularPrice}
                  </div>
                  {hasDeal && (
                    <div className="slot-price-details">
                      <span className="slot-price-original">₪{slot.regularPrice}</span>
                      <span className="slot-savings">חוסכים ₪{savings}</span>
                    </div>
                  )}
                </div>

                {/* CTA */}
                <button
                  className="slot-cta-btn"
                  onClick={() => {
                    setSelected(slot);
                    setBookingStep(1);
                  }}
                >
                  הזמן עכשיו
                </button>
              </div>
            );
          })}
        </div>

        {/* Empty States */}
        {filteredSlots.length === 0 && slots.length > 0 && (
          <div className="empty-state-v2">
            <div className="empty-state-icon-v2">🔍</div>
            <h3 className="empty-state-title-v2">לא נמצאו תורים מתאימים</h3>
            <p className="empty-state-description-v2">
              נסה לשנות את הפילטרים או לחפש בתאריך אחר
            </p>
            <button className="btn-primary" onClick={resetFilters}>
              נקה פילטרים
            </button>
          </div>
        )}

        {slots.length === 0 && !filters.categoryId && (
          <div className="empty-state-v2">
            <div className="empty-state-icon-v2">🔍</div>
            <h3 className="empty-state-title-v2">חפש תורים זמינים</h3>
            <p className="empty-state-description-v2">
              בחר קטגוריה, עיר או תאריך כדי למצוא תורים פנויים
            </p>
          </div>
        )}

        {slots.length === 0 && filters.categoryId && (
          <div className="empty-state-v2">
            <div className="empty-state-icon-v2">😔</div>
            <h3 className="empty-state-title-v2">אין תורים זמינים כרגע</h3>
            <p className="empty-state-description-v2">
              נסה לחפש בתאריך אחר או באזור אחר
            </p>
            {!user && (
              <button className="btn-primary" onClick={() => setView('auth')}>
                התחבר כדי לקבל התראות על תורים חדשים
              </button>
            )}
          </div>
        )}

        {filteredSlots.length === 0 && slots.length > 0 && filters.onlyDiscounted && (
          <div className="empty-state-v2">
            <div className="empty-state-icon-v2">💸</div>
            <h3 className="empty-state-title-v2">אין תורים מוזלים כרגע</h3>
            <p className="empty-state-description-v2">
              כל התורים הזמינים במחיר רגיל. נסה לבטל את הפילטר "רק תורים מוזלים"
            </p>
            <button className="btn-secondary" onClick={() => setFilters({ ...filters, onlyDiscounted: false })}>
              הצג את כל התורים
            </button>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {selected && (
        <div className="modal-backdrop-v2" onClick={() => {
          setSelected(null);
          setBookingStep(1);
          setShowSuccess(false);
        }}>
          <div className={`modal-v2 ${showSuccess ? 'modal-success' : ''}`} onClick={e => e.stopPropagation()}>
            {!showSuccess ? (
              <>
                <button className="modal-close-v2" onClick={() => {
                  setSelected(null);
                  setBookingStep(1);
                }}>
                  ✕
                </button>

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

                {/* Step 1: Slot Summary */}
                {bookingStep === 1 && (
                  <div className="booking-step-content">
                    <h2 className="booking-title">סיכום התור</h2>

                    <div className="booking-summary-card">
                      <div className="summary-row">
                        <span className="summary-label">שירות</span>
                        <span className="summary-value">{selected.service.name}</span>
                      </div>
                      <div className="summary-row">
                        <span className="summary-label">עסק</span>
                        <span className="summary-value">{selected.business.name}</span>
                      </div>
                      <div className="summary-row">
                        <span className="summary-label">מיקום</span>
                        <span className="summary-value">📍 {selected.business.city}</span>
                      </div>
                      <div className="summary-row">
                        <span className="summary-label">תאריך</span>
                        <span className="summary-value">📅 {selected.date}</span>
                      </div>
                      <div className="summary-row">
                        <span className="summary-label">שעה</span>
                        <span className="summary-value">⏰ {selected.startTime}</span>
                      </div>
                      <div className="summary-row">
                        <span className="summary-label">משך</span>
                        <span className="summary-value">⏱️ {selected.service.durationMinutes} דקות</span>
                      </div>
                      <div className="summary-row summary-row-highlight">
                        <span className="summary-label">מחיר</span>
                        <span className="summary-value-price">
                          ₪{selected.dealPrice || selected.regularPrice}
                          {selected.dealPrice && selected.dealPrice < selected.regularPrice && (
                            <span className="summary-original-price">₪{selected.regularPrice}</span>
                          )}
                        </span>
                      </div>
                    </div>

                    <button className="btn-primary btn-lg btn-full" onClick={() => setBookingStep(2)}>
                      המשך להזמנה
                    </button>
                  </div>
                )}

                {/* Step 2: Customer Details */}
                {bookingStep === 2 && (
                  <div className="booking-step-content">
                    <h2 className="booking-title">הפרטים שלך</h2>

                    <form onSubmit={book} className="booking-form">
                      <div className="form-group">
                        <label className="form-label">שם מלא *</label>
                        <input
                          placeholder="הזן שם מלא"
                          value={bookingForm.customerName}
                          onChange={e => setBookingForm({ ...bookingForm, customerName: e.target.value })}
                          required
                          className="form-input-large"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">טלפון *</label>
                        <input
                          placeholder="050-1234567"
                          value={bookingForm.customerPhone}
                          onChange={e => setBookingForm({ ...bookingForm, customerPhone: e.target.value })}
                          required
                          className="form-input-large"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">הערה (אופציונלי)</label>
                        <textarea
                          placeholder="הערות לעסק..."
                          value={bookingForm.customerNote}
                          onChange={e => setBookingForm({ ...bookingForm, customerNote: e.target.value })}
                          rows={3}
                          className="form-textarea-large"
                        />
                      </div>

                      <div className="booking-info-box">
                        <div className="info-icon">💡</div>
                        <div className="info-text">
                          העסק יאשר את התור שלך בהקדם האפשרי. תקבל עדכון לטלפון.
                        </div>
                      </div>

                      <div className="booking-actions">
                        <button type="button" className="btn-secondary btn-lg" onClick={() => setBookingStep(1)}>
                          חזור
                        </button>
                        <button type="submit" className="btn-primary btn-lg" style={{ flex: 1 }}>
                          שלח בקשה
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {status && bookingStep === 2 && (
                  <div className="booking-error">
                    {status}
                  </div>
                )}
              </>
            ) : (
              <div className="booking-success-content">
                <div className="success-icon-large">✓</div>
                <h2 className="success-title">בקשת ההזמנה נשלחה!</h2>
                <p className="success-description">
                  העסק יאשר את התור בהקדם האפשרי.<br />
                  תקבל עדכון בטלפון {bookingForm.customerPhone}
                </p>
                <div className="success-details">
                  <div className="success-detail-row">
                    <span>📅</span>
                    <span>{selected.date} בשעה {selected.startTime}</span>
                  </div>
                  <div className="success-detail-row">
                    <span>📍</span>
                    <span>{selected.business.name}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast (legacy support) */}
      {status && !selected && (
        <div className={`toast ${status.includes('✓') ? 'toast-success' : 'toast-error'}`}>
          {status}
        </div>
      )}
    </div>
  );
}
