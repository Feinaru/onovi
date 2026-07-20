import React, { useMemo, useState } from 'react';
import CatalogModal from './CatalogModal';
import { StatusPill, SortHeader, useTableSort } from './catalogUi';
import {
  createProfession,
  updateProfession,
  archiveProfession,
  restoreProfession,
  deleteProfession
} from './catalogApi';

const EMPTY_FORM = { fieldId: '', nameHebrew: '', name: '' };

export default function ProfessionsTab({ professions, fields, onReload, onSuccess, onError }) {
  const [search, setSearch] = useState('');
  const [fieldFilter, setFieldFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const { sort, toggle, sortRows } = useTableSort('name', {
    name: (p) => p.nameHebrew,
    field: (p) => p.field?.nameHebrew,
    status: (p) => p.status,
    services: (p) => p._count?.serviceTemplates ?? 0
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = professions.filter((p) => {
      if (fieldFilter !== 'ALL' && String(p.fieldId) !== String(fieldFilter)) return false;
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
      if (!q) return true;
      return (
        (p.nameHebrew || '').toLowerCase().includes(q) ||
        (p.name || '').toLowerCase().includes(q)
      );
    });
    return sortRows(rows);
  }, [professions, search, fieldFilter, statusFilter, sortRows]);

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, fieldId: fieldFilter !== 'ALL' ? fieldFilter : '' });
    setModalOpen(true);
  }

  function openEdit(profession) {
    setEditingId(profession.id);
    setForm({
      fieldId: String(profession.fieldId ?? ''),
      nameHebrew: profession.nameHebrew || '',
      name: profession.name || ''
    });
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.fieldId) {
      onError(new Error('יש לבחור תחום'));
      return;
    }
    if (!form.nameHebrew.trim() || !form.name.trim()) {
      onError(new Error('יש למלא שם בעברית ושם באנגלית'));
      return;
    }
    setSaving(true);
    try {
      // displayOrder intentionally omitted (create → default; edit → unchanged).
      const payload = {
        fieldId: Number(form.fieldId),
        nameHebrew: form.nameHebrew.trim(),
        name: form.name.trim()
      };
      if (editingId) {
        await updateProfession(editingId, payload);
        onSuccess('המקצוע עודכן');
      } else {
        await createProfession(payload);
        onSuccess('המקצוע נוסף');
      }
      setModalOpen(false);
      await onReload();
    } catch (err) {
      onError(err, 'profession');
    } finally {
      setSaving(false);
    }
  }

  async function handleArchiveToggle(profession) {
    try {
      if (profession.status === 'ARCHIVED') {
        await restoreProfession(profession.id);
        onSuccess('המקצוע הוחזר לפעילות');
      } else {
        await archiveProfession(profession.id);
        onSuccess('המקצוע הועבר לארכיון');
      }
      await onReload();
    } catch (err) {
      onError(err, 'profession');
    }
  }

  async function handleDelete(profession) {
    const count = profession._count?.serviceTemplates ?? 0;
    if (count > 0) {
      onError(new Error('לא ניתן למחוק מקצוע שמכיל שירותים. יש להעביר לארכיון או למחוק אותם קודם'));
      return;
    }
    if (!confirm(`למחוק לצמיתות את המקצוע "${profession.nameHebrew}"?`)) return;
    try {
      await deleteProfession(profession.id);
      onSuccess('המקצוע נמחק');
      await onReload();
    } catch (err) {
      onError(err, 'profession');
    }
  }

  return (
    <div>
      <div className="flex gap-3 mb-6" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
          <label className="form-label">חיפוש</label>
          <input
            placeholder="חיפוש לפי שם מקצוע"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="form-group" style={{ flex: '0 0 200px', marginBottom: 0 }}>
          <label className="form-label">תחום</label>
          <select value={fieldFilter} onChange={(e) => setFieldFilter(e.target.value)}>
            <option value="ALL">כל התחומים</option>
            {fields.map((f) => (
              <option key={f.id} value={f.id}>{f.nameHebrew}</option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ flex: '0 0 160px', marginBottom: 0 }}>
          <label className="form-label">סטטוס</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">הכל</option>
            <option value="ACTIVE">פעיל</option>
            <option value="ARCHIVED">בארכיון</option>
          </select>
        </div>
        <button className="btn-primary" onClick={openCreate} disabled={fields.length === 0}>
          ➕ מקצוע חדש
        </button>
      </div>

      {fields.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🗂️</div>
          <div className="empty-state-title">צריך קודם להגדיר תחום</div>
          <div className="empty-state-description">
            מקצוע חייב להשתייך לתחום. הוסף תחום בלשונית "תחומים" לפני יצירת מקצוע.
          </div>
        </div>
      )}

      {fields.length > 0 && (
        filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🧰</div>
            <div className="empty-state-title">אין מקצועות להצגה</div>
            <div className="empty-state-description">
              {professions.length === 0
                ? 'עדיין לא הוגדרו מקצועות. לחץ על "מקצוע חדש" כדי להוסיף את הראשון.'
                : 'לא נמצאו מקצועות התואמים את הסינון.'}
            </div>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <SortHeader label="תחום" sortKey="field" sort={sort} onToggle={toggle} />
                  <SortHeader label="שם המקצוע" sortKey="name" sort={sort} onToggle={toggle} />
                  <SortHeader label="שירותים" sortKey="services" sort={sort} onToggle={toggle} />
                  <SortHeader label="סטטוס" sortKey="status" sort={sort} onToggle={toggle} />
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((profession) => (
                  <tr key={profession.id}>
                    <td>
                      <span className="badge badge-gray">{profession.field?.nameHebrew || '—'}</span>
                    </td>
                    <td style={{ fontWeight: 'var(--font-semibold)' }}>
                      {profession.nameHebrew}
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                        {profession.name}
                      </div>
                    </td>
                    <td>{profession._count?.serviceTemplates ?? 0}</td>
                    <td><StatusPill status={profession.status} /></td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn-sm btn-secondary" onClick={() => openEdit(profession)}>✏️ ערוך</button>
                        <button className="btn-sm btn-secondary" onClick={() => handleArchiveToggle(profession)}>
                          {profession.status === 'ARCHIVED' ? '♻️ החזר לפעילות' : '📥 העבר לארכיון'}
                        </button>
                        <button className="btn-sm btn-danger" onClick={() => handleDelete(profession)}>🗑️ מחק</button>
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
        <CatalogModal title={editingId ? 'עריכת מקצוע' : 'מקצוע חדש'} onClose={closeModal}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">תחום *</label>
              <select
                value={form.fieldId}
                onChange={(e) => setForm({ ...form, fieldId: e.target.value })}
                required
              >
                <option value="">בחר תחום</option>
                {fields.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nameHebrew}{f.status === 'ARCHIVED' ? ' (בארכיון)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">שם המקצוע (עברית) *</label>
              <input
                placeholder="לדוגמה: מספרה"
                value={form.nameHebrew}
                onChange={(e) => setForm({ ...form, nameHebrew: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">שם באנגלית (מזהה) *</label>
              <input
                placeholder="e.g. Hairdresser"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="flex gap-3">
              <button className="btn-primary" disabled={saving}>
                {saving ? 'שומר...' : editingId ? '✓ עדכן מקצוע' : '➕ הוסף מקצוע'}
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
