import React, { useCallback, useEffect, useMemo, useState } from 'react';
import CatalogModal from './CatalogModal';
import RequirementsEditor from './RequirementsEditor';
import { StatusPill, SortHeader, useTableSort, formatDuration } from './catalogUi';
import {
  createServiceTemplate,
  updateServiceTemplate,
  archiveServiceTemplate,
  restoreServiceTemplate,
  deleteServiceTemplate
} from './catalogApi';
import {
  listRequirements,
  addRequirement,
  updateRequirement,
  removeRequirement
} from './documentsApi';

// Document-requirement badge for a service (count is loaded lazily).
function requirementBadge(count) {
  if (count === undefined) return <span className="badge badge-gray">…</span>;
  if (count === 0) return <span className="badge badge-gray">לא נדרשים מסמכים</span>;
  if (count === 1) return <span className="badge badge-warning">נדרש מסמך אחד</span>;
  return <span className="badge badge-warning">{`נדרשים ${count} מסמכים`}</span>;
}

// Catalog defines the service's identity + its document requirements.
// Price belongs to the provider's BusinessService, so it is not managed here;
// duration is kept only as an optional suggestion ("משך מומלץ").
const EMPTY_FORM = {
  fieldId: '',
  professionId: '',
  nameHebrew: '',
  name: '',
  defaultDurationMinutes: ''
};

// Map API requirement rows to the editor's controlled shape.
function toEditorRows(rows) {
  return rows.map((r) => ({
    id: r.id,
    documentTypeId: String(r.documentTypeId),
    instruction: r.instruction || ''
  }));
}

export default function ServicesTab({
  serviceTemplates,
  professions,
  fields,
  documentTypes,
  onReload,
  onSuccess,
  onError
}) {
  const [search, setSearch] = useState('');
  const [fieldFilter, setFieldFilter] = useState('ALL');
  const [professionFilter, setProfessionFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Document requirements are edited inline as a section of the service modal.
  // `requirementsInitial` is the loaded snapshot; on save we diff against it and
  // reconcile via the per-requirement endpoints (no combined backend write path).
  const [requirements, setRequirements] = useState([]);
  const [requirementsInitial, setRequirementsInitial] = useState([]);
  const [reqInitialMode, setReqInitialMode] = useState('none');

  // Requirement counts per service (lazy, cached). No backend change: counts are
  // derived by listing requirements per template.
  const [reqCounts, setReqCounts] = useState({});

  useEffect(() => {
    let cancelled = false;
    if (!serviceTemplates || serviceTemplates.length === 0) {
      setReqCounts({});
      return;
    }
    (async () => {
      try {
        const entries = await Promise.all(
          serviceTemplates.map(async (s) => [s.id, (await listRequirements(s.id)).length])
        );
        if (!cancelled) setReqCounts(Object.fromEntries(entries));
      } catch (err) {
        if (!cancelled) onError(err, 'document');
      }
    })();
    return () => { cancelled = true; };
  }, [serviceTemplates, onError]);

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

  const { sort, toggle, sortRows } = useTableSort('name', {
    name: (s) => s.nameHebrew,
    profession: (s) => s.profession?.nameHebrew,
    duration: (s) => s.defaultDurationMinutes ?? 0,
    status: (s) => s.status,
    requirements: (s) => reqCounts[s.id] ?? 0
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = serviceTemplates.filter((s) => {
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
    return sortRows(rows);
  }, [serviceTemplates, search, fieldFilter, professionFilter, statusFilter, sortRows]);

  function openCreate() {
    setEditingId(null);
    const presetField = fieldFilter !== 'ALL' ? fieldFilter : '';
    const presetProfession = professionFilter !== 'ALL' ? professionFilter : '';
    setForm({ ...EMPTY_FORM, fieldId: presetField, professionId: presetProfession });
    setRequirements([]);
    setRequirementsInitial([]);
    setReqInitialMode('none');
    setModalOpen(true);
  }

  // Open the service edit modal. `focusRequirements` makes the requirements
  // section start expanded — used by the row's "דרישות מסמכים" action so it
  // reads as editing that section, not a separate hidden workflow.
  async function openEdit(service, { focusRequirements = false } = {}) {
    try {
      const rows = toEditorRows(await listRequirements(service.id));
      setEditingId(service.id);
      setForm({
        fieldId: String(service.profession?.field?.id ?? ''),
        professionId: String(service.professionId ?? ''),
        nameHebrew: service.nameHebrew || '',
        name: service.name || '',
        defaultDurationMinutes: service.defaultDurationMinutes ?? ''
      });
      setRequirements(rows);
      setRequirementsInitial(rows);
      setReqInitialMode(focusRequirements || rows.length > 0 ? 'required' : 'none');
      setModalOpen(true);
    } catch (err) {
      onError(err, 'document');
    }
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
  }

  function onFieldChange(value) {
    // Reset profession when the field changes so it stays consistent.
    setForm((prev) => ({ ...prev, fieldId: value, professionId: '' }));
  }

  // Diff `requirements` against `requirementsInitial` and apply via the
  // per-requirement endpoints. Matching is by documentTypeId (unique per service).
  async function reconcileRequirements(serviceId) {
    const initialByType = new Map(requirementsInitial.map((r) => [Number(r.documentTypeId), r]));
    const currentTypes = new Set(requirements.map((r) => Number(r.documentTypeId)));

    for (const r of requirementsInitial) {
      if (!currentTypes.has(Number(r.documentTypeId))) {
        await removeRequirement(r.id);
      }
    }
    for (const c of requirements) {
      const dtId = Number(c.documentTypeId);
      const existing = initialByType.get(dtId);
      const instruction = (c.instruction || '').trim();
      if (!existing) {
        await addRequirement(serviceId, { documentTypeId: dtId, instruction });
      } else if ((existing.instruction || '').trim() !== instruction) {
        await updateRequirement(existing.id, { instruction });
      }
    }
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
      onError(new Error('יש להזין משך מומלץ גדול מאפס'));
      return;
    }
    if (requirements.some((r) => !r.documentTypeId)) {
      onError(new Error('יש לבחור סוג מסמך לכל דרישה'));
      return;
    }

    setSaving(true);
    // colorLevel, defaultPrice and displayOrder are intentionally not sent from
    // the admin catalog: risk level is replaced by document requirements, price
    // belongs to the provider, and ordering is handled by sorting.
    const payload = {
      professionId: Number(form.professionId),
      nameHebrew: form.nameHebrew.trim(),
      name: form.name.trim(),
      defaultDurationMinutes: duration
    };

    // Step 1: save the service itself.
    let serviceId;
    try {
      if (editingId) {
        await updateServiceTemplate(editingId, payload);
        serviceId = editingId;
      } else {
        const created = await createServiceTemplate(payload);
        serviceId = created.id;
      }
    } catch (err) {
      onError(err, 'service');
      setSaving(false);
      return;
    }

    // Step 2: reconcile requirements. The service is already saved, so on a
    // partial failure we still reload and surface the error rather than lie.
    try {
      await reconcileRequirements(serviceId);
    } catch (err) {
      onError(err, 'document');
      setModalOpen(false);
      await onReload();
      setSaving(false);
      return;
    }

    onSuccess(editingId ? 'השירות עודכן' : 'השירות נוסף');
    setReqCounts((prev) => ({ ...prev, [serviceId]: requirements.length }));
    setModalOpen(false);
    await onReload();
    setSaving(false);
  }

  async function handleArchiveToggle(service) {
    try {
      if (service.status === 'ARCHIVED') {
        await restoreServiceTemplate(service.id);
        onSuccess('השירות הוחזר לפעילות');
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
                  <SortHeader label="מקצוע" sortKey="profession" sort={sort} onToggle={toggle} />
                  <SortHeader label="שם השירות" sortKey="name" sort={sort} onToggle={toggle} />
                  <SortHeader label="משך מומלץ" sortKey="duration" sort={sort} onToggle={toggle} />
                  <th>בשימוש</th>
                  <SortHeader label="דרישות מסמכים" sortKey="requirements" sort={sort} onToggle={toggle} />
                  <SortHeader label="סטטוס" sortKey="status" sort={sort} onToggle={toggle} />
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
                    <td>{service._count?.businessServices ?? 0}</td>
                    <td>{requirementBadge(reqCounts[service.id])}</td>
                    <td><StatusPill status={service.status} /></td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn-sm btn-secondary" onClick={() => openEdit(service, { focusRequirements: true })}>📄 דרישות מסמכים</button>
                        <button className="btn-sm btn-secondary" onClick={() => openEdit(service)}>✏️ ערוך</button>
                        <button className="btn-sm btn-secondary" onClick={() => handleArchiveToggle(service)}>
                          {service.status === 'ARCHIVED' ? '♻️ החזר לפעילות' : '📥 העבר לארכיון'}
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
            <div className="form-group">
              <label className="form-label">משך מומלץ (דקות) *</label>
              <input
                type="number"
                min="1"
                placeholder="30"
                value={form.defaultDurationMinutes}
                onChange={(e) => setForm({ ...form, defaultDurationMinutes: e.target.value })}
                required
              />
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
                המשך והמחיר בפועל נקבעים על ידי נותן השירות.
              </div>
            </div>

            <RequirementsEditor
              key={editingId ?? 'new'}
              value={requirements}
              onChange={setRequirements}
              docTypes={documentTypes}
              initialMode={reqInitialMode}
            />

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
