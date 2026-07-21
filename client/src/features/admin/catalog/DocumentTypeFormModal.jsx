import React, { useState } from 'react';
import CatalogModal from './CatalogModal';
import { createDocumentType, updateDocumentType } from './documentsApi';

const FORMAT_OPTIONS = ['PDF', 'JPG', 'PNG'];

// The backend stores acceptedFormats as a JSON string (e.g. '["PDF","JPG"]').
// Parse defensively so a malformed value never crashes the modal.
function parseFormats(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      /* fall through */
    }
  }
  return ['PDF'];
}

function initialForm(documentType) {
  if (!documentType) {
    return { nameHebrew: '', name: '', description: '', formats: ['PDF'], maxSizeKB: 5120 };
  }
  return {
    nameHebrew: documentType.nameHebrew || '',
    name: documentType.name || '',
    description: documentType.description || '',
    formats: parseFormats(documentType.acceptedFormats),
    maxSizeKB: documentType.maxSizeKB ?? 5120
  };
}

/**
 * DocumentTypeFormModal - compact create/edit modal for a single DocumentType.
 * Shared by DocumentTypesTab and the in-service "create new type" flow so a new
 * type never has to be authored inside a stretched service modal.
 *
 * Props:
 *   documentType?  existing type to edit; omit for create
 *   onClose()      close without saving
 *   onSaved(saved) called with the saved DocumentType (for preselect / reload)
 *   onError(err, 'document')
 */
export default function DocumentTypeFormModal({ documentType, onClose, onSaved, onError }) {
  const editing = Boolean(documentType);
  const [form, setForm] = useState(() => initialForm(documentType));
  const [saving, setSaving] = useState(false);

  function toggleFormat(fmt) {
    setForm((f) => ({
      ...f,
      formats: f.formats.includes(fmt) ? f.formats.filter((x) => x !== fmt) : [...f.formats, fmt]
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nameHebrew.trim() || !form.name.trim()) {
      onError(new Error('יש למלא שם בעברית ושם באנגלית'));
      return;
    }
    if (form.formats.length === 0) {
      onError(new Error('יש לבחור לפחות פורמט קובץ אחד'));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        nameHebrew: form.nameHebrew.trim(),
        description: form.description.trim(),
        acceptedFormats: form.formats,
        maxSizeKB: Number(form.maxSizeKB) || 0
      };
      const saved = editing
        ? await updateDocumentType(documentType.id, payload)
        : await createDocumentType(payload);
      onSaved(saved);
    } catch (err) {
      onError(err, 'document');
    } finally {
      setSaving(false);
    }
  }

  return (
    <CatalogModal title={editing ? 'עריכת סוג מסמך' : 'סוג מסמך חדש'} onClose={saving ? () => {} : onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">שם המסמך (עברית) *</label>
          <input
            placeholder="לדוגמה: רישיון רפואה"
            value={form.nameHebrew}
            onChange={(e) => setForm({ ...form, nameHebrew: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">שם באנגלית (מזהה) *</label>
          <input
            placeholder="e.g. Medical License"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">תיאור / הסבר קצר</label>
          <textarea
            rows={2}
            placeholder="הסבר קצר על המסמך הנדרש"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="grid grid-2">
          <div className="form-group">
            <label className="form-label">פורמטים מותרים *</label>
            <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
              {FORMAT_OPTIONS.map((fmt) => (
                <label key={fmt} className="flex gap-2" style={{ alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.formats.includes(fmt)}
                    onChange={() => toggleFormat(fmt)}
                    style={{ width: 'auto' }}
                  />
                  {fmt}
                </label>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">גודל מקסימלי (KB)</label>
            <input
              type="number"
              min="1"
              value={form.maxSizeKB}
              onChange={(e) => setForm({ ...form, maxSizeKB: e.target.value })}
            />
          </div>
        </div>
        <div className="flex gap-3">
          <button className="btn-primary" disabled={saving}>
            {saving ? 'שומר...' : editing ? '✓ עדכן סוג מסמך' : '➕ צור סוג מסמך'}
          </button>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
            ביטול
          </button>
        </div>
      </form>
    </CatalogModal>
  );
}
