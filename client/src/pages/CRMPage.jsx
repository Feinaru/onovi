import { useState, useRef } from 'react';
import CreateLeadForm from '../components/CreateLeadForm';
import LeadListView from '../components/LeadListView';
import LeadDetailsView from '../components/LeadDetailsView';
import WorkQueue from '../components/WorkQueue';

export default function CRMPage({ user, setView }) {
  const [currentView, setCurrentView] = useState('queue'); // 'queue', 'list', 'create', or 'details'
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [createdLead, setCreatedLead] = useState(null);
  const [detailsOrigin, setDetailsOrigin] = useState('queue'); // where 'details' was opened from ('queue' | 'list')
  const successTimeoutRef = useRef(null);

  function clearSuccessTimeout() {
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
    }
  }

  function handleSuccess(lead) {
    setCreatedLead(lead);
    setSuccessMessage('הליד נוצר בהצלחה!');
    clearSuccessTimeout();
    successTimeoutRef.current = setTimeout(() => {
      setSuccessMessage('');
      setCreatedLead(null);
      setCurrentView('queue'); // Return to work queue after success
    }, 3000);
  }

  // Open the just-created lead in the existing details view.
  function handleEditCreatedLead() {
    clearSuccessTimeout();
    const leadId = createdLead?.id;
    setSuccessMessage('');
    setCreatedLead(null);
    if (leadId != null) {
      setSelectedLeadId(leadId);
      setDetailsOrigin('queue');
      setCurrentView('details');
    }
  }

  function handleCreateNew() {
    clearSuccessTimeout();
    setCurrentView('create');
    setSuccessMessage('');
    setCreatedLead(null);
  }

  function handleBackToQueue() {
    setCurrentView('queue');
    setSelectedLeadId(null);
    setSuccessMessage('');
    setCreatedLead(null);
  }

  function handleViewLead(leadId) {
    setSelectedLeadId(leadId);
    setDetailsOrigin(currentView === 'list' ? 'list' : 'queue');
    setCurrentView('details');
  }

  function handleBackFromDetails() {
    setSelectedLeadId(null);
    setCurrentView(detailsOrigin === 'list' ? 'list' : 'queue');
  }

  if (successMessage && createdLead) {
    return (
      <div style={{ padding: 'var(--space-6)', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{
          padding: 'var(--space-6)',
          background: 'var(--success-50)',
          border: '2px solid var(--success-600)',
          borderRadius: 'var(--radius-lg)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)' }}>✅</div>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)', color: 'var(--success-700)' }}>
            {successMessage}
          </h2>
          <div style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)' }}>
            {createdLead.businessName}
          </div>

          {createdLead.registrationStatus === 'REGISTERED' && (
            <div style={{
              padding: 'var(--space-4)',
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-4)'
            }}>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                🎉 הליד הזה כבר רשום כעסק במערכת!
              </div>
              <div style={{ fontWeight: 'var(--font-semibold)' }}>
                {createdLead.linkedBusiness?.name}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', marginTop: 'var(--space-6)' }}>
            {createdLead.id != null && (
              <button
                className="btn-primary"
                onClick={handleEditCreatedLead}
              >
                פתח פרטי ליד
              </button>
            )}
            <button
              className="btn-secondary"
              onClick={() => {
                clearSuccessTimeout();
                setSuccessMessage('');
                setCreatedLead(null);
              }}
            >
              צור ליד נוסף
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'details') {
    return (
      <LeadDetailsView
        leadId={selectedLeadId}
        onBack={handleBackFromDetails}
        onCreateNew={handleCreateNew}
      />
    );
  }

  // Main CRM views (queue / list) share a tab switcher.
  if (currentView === 'queue' || currentView === 'list') {
    const crmTabs = (
      <div
        role="group"
        aria-label="ניווט CRM"
        style={{ display: 'flex', gap: 'var(--space-2)', padding: 'var(--space-6)', paddingBottom: 0 }}
      >
        <button
          className={currentView === 'queue' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setCurrentView('queue')}
        >
          תור העבודה
        </button>
        <button
          className={currentView === 'list' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setCurrentView('list')}
        >
          כל הלידים
        </button>
      </div>
    );

    return (
      <div>
        {crmTabs}
        {currentView === 'list' ? (
          <div style={{ padding: 'var(--space-6)' }}>
            <LeadListView
              onCreateNew={handleCreateNew}
              onViewLead={handleViewLead}
            />
          </div>
        ) : (
          <WorkQueue
            onViewLead={handleViewLead}
            onCreateNew={handleCreateNew}
          />
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-6)' }}>
      <CreateLeadForm
        onSuccess={handleSuccess}
        onCancel={handleBackToQueue}
      />
    </div>
  );
}
