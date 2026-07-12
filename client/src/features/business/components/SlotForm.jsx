import React, { useEffect } from 'react';

/**
 * SlotForm - Create new slot form (Sprint B: multi-booking support)
 */
function SlotForm({ businesses, services, slotForm, setSlotForm, onSubmit, hasActiveBookings = false, showBusinessSelect = true }) {
  // Filter services to show only active + visible services for selected business
  const activeServices = services.filter(s =>
    s.businessId === slotForm.businessId && s.active && s.visibleToCustomers
  );

  // Initialize allowedServiceIds with all active services when business changes
  useEffect(() => {
    if (slotForm.businessId && activeServices.length > 0) {
      const allServiceIds = activeServices.map(s => s.id);
      setSlotForm(prev => ({
        ...prev,
        allowedServiceIds: prev.allowedServiceIds?.length > 0 ? prev.allowedServiceIds : allServiceIds
      }));
    }
  }, [slotForm.businessId]);

  // Toggle service in allowedServiceIds
  const toggleService = (serviceId) => {
    const current = slotForm.allowedServiceIds || [];
    if (current.includes(serviceId)) {
      setSlotForm({
        ...slotForm,
        allowedServiceIds: current.filter(id => id !== serviceId)
      });
    } else {
      setSlotForm({
        ...slotForm,
        allowedServiceIds: [...current, serviceId]
      });
    }
  };

  // Select/Deselect all services
  const toggleAllServices = () => {
    const allServiceIds = activeServices.map(s => s.id);
    const current = slotForm.allowedServiceIds || [];
    if (current.length === allServiceIds.length) {
      setSlotForm({ ...slotForm, allowedServiceIds: [] });
    } else {
      setSlotForm({ ...slotForm, allowedServiceIds: allServiceIds });
    }
  };

  return (
    <form onSubmit={onSubmit}>
      {showBusinessSelect && (
        <div className="grid grid-2">
          <div className="form-group">
            <label className="form-label">עסק *</label>
            <select
              value={slotForm.businessId}
              onChange={e => setSlotForm({ ...slotForm, businessId: Number(e.target.value), allowedServiceIds: [] })}
              required
            >
              <option value="">בחר עסק</option>
              {businesses.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {slotForm.businessId && activeServices.length > 0 && (
        <div className="form-group">
          <label className="form-label">שירותים מותרים בתור זה *</label>
          <div style={{ marginBottom: '8px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={toggleAllServices}
              style={{ fontSize: '14px', padding: '6px 12px' }}
            >
              {(slotForm.allowedServiceIds?.length === activeServices.length) ? 'בטל הכל' : 'בחר הכל'}
            </button>
          </div>
          <div style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '12px',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            {activeServices.map(s => (
              <label
                key={s.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  marginBottom: '4px',
                  backgroundColor: (slotForm.allowedServiceIds || []).includes(s.id) ? '#f0f9ff' : 'transparent'
                }}
              >
                <input
                  type="checkbox"
                  checked={(slotForm.allowedServiceIds || []).includes(s.id)}
                  onChange={() => toggleService(s.id)}
                  style={{ marginLeft: '8px' }}
                />
                <span style={{ flex: 1 }}>{s.name}</span>
                <span style={{ fontSize: '12px', color: '#666' }}>
                  {s.durationMinutes} דקות • ₪{s.regularPrice}
                </span>
              </label>
            ))}
          </div>
          {(slotForm.allowedServiceIds?.length || 0) === 0 && (
            <div style={{ color: '#e53e3e', fontSize: '14px', marginTop: '4px' }}>
              חובה לבחור לפחות שירות אחד
            </div>
          )}
        </div>
      )}

      <div className="grid grid-3">
        <div className="form-group">
          <label className="form-label">תאריך *</label>
          <input
            type="date"
            value={slotForm.date}
            onChange={e => setSlotForm({ ...slotForm, date: e.target.value })}
            required
            disabled={hasActiveBookings}
          />
        </div>
        <div className="form-group">
          <label className="form-label">שעת התחלה *</label>
          <input
            type="time"
            placeholder="09:00"
            value={slotForm.startTime}
            onChange={e => setSlotForm({ ...slotForm, startTime: e.target.value })}
            required
            disabled={hasActiveBookings}
          />
        </div>
        <div className="form-group">
          <label className="form-label">שעת סיום *</label>
          <input
            type="time"
            placeholder="10:00"
            value={slotForm.endTime}
            onChange={e => setSlotForm({ ...slotForm, endTime: e.target.value })}
            required
            disabled={hasActiveBookings}
          />
        </div>
      </div>
      <div className="grid grid-2">
        <div className="form-group">
          <label className="form-label">מחיר רגיל *</label>
          <input
            type="number"
            placeholder="250"
            value={slotForm.regularPrice}
            onChange={e => setSlotForm({ ...slotForm, regularPrice: Number(e.target.value) })}
            required
            disabled={hasActiveBookings}
          />
        </div>
        <div className="form-group">
          <label className="form-label">מחיר מבצע (אופציונלי)</label>
          <input
            type="number"
            placeholder="190"
            value={slotForm.dealPrice}
            onChange={e => setSlotForm({ ...slotForm, dealPrice: Number(e.target.value) })}
            disabled={hasActiveBookings}
          />
        </div>
      </div>

      {/* Note field (always editable) */}
      <div className="form-group">
        <label className="form-label">הערה (אופציונלי)</label>
        <textarea
          placeholder="הערות נוספות..."
          value={slotForm.note || ''}
          onChange={e => setSlotForm({ ...slotForm, note: e.target.value })}
          rows={3}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ddd'
          }}
        />
      </div>

      <button className="btn-primary">📅 פרסם תור</button>
    </form>
  );
}

export default SlotForm;
