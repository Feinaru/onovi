import React from 'react';
import { api } from '../../../api';
import SlotForm from '../components/SlotForm';
import SlotCard from '../components/SlotCard';

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
        <SlotForm
          businesses={businesses}
          services={services}
          slotForm={slotForm}
          setSlotForm={setSlotForm}
          onSubmit={createSlot}
        />
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
                <SlotCard
                  key={sl.id}
                  slot={sl}
                  onEdit={setEditingSlot}
                  onDelete={deleteSlot}
                />
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
