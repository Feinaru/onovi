import React, { useCallback, useEffect, useState } from 'react';
import FieldsTab from './FieldsTab';
import ProfessionsTab from './ProfessionsTab';
import ServicesTab from './ServicesTab';
import { listFields, listProfessions, listServiceTemplates } from './catalogApi';
import { toHebrewError } from './catalogErrors';

const TABS = [
  { id: 'fields', label: 'תחומים', icon: '🗂️' },
  { id: 'professions', label: 'מקצועות', icon: '🧰' },
  { id: 'services', label: 'שירותים', icon: '🛎️' }
];

export default function CatalogPage() {
  const [activeTab, setActiveTab] = useState('fields');
  const [fields, setFields] = useState([]);
  const [professions, setProfessions] = useState([]);
  const [serviceTemplates, setServiceTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const reload = useCallback(async () => {
    const [fieldsData, professionsData, serviceTemplatesData] = await Promise.all([
      listFields(),
      listProfessions(),
      listServiceTemplates()
    ]);
    setFields(fieldsData);
    setProfessions(professionsData);
    setServiceTemplates(serviceTemplatesData);
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

  // Notifications passed to tabs. Auto-clear so banners don't pile up.
  const onSuccess = useCallback((text) => {
    setError('');
    setMsg(text);
    setTimeout(() => setMsg(''), 3000);
  }, []);

  const onError = useCallback((err, context) => {
    setMsg('');
    setError(toHebrewError(err, context));
    setTimeout(() => setError(''), 5000);
  }, []);

  const tabProps = {
    fields,
    professions,
    serviceTemplates,
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

      {error && (
        <div style={{
          padding: 'var(--space-4)',
          background: 'var(--danger-50)',
          color: 'var(--danger-700)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 'var(--space-6)',
          border: '1px solid var(--danger-200)'
        }}>
          ⚠️ {error}
        </div>
      )}
      {msg && (
        <div style={{
          padding: 'var(--space-4)',
          background: 'var(--success-50)',
          color: 'var(--success-700)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 'var(--space-6)',
          border: '1px solid var(--success-200)'
        }}>
          ✓ {msg}
        </div>
      )}

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
          </>
        )}
      </div>
    </div>
  );
}
