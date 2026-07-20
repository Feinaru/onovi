import React, { useMemo, useState } from 'react';
import CatalogModal from './CatalogModal';
import { StatusPill, formatPrice, formatDuration } from './catalogUi';
import {
  createServiceTemplate,
  updateServiceTemplate,
  archiveServiceTemplate,
  restoreServiceTemplate,
  deleteServiceTemplate
} from './catalogApi';

const EMPTY_FORM = {
  fieldId: '',
  professionId: '',
  nameHebrew: '',
  name: '',
  defaultDurationMinutes: '',
  defaultPrice: '',
  colorLevel: 'GREEN',
  displayOrder: 0
};

const COLOR_LABELS = { GREEN: '🟢 נמוך', YELLOW: '🟡 בינוני', RED: '🔴 גבוה' };

export default function ServicesTab({ serviceTemplates, professions, fields, onReload, onSuccess, onError }) {
  const [search, setSearch] = useState('');
  const [fieldFilter, setFieldFilter] = useState('ALL');
  const [professionFilter, setProfessionFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Professions available in the filter, scoped to the selected field.
  const professionFilterOptions = useMemo(() => {
    if (fieldFilter === 'ALL') return professions;
    return professions.filter((p) => String(p.fieldId) === String(fieldFilter));
  }, [professions, fieldFilter]);

  // Professions available in the form, scoped to the field chosen in the form.
  const formProfessionOptions = useMemo(() => {
    if (!form.fieldId) return [];
    return professions.filter((p) => String(p.fieldId) === String(form.fieldId));
  }, [professions, form.fieldId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return serviceTemplates.filter((s) => {
      const fieldId = s.profession?.field?.id;
      if (fieldFilter !== 'ALL' && String(fieldId) !== String(fieldFilter)) return false;
      if (professionFilter !== 'ALL' && String(s.professionId) !== String(professionFilter)) return false;
      if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
      if (!q) return true;
      return (
        (s.nameHebrew || '').toLowerCase().includes(q) ||
        (s.name || '').toLowerCase().includes(q)
      );
    });
  }, [serviceTemplates, search, fieldFilter, professionFilter, statusFilter]);

  function openCreate() {
    setEditingId(null);
    const presetField = fieldFilter !== 'ALL' ? fieldFilter : '';
    const presetProfession = professionFilter !== 'ALL' ? professionFilter : '';
    setForm({ ...EMPTY_FORM, fieldId: presetField, professionId: presetProfession });
    setModalOpen(true);
  }

  function openEdit(service) {
    setEditingId(service.id);
    setForm({
      fieldId: String(service.profession?.field?.id ?? ''),
      professionId: String(service.professionId ?? ''),
      nameHebrew: service.nameHebrew || '',
      name: service.name || '',
      defaultDurationMinutes: service.defaultDurationMinutes ?? '',
      defaultPrice: service.defaultPrice ?? '',
      colorLevel: service.colorLevel || 'GREEN',
      displayOrder: service.displayOrder ?? 0
    });
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
  }

  function onFieldChange(value) {
    // Reset profession when the field changes so it stays consistent.
    setForm((prev) => ({ ...prev, fieldId: value, professionId: '' }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.professionId) {
      onError(new Error('יש לבחור מקצוע'));
      return;
    }
    if (!form.nameHebrew.trim() || !form.name.trim()) {
      onError(new Error('יש למלא שם בעברית ושם באנגלית'));
      return;
    }
    const duration = Number(form.defaultDurationMinutes);
    if (!duration || duration <= 0) {
      onError(new Error('יש להזין משך ברירת מחדל גדול מאפס'));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        professionId: Number(form.professionId),
        nameHebrew: form.nameHebrew.trim(),
        name: form.name.trim(),
        defaultDurationMinutes: duration,
        colorLevel: form.colorLevel,
        displayOrder: Number(form.displayOrder) || 0
      };
      // Price is optional; only send when provided.
      if (form.defaultPrice !== '' && form.defaultPrice !== null) {
        payload.defaultPrice = Number(form.defaultPrice);
      }
      if (editingId) {
        await updateServiceTemplate(editingId, payload);
        onSuccess('השירות עודכן');
      } else {
        await createServiceTemplate(payload);
        onSuccess('השירות נוסף');
      }
      setModalOpen(false);
      await onReload();
    } catch (err) {
      onError(err, 'service');
    } finally {
      setSaving(false);
    }
  }

  async function handleArchiveToggle(service) {
    try {
      if (service.status === 'ARCHIVED') {
        await restoreServiceTemplate(service.id);
        onSuccess('השירות שוחזר');
      } else {
        await archiveServiceTemplate(service.id);
        onSuccess('השירות הועבר לארכיון');
      }
      await onReload();
    } catch (err) {
      onError(err, 'service');
    }
  }

  async function handleDelete(service) {
    const count = service._count?.businessServices ?? 0;
    if (count > 0) {
      onError(new Error('לא ניתן למחוק שירות שנמצא בשימוש על ידי עסקים'));
      return;
    }
    if (!confirm(`למחוק לצמיתות את השירות "${service.nameHebrew}"?`)) return;
    try {
      await deleteServiceTemplate(service.id);
      onSuccess('השירות נמחק');
      await onReload();
    } catch (err) {
      onError(err, 'service');
    }
  }

  const canCreate = professions.length > 0;

  return (
    <div>
      <div className="flex gap-3 mb-6" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ flex: '1 1 180px', marginBottom: 0 }}>
          <label className="form-label">חיפוש</label>
          <input
            placeholder="חיפוש לפי שם שירות"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="form-group" style={{ flex: '0 0 180px', marginBottom: 0 }}>
          <label className="form-label">תחום</label>
          <select
            value={fieldFilter}
            onChange={(e) => { setFieldFilter(e.target.value); setProfessionFilter('ALL'); }}
          >
            <option value="ALL">כל התחומים</option>
            {fields.map((f) => (
              <option key={f.id} value={f.id}>{f.nameHebrew}</option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ flex: '0 0 180px', marginBottom: 0 }}>
          <label className="form-label">מקצוע</label>
          <select value={professionFilter} onChange={(e) => setProfessionFilter(e.target.value)}>
            <option value="ALL">כל המקצועות</option>
            {professionFilterOptions.map((p) => (
              <option key={p.id} value={p.id}>{p.nameHebrew}</option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ flex: '0 0 150px', marginBottom: 0 }}>
          <label className="form-label">סטטוס</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">הכל</option>
            <option value="ACTIVE">פעיל</option>
            <option value="ARCHIVED">בארכיון</option>
          </select>
        </div>
        <button className="btn-primary" onClick={openCreate} disabled={!canCreate}>
          ➕ שירות חדש
        </button>
      </div>

      {!canCreate && (
        <div className="empty-state">
          <div className="empty-state-icon">🧰</div>
          <div className="empty-state-title">צריך קודם להגדיר מקצוע</div>
          <div className="empty-state-description">
            שירות חייב להשתייך למקצוע. הוסף מקצוע בלשונית "מקצועות" לפני יצירת שירות.
          </div>
        </div>
      )}

      {canCreate && (
        filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🛎️</div>
            <div className="empty-state-title">אין שירותים להצגה</div>
            <div className="empty-state-description">
              {serviceTemplates.length === 0
                ? 'עדיין לא הוגדרו שירותים. לחץ על "שירות חדש" כדי להוסיף את הראשון.'
                : 'לא נמצאו שירותים התואמים את הסינון.'}
            </div>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>תחום</th>
                  <th>מקצוע</th>
                  <th>שם השירות</th>
                  <th>משך</th>
                  <th>מחיר</th>
                  <th>בשימוש</th>
                  <th>סטטוס</th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((service) => (
                  <tr key={service.id}>
                    <td>
                      <span className="badge badge-gray">{service.profession?.field?.nameHebrew || '—'}</span>
                    </td>
                    <td>{service.profession?.nameHebrew || '—'}</td>
                    <td style={{ fontWeight: 'var(--font-semibold)' }}>
                      {service.nameHebrew}
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                        {service.name}
                      </div>
                    </td>
                    <td>{formatDuration(service.defaultDurationMinutes)}</td>
                    <td>{formatPrice(service.defaultPrice)}</td>
                    <td>{service._count?.businessServices ?? 0}</td>
                    <td><StatusPill status={service.status} /></td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn-sm btn-secondary" onClick={() => openEdit(service)}>✏️ ערוך</button>
                        <button className="btn-sm btn-secondary" onClick={() => handleArchiveToggle(service)}>
                          {service.status === 'ARCHIVED' ? '♻️ שחזר' : '📥 ארכב'}
                        </button>
                        <button className="btn-sm btn-danger" onClick={() => handleDelete(service)}>🗑️ מחק</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {modalOpen && (
        <CatalogModal title={editingId ? 'עריכת שירות' : 'שירות חדש'} onClose={closeModal}>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">תחום *</label>
                <select value={form.fieldId} onChange={(e) => onFieldChange(e.target.value)} required>
                  <option value="">בחר תחום</option>
                  {fields.map((f) => (
                    <option key={f.id} value={f.id}>{f.nameHebrew}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">מקצוע *</label>
                <select
                  value={form.professionId}
                  onChange={(e) => setForm({ ...form, professionId: e.target.value })}
                  required
                  disabled={!form.fieldId}
                >
                  <option value="">{form.fieldId ? 'בחר מקצוע' : 'בחר תחום קודם'}</option>
                  {formProfessionOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nameHebrew}{p.status === 'ARCHIVED' ? ' (בארכיון)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">שם השירות (עברית) *</label>
              <input
                placeholder="לדוגמה: תספורת"
                value={form.nameHebrew}
                onChange={(e) => setForm({ ...form, nameHebrew: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">שם באנגלית (מזהה) *</label>
              <input
                placeholder="e.g. Haircut"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">משך ברירת מחדל (דקות) *</label>
                <input
                  type="number"
                  min="1"
                  placeholder="30"
                  value={form.defaultDurationMinutes}
                  onChange={(e) => setForm({ ...form, defaultDurationMinutes: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">מחיר ברירת מחדל (₪)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="אופציונלי"
                  value={form.defaultPrice}
                  onChange={(e) => setForm({ ...form, defaultPrice: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">רמת סיכון</label>
                <select
                  value={form.colorLevel}
                  onChange={(e) => setForm({ ...form, colorLevel: e.target.value })}
                >
                  {Object.entries(COLOR_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">סדר תצוגה</label>
                <input
                  type="number"
                  value={form.displayOrder}
                  onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button className="btn-primary" disabled={saving}>
                {saving ? 'שומר...' : editingId ? '✓ עדכן שירות' : '➕ הוסף שירות'}
              </button>
              <button type="button" className="btn-secondary" onClick={closeModal} disabled={saving}>
                ביטול
              </button>
            </div>
          </form>
        </CatalogModal>
      )}
    </div>
  );
}
