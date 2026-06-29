import React from 'react';
import { api } from '../../../api';

/**
 * ServicesTab - Service management (create, list, edit, delete)
 */
function ServicesTab({
  businesses,
  services,
  serviceForm,
  setServiceForm,
  editingService,
  setEditingService,
  showMessage,
  reload
}) {
  async function createService(e) {
    e.preventDefault();

    try {
      await api('/services', {
        method: 'POST',
        body: JSON.stringify(serviceForm)
      });
      showMessage('השירות נוצר');
      await reload();
    } catch (err) {
      showMessage(err.message);
    }
  }

  async function updateService(e) {
    e.preventDefault();

    try {
      await api(`/services/${editingService.id}`, {
        method: 'PATCH',
        body: JSON.stringify(editingService)
      });
      showMessage('השירות עודכן');
      setEditingService(null);
      await reload();
    } catch (err) {
      showMessage(err.message);
    }
  }

  async function deleteService(id) {
    if (!confirm('למחוק שירות זה?')) return;

    try {
      await api(`/services/${id}`, { method: 'DELETE' });
      showMessage('השירות נמחק');
      await reload();
    } catch (err) {
      showMessage(err.message);
    }
  }

  return (
    <div>
      <div className="card mb-8">
        <div className="card-header">
          <h3 className="card-title">הוספת שירות חדש</h3>
          <p className="card-description">הגדר את השירותים שהעסק שלך מציע</p>
        </div>
        <form onSubmit={createService}>
          <div className="form-group">
            <label className="form-label">עסק *</label>
            <select
              value={serviceForm.businessId}
              onChange={e => setServiceForm({ ...serviceForm, businessId: Number(e.target.value) })}
              required
            >
              <option value="">בחר עסק</option>
              {businesses.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">שם השירות *</label>
            <input
              placeholder="לדוגמה: תספורת גברים"
              value={serviceForm.name}
              onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">משך (דקות) *</label>
              <input
                type="number"
                placeholder="60"
                value={serviceForm.durationMinutes}
                onChange={e => setServiceForm({ ...serviceForm, durationMinutes: Number(e.target.value) })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">מחיר רגיל *</label>
              <input
                type="number"
                placeholder="250"
                value={serviceForm.regularPrice}
                onChange={e => setServiceForm({ ...serviceForm, regularPrice: Number(e.target.value) })}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">תיאור (אופציונלי)</label>
            <textarea
              placeholder="תיאור השירות..."
              value={serviceForm.description}
              onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })}
            />
          </div>
          <button className="btn-primary">💾 שמור שירות</button>
        </form>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">השירותים שלי ({services.length})</h3>
          <p className="card-description">ניהול השירותים הקיימים</p>
        </div>
        {services.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🛎️</div>
            <div className="empty-state-title">אין שירותים עדיין</div>
            <div className="empty-state-description">
              צור את השירות הראשון שלך כדי להתחיל לקבל הזמנות
            </div>
          </div>
        )}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>שם השירות</th>
                <th>משך</th>
                <th>מחיר</th>
                <th>סטטוס</th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {services.map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 'var(--font-semibold)' }}>{s.name}</td>
                  <td>{s.durationMinutes} דקות</td>
                  <td>₪{s.regularPrice}</td>
                  <td>
                    <span className={`badge ${s.active ? 'badge-success' : 'badge-gray'}`}>
                      {s.active ? '✓ פעיל' : '○ לא פעיל'}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn-sm btn-secondary" onClick={() => setEditingService(s)}>
                        ✏️ ערוך
                      </button>
                      <button className="btn-sm btn-danger" onClick={() => deleteService(s.id)}>
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

      {editingService && (
        <div className="modal-backdrop" onClick={() => setEditingService(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setEditingService(null)}>✕</button>
            <h3>עריכת שירות</h3>
            <form className="form" onSubmit={updateService}>
              <input
                placeholder="שם השירות"
                value={editingService.name}
                onChange={e => setEditingService({ ...editingService, name: e.target.value })}
                required
              />
              <input
                type="number"
                placeholder="משך (דקות)"
                value={editingService.durationMinutes}
                onChange={e => setEditingService({ ...editingService, durationMinutes: Number(e.target.value) })}
                required
              />
              <input
                type="number"
                placeholder="מחיר רגיל"
                value={editingService.regularPrice}
                onChange={e => setEditingService({ ...editingService, regularPrice: Number(e.target.value) })}
                required
              />
              <textarea
                placeholder="תיאור"
                value={editingService.description || ''}
                onChange={e => setEditingService({ ...editingService, description: e.target.value })}
              />
              <label>
                <input
                  type="checkbox"
                  checked={editingService.active}
                  onChange={e => setEditingService({ ...editingService, active: e.target.checked })}
                />
                פעיל
              </label>
              <button className="primary">שמור</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ServicesTab;
