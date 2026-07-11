import React, { useState } from 'react';
import { api } from '../../../api';

/**
 * BusinessSearchCard - Search v2 business card with grouped services
 *
 * Shows one card per business with available services.
 * Customer selects service → date → time → books
 */
function BusinessSearchCard({ businessCard, setView, user }) {
  const [expandedServices, setExpandedServices] = useState(new Set());
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    customerName: user?.fullName || '',
    customerPhone: user?.phone || '',
    customerEmail: user?.email || '',
    customerNote: ''
  });

  const { business, services } = businessCard;

  const handleServiceExpand = (serviceId) => {
    const newExpanded = new Set(expandedServices);
    if (newExpanded.has(serviceId)) {
      newExpanded.delete(serviceId);
    } else {
      newExpanded.add(serviceId);
    }
    setExpandedServices(newExpanded);

    // Reset selection when collapsing
    if (!newExpanded.has(serviceId)) {
      if (selectedService?.businessServiceId === serviceId) {
        setSelectedService(null);
        setSelectedDate(null);
        setSelectedTime(null);
      }
    }
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setSelectedDate(null);
    setSelectedTime(null);
    setExpandedServices(new Set([service.businessServiceId]));
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleTimeSelect = (timeInfo) => {
    setSelectedTime(timeInfo);
  };

  const handleBooking = async () => {
    if (!selectedService || !selectedDate || !selectedTime) {
      alert('אנא בחר שירות, תאריך ושעה');
      return;
    }

    if (!user) {
      alert('אנא התחבר כדי להזמין תור');
      setView('auth');
      return;
    }

    setSubmitting(true);

    try {
      const booking = await api('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          slotId: selectedTime.slotId,
          businessServiceId: selectedService.businessServiceId,
          startTime: selectedTime.startTime,
          ...bookingForm
        })
      });

      if (booking?.id && setView) {
        setView({ view: 'booking-details', bookingId: booking.id });
      } else {
        setView('my-bookings');
      }
    } catch (err) {
      console.error('Booking failed:', err);
      if (err.message?.includes('401')) {
        alert('יש להתחבר כדי להזמין תור');
        setView('auth');
      } else if (err.message?.includes('409')) {
        alert('הזמן שבחרת כבר תפוס. אנא בחר זמן אחר.');
        setSelectedTime(null);
      } else {
        alert(err.message || 'שגיאה בהזמנת התור. אנא נסה שנית.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const displayAddress = business.formattedAddress ||
    [business.cityNameHebrew || business.city].filter(Boolean).join(', ');

  const visibleServices = services.slice(0, 3);
  const hiddenServices = services.slice(3);

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '16px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      {/* Business Header */}
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{
          fontSize: '20px',
          fontWeight: '600',
          marginBottom: '8px',
          color: '#111827'
        }}>
          {business.name}
        </h3>

        {displayAddress && (
          <div style={{
            fontSize: '14px',
            color: '#6b7280',
            marginBottom: '4px'
          }}>
            📍 {displayAddress}
          </div>
        )}

        {business.distanceKm !== undefined && business.distanceKm !== null && (
          <div style={{
            fontSize: '13px',
            color: '#3b82f6',
            marginBottom: '4px',
            fontWeight: '500'
          }}>
            {business.distanceKm < 1
              ? `${Math.round(business.distanceKm * 1000)} מ׳ ממך`
              : `${business.distanceKm.toFixed(1)} ק״מ ממך`
            }
          </div>
        )}

        {business.category && (
          <div style={{
            display: 'inline-block',
            padding: '4px 12px',
            background: '#f3f4f6',
            borderRadius: '16px',
            fontSize: '12px',
            color: '#4b5563',
            marginTop: '8px'
          }}>
            {business.category.nameHebrew || business.category.name}
          </div>
        )}
      </div>

      {/* Services */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#4b5563',
          marginBottom: '12px'
        }}>
          שירותים זמינים ({services.length})
        </div>

        {visibleServices.map(service => (
          <div
            key={service.businessServiceId}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '8px',
              background: selectedService?.businessServiceId === service.businessServiceId ? '#eff6ff' : 'white'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer'
              }}
              onClick={() => handleServiceExpand(service.businessServiceId)}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                  {service.name}
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                  {service.durationMinutes} דקות · ₪{service.regularPrice}
                </div>
              </div>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px 8px'
                }}
              >
                {expandedServices.has(service.businessServiceId) ? '▼' : '◀'}
              </button>
            </div>

            {/* Expanded: Dates and Times */}
            {expandedServices.has(service.businessServiceId) && (
              <div style={{ marginTop: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#4b5563' }}>
                  בחר תאריך:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                  {service.availableDates.map(dateInfo => (
                    <button
                      key={dateInfo.date}
                      onClick={() => {
                        handleServiceSelect(service);
                        handleDateSelect(dateInfo.date);
                      }}
                      style={{
                        padding: '6px 12px',
                        border: selectedDate === dateInfo.date ? '2px solid #3b82f6' : '1px solid #d1d5db',
                        borderRadius: '6px',
                        background: selectedDate === dateInfo.date ? '#eff6ff' : 'white',
                        color: selectedDate === dateInfo.date ? '#3b82f6' : '#374151',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: selectedDate === dateInfo.date ? '600' : '400'
                      }}
                    >
                      {new Date(dateInfo.date).toLocaleDateString('he-IL', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </button>
                  ))}
                </div>

                {selectedDate && selectedService?.businessServiceId === service.businessServiceId && (
                  <>
                    <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#4b5563' }}>
                      בחר שעה:
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
                      gap: '6px',
                      marginBottom: '12px'
                    }}>
                      {service.availableDates
                        .find(d => d.date === selectedDate)
                        ?.times.map((timeInfo, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleTimeSelect(timeInfo)}
                            style={{
                              padding: '8px 4px',
                              border: selectedTime?.startTime === timeInfo.startTime ? '2px solid #3b82f6' : '1px solid #d1d5db',
                              borderRadius: '6px',
                              background: selectedTime?.startTime === timeInfo.startTime ? '#3b82f6' : 'white',
                              color: selectedTime?.startTime === timeInfo.startTime ? 'white' : '#374151',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: selectedTime?.startTime === timeInfo.startTime ? '600' : '400'
                            }}
                          >
                            {timeInfo.startTime}
                          </button>
                        ))}
                    </div>

                    {selectedTime && (
                      <button
                        onClick={handleBooking}
                        disabled={submitting}
                        style={{
                          width: '100%',
                          padding: '12px',
                          background: submitting ? '#9ca3af' : '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: submitting ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {submitting ? 'מזמין...' : `הזמן תור ב-${selectedTime.startTime}`}
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ))}

        {hiddenServices.length > 0 && !expandedServices.has('show-more') && (
          <button
            onClick={() => setExpandedServices(new Set([...expandedServices, 'show-more']))}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px dashed #d1d5db',
              borderRadius: '8px',
              background: 'white',
              color: '#6b7280',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            הצג עוד {hiddenServices.length} שירותים
          </button>
        )}

        {expandedServices.has('show-more') && hiddenServices.map(service => (
          <div
            key={service.businessServiceId}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '8px',
              background: selectedService?.businessServiceId === service.businessServiceId ? '#eff6ff' : 'white'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer'
              }}
              onClick={() => handleServiceExpand(service.businessServiceId)}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                  {service.name}
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                  {service.durationMinutes} דקות · ₪{service.regularPrice}
                </div>
              </div>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px 8px'
                }}
              >
                {expandedServices.has(service.businessServiceId) ? '▼' : '◀'}
              </button>
            </div>

            {expandedServices.has(service.businessServiceId) && (
              <div style={{ marginTop: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#4b5563' }}>
                  בחר תאריך:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                  {service.availableDates.map(dateInfo => (
                    <button
                      key={dateInfo.date}
                      onClick={() => {
                        handleServiceSelect(service);
                        handleDateSelect(dateInfo.date);
                      }}
                      style={{
                        padding: '6px 12px',
                        border: selectedDate === dateInfo.date ? '2px solid #3b82f6' : '1px solid #d1d5db',
                        borderRadius: '6px',
                        background: selectedDate === dateInfo.date ? '#eff6ff' : 'white',
                        color: selectedDate === dateInfo.date ? '#3b82f6' : '#374151',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: selectedDate === dateInfo.date ? '600' : '400'
                      }}
                    >
                      {new Date(dateInfo.date).toLocaleDateString('he-IL', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </button>
                  ))}
                </div>

                {selectedDate && selectedService?.businessServiceId === service.businessServiceId && (
                  <>
                    <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#4b5563' }}>
                      בחר שעה:
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
                      gap: '6px',
                      marginBottom: '12px'
                    }}>
                      {service.availableDates
                        .find(d => d.date === selectedDate)
                        ?.times.map((timeInfo, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleTimeSelect(timeInfo)}
                            style={{
                              padding: '8px 4px',
                              border: selectedTime?.startTime === timeInfo.startTime ? '2px solid #3b82f6' : '1px solid #d1d5db',
                              borderRadius: '6px',
                              background: selectedTime?.startTime === timeInfo.startTime ? '#3b82f6' : 'white',
                              color: selectedTime?.startTime === timeInfo.startTime ? 'white' : '#374151',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: selectedTime?.startTime === timeInfo.startTime ? '600' : '400'
                            }}
                          >
                            {timeInfo.startTime}
                          </button>
                        ))}
                    </div>

                    {selectedTime && (
                      <button
                        onClick={handleBooking}
                        disabled={submitting}
                        style={{
                          width: '100%',
                          padding: '12px',
                          background: submitting ? '#9ca3af' : '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: submitting ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {submitting ? 'מזמין...' : `הזמן תור ב-${selectedTime.startTime}`}
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Business Profile Button */}
      <button
        onClick={() => setView({ view: 'business-profile', businessId: business.id })}
        style={{
          width: '100%',
          padding: '10px',
          border: '1px solid #3b82f6',
          borderRadius: '8px',
          background: 'white',
          color: '#3b82f6',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500'
        }}
      >
        צפה בפרופיל העסק
      </button>
    </div>
  );
}

export default BusinessSearchCard;
