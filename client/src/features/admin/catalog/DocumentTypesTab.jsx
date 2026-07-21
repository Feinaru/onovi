import React, { useMemo, useState } from 'react';
import DocumentTypeFormModal from './DocumentTypeFormModal';
import { StatusPill, SortHeader, useTableSort } from './catalogUi';
import { archiveDocumentType, restoreDocumentType, deleteDocumentType } from './documentsApi';

// acceptedFormats is stored as a JSON string; render it as a readable list.
function formatList(value) {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.join(', ');
    } catch {
      /* fall through */
    }
  }
  return '—';
}

function formatSize(kb) {
  if (!kb) return '—';
  if (kb >= 1024) return `${(kb / 1024).toFixed(kb % 1024 === 0 ? 0 : 1)} MB`;
  return `${kb} KB`;
}

/**
 * DocumentTypesTab - lightweight management of DocumentTypes (סוגי מסמכים).
 * Create/edit go through the shared compact DocumentTypeFormModal.
 *
 * Archive is the safe, reversible way to retire a type: it only hides the type
 * from *new* requirement selection. It never removes existing service
 * requirements and never deletes already-uploaded documents — archiving is
 * confirmed with copy that spells this out so it is not mistaken for deletion.
 * Restore brings the type back into new-selection.
 *
 * Hard delete is a separate, destructive action, guarded server-side: it is
 * allowed only when the type is unused and otherwise returns a friendly Hebrew
 * "in use" error suggesting archive instead.
 */
export default function DocumentTypesTab({ documentTypes, onReload, onSuccess, onError }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // DocumentType being edited, or null for create

  const { sort, toggle, sortRows } = useTableSort('name', {
    name: (d) => d.nameHebrew,
    maxSize: (d) => d.maxSizeKB ?? 0,
    status: (d) => d.status
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = (documentTypes || []).filter((d) => {
      if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;
      if (!q) return true;
      return (
        (d.nameHebrew || '').toLowerCase().includes(q) ||
        (d.name || '').toLowerCase().includes(q)
      );
    });
    return sortRows(rows);
  }, [documentTypes, search, statusFilter, sortRows]);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(documentType) {
    setEditing(documentType);
    setModalOpen(true);
  }

  async function handleSaved() {
    setModalOpen(false);
    onSuccess(editing ? 'סוג המסמך עודכן' : 'סוג המסמך נוצר');
    await onReload();
  }

  async function handleArchiveToggle(documentType) {
    const isArchived = documentType.status === 'ARCHIVED';
    // Only archiving needs confirmation: restoring is harmless. The copy makes
    // clear archive is non-destructive so it is not mistaken for deletion.
    if (
      !isArchived &&
      !confirm(
        'העברה לארכיון תמנע שימוש חדש בסוג המסמך, אך לא תסיר דרישות קיימות ולא תמחק מסמכים שכבר הועלו. להמשיך?'
      )
    ) {
      return;
    }
    try {
      if (isArchived) {
        await restoreDocumentType(documentType.id);
        onSuccess('סוג המסמך הוחזר לפעילות');
      } else {
        await archiveDocumentType(documentType.id);
        onSuccess('סוג המסמך הועבר לארכיון');
      }
      await onReload();
    } catch (err) {
      onError(err, 'document');
    }
  }

  // Hard delete is allowed only for unused types; the backend guards this and
  // returns a friendly Hebrew error when the type is in use, suggesting archive.
  async function handleDelete(documentType) {
    if (!confirm(`למחוק לצמיתות את סוג המסמך "${documentType.nameHebrew}"?`)) return;
    try {
      await deleteDocumentType(documentType.id);
      onSuccess('סוג המסמך נמחק');
      await onReload();
    } catch (err) {
      onError(err, 'document');
    }
  }

  return (
    <div>
      <div className="flex gap-3 mb-6" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
          <label className="form-label">חיפוש</label>
          <input
            placeholder="חיפוש לפי שם מסמך"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="form-group" style={{ flex: '0 0 160px', marginBottom: 0 }}>
          <label className="form-label">סטטוס</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">הכל</option>
            <option value="ACTIVE">פעיל</option>
            <option value="ARCHIVED">בארכיון</option>
          </select>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          ➕ סוג מסמך חדש
        </button>
      </div>

      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
        ארכיון מסתיר סוג מסמך משימוש חדש. מחיקה אפשרית רק כשסוג המסמך אינו בשימוש.
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📄</div>
          <div className="empty-state-title">אין סוגי מסמכים להצגה</div>
          <div className="empty-state-description">
            {(documentTypes || []).length === 0
              ? 'עדיין לא הוגדרו סוגי מסמכים. לחץ על "סוג מסמך חדש" כדי להוסיף את הראשון.'
              : 'לא נמצאו סוגי מסמכים התואמים את הסינון.'}
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <SortHeader label="שם המסמך" sortKey="name" sort={sort} onToggle={toggle} />
                <th>פורמטים</th>
                <SortHeader label="גודל מקסימלי" sortKey="maxSize" sort={sort} onToggle={toggle} />
                <SortHeader label="סטטוס" sortKey="status" sort={sort} onToggle={toggle} />
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((documentType) => (
                <tr key={documentType.id}>
                  <td style={{ fontWeight: 'var(--font-semibold)' }}>
                    {documentType.nameHebrew}
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                      {documentType.name}
                    </div>
                  </td>
                  <td>{formatList(documentType.acceptedFormats)}</td>
                  <td>{formatSize(documentType.maxSizeKB)}</td>
                  <td><StatusPill status={documentType.status} /></td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn-sm btn-secondary" onClick={() => openEdit(documentType)}>✏️ ערוך</button>
                      <button className="btn-sm btn-secondary" onClick={() => handleArchiveToggle(documentType)}>
                        {documentType.status === 'ARCHIVED' ? '♻️ החזר לפעילות' : '📥 העבר לארכיון'}
                      </button>
                      <button className="btn-sm btn-danger" onClick={() => handleDelete(documentType)}>🗑️ מחק</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <DocumentTypeFormModal
          documentType={editing}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
          onError={onError}
        />
      )}
    </div>
  );
}
