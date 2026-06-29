import { useState } from 'react';
import CreateLeadForm from '../components/CreateLeadForm';
import LeadListView from '../components/LeadListView';
import LeadDetailsView from '../components/LeadDetailsView';
import WorkQueue from '../components/WorkQueue';

export default function CRMPage({ user, setView }) {
  const [currentView, setCurrentView] = useState('queue'); // 'queue', 'list', 'create', or 'details'
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [createdLead, setCreatedLead] = useState(null);

  function handleSuccess(lead) {
    setCreatedLead(lead);
    setSuccessMessage('הליד נוצר בהצלחה!');
    setTimeout(() => {
      setSuccessMessage('');
      setCreatedLead(null);
      setCurrentView('queue'); // Return to work queue after success
    }, 3000);
  }

  function handleCreateNew() {
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
    setCurrentView('details');
  }

  if (successMessage && createdLead) {
    return (
      <div style={{ padding: 'var(--space-6)', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{
          padding: 'var(--space-6)',
          background: 'var(--success-light)',
          border: '2px solid var(--success)',
          borderRadius: 'var(--radius-lg)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)' }}>✅</div>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)', color: 'var(--success-dark)' }}>
            {successMessage}
          </h2>
          <div style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)' }}>
            {createdLead.businessName}
          </div>

          {createdLead.registrationStatus === 'REGISTERED' && (
            <div style={{
              padding: 'var(--space-4)',
              background: 'white',
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
            <button
              className="btn-primary"
              onClick={() => {
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
        onBack={handleBackToQueue}
        onCreateNew={handleCreateNew}
      />
    );
  }

  if (currentView === 'list') {
    return (
      <div style={{ padding: 'var(--space-6)' }}>
        <LeadListView
          onCreateNew={handleCreateNew}
          onViewLead={handleViewLead}
        />
      </div>
    );
  }

  if (currentView === 'queue') {
    return (
      <WorkQueue
        onViewLead={handleViewLead}
        onCreateNew={handleCreateNew}
      />
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
