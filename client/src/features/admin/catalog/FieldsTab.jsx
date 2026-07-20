import React, { useMemo, useState } from 'react';
import CatalogModal from './CatalogModal';
import IconPicker from './IconPicker';
import { StatusPill, SortHeader, useTableSort } from './catalogUi';
import {
  createField,
  updateField,
  archiveField,
  restoreField,
  deleteField
} from './catalogApi';

const EMPTY_FORM = { nameHebrew: '', name: '', icon: '' };

export default function FieldsTab({ fields, serviceTemplates, onReload, onSuccess, onError }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Count service templates per field (via profession.field.id) — client-side,
  // no backend call (CatalogPage already loads all service templates).
  const servicesByField = useMemo(() => {
    const map = {};
    for (const s of serviceTemplates || []) {
      const fid = s.profession?.field?.id;
      if (fid != null) map[fid] = (map[fid] || 0) + 1;
    }
    return map;
  }, [serviceTemplates]);

  const servicesCount = (field) => servicesByField[field.id] || 0;

  const { sort, toggle, sortRows } = useTableSort('name', {
    name: (f) => f.nameHebrew,
    status: (f) => f.status,
    professions: (f) => f._count?.professions ?? 0,
    services: (f) => servicesCount(f)
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = fields.filter((f) => {
      if (statusFilter !== 'ALL' && f.status !== statusFilter) return false;
      if (!q) return true;
      return (
        (f.nameHebrew || '').toLowerCase().includes(q) ||
        (f.name || '').toLowerCase().includes(q)
      );
    });
    return sortRows(rows);
  }, [fields, search, statusFilter, sortRows]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(field) {
    setEditingId(field.id);
    setForm({
      nameHebrew: field.nameHebrew || '',
      name: field.name || '',
      icon: field.icon || ''
    });
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nameHebrew.trim() || !form.name.trim()) {
      onError(new Error('יש למלא שם בעברית ושם באנגלית'));
      return;
    }
    setSaving(true);
    try {
      // displayOrder intentionally omitted: create → backend default; edit →
      // PATCH leaves the stored value unchanged.
      const payload = {
        nameHebrew: form.nameHebrew.trim(),
        name: form.name.trim(),
        icon: form.icon.trim() || null
      };
      if (editingId) {
        await updateField(editingId, payload);
        onSuccess('התחום עודכן');
      } else {
        await createField(payload);
        onSuccess('התחום נוסף');
      }
      setModalOpen(false);
      await onReload();
    } catch (err) {
      onError(err, 'field');
    } finally {
      setSaving(false);
    }
  }

  async function handleArchiveToggle(field) {
    try {
      if (field.status === 'ARCHIVED') {
        await restoreField(field.id);
        onSuccess('התחום הוחזר לפעילות');
      } else {
        await archiveField(field.id);
        onSuccess('התחום הועבר לארכיון');
      }
      await onReload();
    } catch (err) {
      onError(err, 'field');
    }
  }

  async function handleDelete(field) {
    const count = field._count?.professions ?? 0;
    if (count > 0) {
      onError(new Error('לא ניתן למחוק תחום שמכיל מקצועות. יש להעביר לארכיון או למחוק אותם קודם'));
      return;
    }
    if (!confirm(`למחוק לצמיתות את התחום "${field.nameHebrew}"?`)) return;
    try {
      await deleteField(field.id);
      onSuccess('התחום נמחק');
      await onReload();
    } catch (err) {
      onError(err, 'field');
    }
  }

  return (
    <div>
      <div className="flex gap-3 mb-6" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ flex: '1 1 220px', marginBottom: 0 }}>
          <label className="form-label">חיפוש</label>
          <input
            placeholder="חיפוש לפי שם תחום"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="form-group" style={{ flex: '0 0 180px', marginBottom: 0 }}>
          <label className="form-label">סטטוס</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">הכל</option>
            <option value="ACTIVE">פעיל</option>
            <option value="ARCHIVED">בארכיון</option>
          </select>
        </div>
        <button className="btn-primary" onClick={openCreate}>➕ תחום חדש</button>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🗂️</div>
          <div className="empty-state-title">אין תחומים להצגה</div>
          <div className="empty-state-description">
            {fields.length === 0
              ? 'עדיין לא הוגדרו תחומים במערכת. לחץ על "תחום חדש" כדי להוסיף את הראשון.'
              : 'לא נמצאו תחומים התואמים את החיפוש.'}
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <SortHeader label="שם התחום" sortKey="name" sort={sort} onToggle={toggle} />
                <th>אייקון</th>
                <SortHeader label="מקצועות" sortKey="professions" sort={sort} onToggle={toggle} />
                <SortHeader label="שירותים" sortKey="services" sort={sort} onToggle={toggle} />
                <SortHeader label="סטטוס" sortKey="status" sort={sort} onToggle={toggle} />
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((field) => (
                <tr key={field.id}>
                  <td style={{ fontWeight: 'var(--font-semibold)' }}>
                    {field.nameHebrew}
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                      {field.name}
                    </div>
                  </td>
                  <td style={{ fontSize: 'var(--text-xl)' }}>{field.icon || '—'}</td>
                  <td>{field._count?.professions ?? 0}</td>
                  <td>{servicesCount(field)}</td>
                  <td><StatusPill status={field.status} /></td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn-sm btn-secondary" onClick={() => openEdit(field)}>✏️ ערוך</button>
                      <button className="btn-sm btn-secondary" onClick={() => handleArchiveToggle(field)}>
                        {field.status === 'ARCHIVED' ? '♻️ החזר לפעילות' : '📥 העבר לארכיון'}
                      </button>
                      <button className="btn-sm btn-danger" onClick={() => handleDelete(field)}>🗑️ מחק</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <CatalogModal title={editingId ? 'עריכת תחום' : 'תחום חדש'} onClose={closeModal}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">שם התחום (עברית) *</label>
              <input
                placeholder="לדוגמה: בריאות"
                value={form.nameHebrew}
                onChange={(e) => setForm({ ...form, nameHebrew: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">שם באנגלית (מזהה) *</label>
              <input
                placeholder="e.g. Health"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">אייקון</label>
              <IconPicker value={form.icon} onChange={(icon) => setForm({ ...form, icon })} />
            </div>
            <div className="flex gap-3">
              <button className="btn-primary" disabled={saving}>
                {saving ? 'שומר...' : editingId ? '✓ עדכן תחום' : '➕ הוסף תחום'}
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
