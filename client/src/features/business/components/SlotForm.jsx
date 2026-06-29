import React from 'react';

/**
 * SlotForm - Create new slot form
 */
function SlotForm({ businesses, services, slotForm, setSlotForm, onSubmit }) {
  return (
    <form onSubmit={onSubmit}>
      <div className="grid grid-2">
        <div className="form-group">
          <label className="form-label">עסק *</label>
          <select
            value={slotForm.businessId}
            onChange={e => setSlotForm({ ...slotForm, businessId: Number(e.target.value) })}
            required
          >
            <option value="">בחר עסק</option>
            {businesses.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">שירות *</label>
          <select
            value={slotForm.serviceId}
            onChange={e => setSlotForm({ ...slotForm, serviceId: Number(e.target.value) })}
            required
          >
            <option value="">בחר שירות</option>
            {services.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-3">
        <div className="form-group">
          <label className="form-label">תאריך *</label>
          <input
            type="date"
            value={slotForm.date}
            onChange={e => setSlotForm({ ...slotForm, date: e.target.value })}
            required
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
          />
        </div>
        <div className="form-group">
          <label className="form-label">מחיר מבצע (אופציונלי)</label>
          <input
            type="number"
            placeholder="190"
            value={slotForm.dealPrice}
            onChange={e => setSlotForm({ ...slotForm, dealPrice: Number(e.target.value) })}
          />
        </div>
      </div>
      <button className="btn-primary">📅 פרסם תור</button>
    </form>
  );
}

export default SlotForm;
