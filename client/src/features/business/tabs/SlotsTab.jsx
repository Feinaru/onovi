import React from 'react';
import { api } from '../../../api';

/**
 * SlotsTab - Slot management (create, list, edit, delete)
 */
function SlotsTab({
  businesses,
  services,
  slots,
  slotForm,
  setSlotForm,
  editingSlot,
  setEditingSlot,
  showMessage,
  reload
}) {
  async function createSlot(e) {
    e.preventDefault();

    try {
      await api('/slots', {
        method: 'POST',
        body: JSON.stringify(slotForm)
      });
      showMessage('התור פורסם');
      await reload();
    } catch (err) {
      showMessage(err.message);
    }
  }

  async function updateSlot(e) {
    e.preventDefault();

    try {
      await api(`/slots/${editingSlot.id}`, {
        method: 'PATCH',
        body: JSON.stringify(editingSlot)
      });
      showMessage('התור עודכן');
      setEditingSlot(null);
      await reload();
    } catch (err) {
      showMessage(err.message);
    }
  }

  async function deleteSlot(id) {
    if (!confirm('למחוק תור זה?')) return;

    try {
      await api(`/slots/${id}`, { method: 'DELETE' });
      showMessage('התור נמחק');
      await reload();
    } catch (err) {
      showMessage(err.message);
    }
  }

  return (
    <div>
      <div className="card mb-8">
        <div className="card-header">
          <h3 className="card-title">פרסום תור פנוי</h3>
          <p className="card-description">פרסם תורים פנויים כדי למלא את היומן שלך</p>
        </div>
        <form onSubmit={createSlot}>
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
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">התורים שלי ({slots.length})</h3>
          <p className="card-description">ניהול התורים הפנויים והתפוסים</p>
        </div>
        {slots.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <div className="empty-state-title">אין תורים פנויים</div>
            <div className="empty-state-description">
              פרסם את התור הראשון שלך כדי להתחיל לקבל הזמנות
            </div>
          </div>
        )}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>שירות</th>
                <th>תאריך</th>
                <th>שעה</th>
                <th>מחיר</th>
                <th>סטטוס</th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {slots.map(sl => (
                <tr key={sl.id}>
                  <td style={{ fontWeight: 'var(--font-semibold)' }}>
                    {sl.service?.name || 'שירות'}
                  </td>
                  <td>{sl.date}</td>
                  <td>{sl.startTime}-{sl.endTime}</td>
                  <td>
                    {sl.dealPrice && sl.dealPrice < sl.regularPrice ? (
                      <span>
                        <span style={{ color: 'var(--primary-600)', fontWeight: 'var(--font-bold)' }}>
                          ₪{sl.dealPrice}
                        </span>
                        {' '}
                        <span style={{
                          textDecoration: 'line-through',
                          color: 'var(--text-tertiary)',
                          fontSize: 'var(--text-sm)'
                        }}>
                          ₪{sl.regularPrice}
                        </span>
                      </span>
                    ) : (
                      <span>₪{sl.regularPrice}</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${
                      sl.status === 'OPEN' ? 'badge-success' :
                      sl.status === 'BOOKED' ? 'badge-primary' :
                      'badge-gray'
                    }`}>
                      {sl.status === 'OPEN' ? '✓ פתוח' :
                       sl.status === 'BOOKED' ? '📋 מוזמן' :
                       sl.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn-sm btn-secondary" onClick={() => setEditingSlot(sl)}>
                        ✏️ ערוך
                      </button>
                      <button className="btn-sm btn-danger" onClick={() => deleteSlot(sl.id)}>
                        🗑️ מחק
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingSlot && (
        <div className="modal-backdrop" onClick={() => setEditingSlot(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setEditingSlot(null)}>✕</button>
            <h3>עריכת תור</h3>
            <form className="form" onSubmit={updateSlot}>
              <input
                type="date"
                value={editingSlot.date}
                onChange={e => setEditingSlot({ ...editingSlot, date: e.target.value })}
                required
              />
              <input
                placeholder="שעת התחלה"
                value={editingSlot.startTime}
                onChange={e => setEditingSlot({ ...editingSlot, startTime: e.target.value })}
                required
              />
              <input
                placeholder="שעת סיום"
                value={editingSlot.endTime}
                onChange={e => setEditingSlot({ ...editingSlot, endTime: e.target.value })}
                required
              />
              <input
                type="number"
                placeholder="מחיר רגיל"
                value={editingSlot.regularPrice}
                onChange={e => setEditingSlot({ ...editingSlot, regularPrice: Number(e.target.value) })}
                required
              />
              <input
                type="number"
                placeholder="מחיר דיל"
                value={editingSlot.dealPrice || ''}
                onChange={e => setEditingSlot({ ...editingSlot, dealPrice: e.target.value ? Number(e.target.value) : null })}
              />
              <button className="primary">שמור</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SlotsTab;
