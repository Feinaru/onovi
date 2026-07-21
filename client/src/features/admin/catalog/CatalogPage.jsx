import React, { useCallback, useEffect, useRef, useState } from 'react';
import FieldsTab from './FieldsTab';
import ProfessionsTab from './ProfessionsTab';
import ServicesTab from './ServicesTab';
import DocumentTypesTab from './DocumentTypesTab';
import CatalogToast from './CatalogToast';
import { listFields, listProfessions, listServiceTemplates } from './catalogApi';
import { listDocumentTypes } from './documentsApi';
import { toHebrewError } from './catalogErrors';

const TABS = [
  { id: 'fields', label: 'תחומים', icon: '🗂️' },
  { id: 'professions', label: 'מקצועות', icon: '🧰' },
  { id: 'services', label: 'שירותים', icon: '🛎️' },
  { id: 'documentTypes', label: 'סוגי מסמכים', icon: '📄' }
];

export default function CatalogPage() {
  const [activeTab, setActiveTab] = useState('fields');
  const [fields, setFields] = useState([]);
  const [professions, setProfessions] = useState([]);
  const [serviceTemplates, setServiceTemplates] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', text }
  const toastTimer = useRef(null);

  const reload = useCallback(async () => {
    // Document types are loaded across all statuses so the "סוגי מסמכים" tab can
    // show archived ones; the requirements editor filters to ACTIVE itself.
    const [fieldsData, professionsData, serviceTemplatesData, documentTypesData] = await Promise.all([
      listFields(),
      listProfessions(),
      listServiceTemplates(),
      listDocumentTypes()
    ]);
    setFields(fieldsData);
    setProfessions(professionsData);
    setServiceTemplates(serviceTemplatesData);
    setDocumentTypes(documentTypesData);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError('');
      try {
        await reload();
      } catch (err) {
        if (!cancelled) setLoadError(toHebrewError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [reload]);

  // Bottom-right toast feedback. A single active toast, auto-dismissed; a new
  // toast replaces the previous one (and its pending timer).
  const showToast = useCallback((type, text) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ type, text });
    toastTimer.current = setTimeout(() => setToast(null), type === 'error' ? 5000 : 3000);
  }, []);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const onSuccess = useCallback((text) => showToast('success', text), [showToast]);
  const onError = useCallback(
    (err, context) => showToast('error', toHebrewError(err, context)),
    [showToast]
  );

  const tabProps = {
    fields,
    professions,
    serviceTemplates,
    documentTypes,
    onReload: reload,
    onSuccess,
    onError
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">קטלוג</h1>
        <p className="page-description">ניהול תחומים, מקצועות ושירותים שמופיעים במערכת</p>
      </div>

      <div className="card">
        <div
          className="flex gap-2"
          style={{
            marginBottom: 'var(--space-6)',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: 'var(--space-3)',
            flexWrap: 'wrap'
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setActiveTab(tab.id)}
            >
              <span style={{ marginInlineEnd: 'var(--space-2)' }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
            <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)' }}>⏳</div>
            <div style={{ fontSize: 'var(--text-lg)', color: 'var(--text-secondary)' }}>טוען קטלוג...</div>
          </div>
        )}

        {!loading && loadError && (
          <div className="empty-state">
            <div className="empty-state-icon">⚠️</div>
            <div className="empty-state-title">שגיאה בטעינת הקטלוג</div>
            <div className="empty-state-description">{loadError}</div>
          </div>
        )}

        {!loading && !loadError && (
          <>
            {activeTab === 'fields' && <FieldsTab {...tabProps} />}
            {activeTab === 'professions' && <ProfessionsTab {...tabProps} />}
            {activeTab === 'services' && <ServicesTab {...tabProps} />}
            {activeTab === 'documentTypes' && <DocumentTypesTab {...tabProps} />}
          </>
        )}
      </div>

      <CatalogToast toast={toast} />
    </div>
  );
}
