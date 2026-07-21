import React, { useState } from 'react';

/**
 * RequirementsEditor - the "דרישות מסמכים" section embedded in the service
 * create/edit modal. Fully controlled: it edits an in-memory array and never
 * calls the API itself — the parent service modal persists everything on Save.
 *
 * The service flow only *selects* existing DocumentTypes. New types are created
 * in the dedicated "סוגי מסמכים" tab, so this modal stays focused and simple.
 *
 * value:   [{ id?, documentTypeId (string), instruction }]
 * onChange(nextValue)
 * docTypes: full DocumentType list (ACTIVE + ARCHIVED) from the catalog
 * initialMode: 'none' | 'required' — starting section state
 */
export default function RequirementsEditor({ value, onChange, docTypes, initialMode }) {
  // UI-only mode. "required" with an empty list is a valid intermediate state
  // (the admin picked "נדרשים" but hasn't added a row yet).
  const [mode, setMode] = useState(initialMode || (value.length > 0 ? 'required' : 'none'));

  const activeTypes = docTypes.filter((dt) => dt.status === 'ACTIVE');

  function selectMode(next) {
    if (next === 'none' && value.length > 0) {
      if (!confirm('לבטל את דרישות המסמכים לשירות זה? הדרישות הקיימות יוסרו בעת השמירה.')) return;
      onChange([]);
    }
    setMode(next);
  }

  function updateRow(index, patch) {
    onChange(value.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function addRow() {
    onChange([...value, { documentTypeId: '', instruction: '' }]);
  }

  function removeRow(index) {
    onChange(value.filter((_, i) => i !== index));
  }

  // Options for a given row: active types not already chosen in *other* rows,
  // plus this row's own selection (even if it points at an archived type, so the
  // row never silently loses its value on an edit).
  function optionsForRow(index) {
    const chosenElsewhere = new Set(
      value.filter((_, i) => i !== index).map((r) => String(r.documentTypeId)).filter(Boolean)
    );
    const opts = activeTypes.filter((dt) => !chosenElsewhere.has(String(dt.id)));
    const current = value[index]?.documentTypeId;
    if (current && !opts.some((dt) => String(dt.id) === String(current))) {
      const archived = docTypes.find((dt) => String(dt.id) === String(current));
      if (archived) opts.push(archived);
    }
    return opts;
  }

  return (
    <div className="form-group">
      <label className="form-label">דרישות מסמכים</label>

      <div className="flex gap-4" style={{ flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
        <label className="flex gap-2" style={{ alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="radio"
            name="reqMode"
            checked={mode === 'none'}
            onChange={() => selectMode('none')}
            style={{ width: 'auto' }}
          />
          לא נדרשים מסמכים
        </label>
        <label className="flex gap-2" style={{ alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="radio"
            name="reqMode"
            checked={mode === 'required'}
            onChange={() => selectMode('required')}
            style={{ width: 'auto' }}
          />
          נדרשים מסמכים
        </label>
      </div>

      {mode === 'required' && (
        <div
          className="card"
          style={{ padding: 'var(--space-3)', border: '1px solid var(--border-subtle)', boxShadow: 'none' }}
        >
          {value.length === 0 && (
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
              הוסף לפחות דרישת מסמך אחת שנותן השירות יידרש להעלות בהמשך.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {value.map((row, index) => (
              <div
                key={row.id ?? `new-${index}`}
                style={{
                  paddingBottom: 'var(--space-3)',
                  borderBottom: index < value.length - 1 ? '1px solid var(--border-subtle)' : 'none'
                }}
              >
                <div className="form-group" style={{ marginBottom: 'var(--space-2)' }}>
                  <label className="form-label">סוג מסמך *</label>
                  <select
                    value={row.documentTypeId}
                    onChange={(e) => updateRow(index, { documentTypeId: e.target.value })}
                  >
                    <option value="">בחר סוג מסמך</option>
                    {optionsForRow(index).map((dt) => (
                      <option key={dt.id} value={dt.id}>
                        {dt.nameHebrew}{dt.status === 'ARCHIVED' ? ' (בארכיון)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 'var(--space-2)' }}>
                  <label className="form-label">הוראות לנותן השירות</label>
                  <textarea
                    rows={2}
                    placeholder="לדוגמה: יש להעלות רישיון בתוקף"
                    value={row.instruction}
                    onChange={(e) => updateRow(index, { instruction: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <button type="button" className="btn-sm btn-danger" onClick={() => removeRow(index)}>
                    🗑️ הסר
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 'var(--space-3)' }}>
            <button type="button" className="btn-sm btn-secondary" onClick={addRow}>
              ➕ הוסף דרישת מסמך
            </button>
          </div>

          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 'var(--space-3)' }}>
            לא מצאתם סוג מסמך מתאים? צרו אותו בטאב סוגי מסמכים ואז חזרו לשירות.
          </div>
        </div>
      )}
    </div>
  );
}
