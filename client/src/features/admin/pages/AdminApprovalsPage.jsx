import React from 'react';
import { api } from '../../../api';
import LoadingState from '../../../shared/ui/LoadingState';
import EmptyState from '../../../shared/ui/EmptyState';

export default function AdminApprovalsPage({ setView }) {
  const [approvals, setApprovals] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [selectedApproval, setSelectedApproval] = React.useState(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [showConfirmModal, setShowConfirmModal] = React.useState(false);
  const [confirmAction, setConfirmAction] = React.useState(null);
  const [rejectReason, setRejectReason] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [messageType, setMessageType] = React.useState('');

  React.useEffect(() => {
    fetchApprovals();
  }, []);

  async function fetchApprovals() {
    try {
      setLoading(true);
      const data = await api('/api/admin/approvals');
      setApprovals(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'שגיאה בטעינת הבקשות');
    } finally {
      setLoading(false);
    }
  }

  async function fetchApprovalDetail(id) {
    try {
      setDetailLoading(true);
      const data = await api(`/api/admin/approvals/${id}`);
      setSelectedApproval(data);
    } catch (err) {
      setMessage(err.message || 'שגיאה בטעינת הפרטים');
      setMessageType('error');
    } finally {
      setDetailLoading(false);
    }
  }

  function handleRowClick(approval) {
    fetchApprovalDetail(approval.id);
  }

  function handleCloseDetail() {
    setSelectedApproval(null);
    setMessage('');
    setRejectReason('');
  }

  function handleApproveClick() {
    setConfirmAction('approve');
    setShowConfirmModal(true);
  }

  function handleRejectClick() {
    setConfirmAction('reject');
    setShowConfirmModal(true);
  }

  function handleCancelConfirm() {
    setShowConfirmModal(false);
    setConfirmAction(null);
    setRejectReason('');
  }

  async function handleConfirmAction() {
    if (confirmAction === 'reject' && (!rejectReason || rejectReason.trim() === '')) {
      setMessage('נא להזין סיבת דחייה');
      setMessageType('error');
      return;
    }

    try {
      setActionLoading(true);
      const endpoint = confirmAction === 'approve' ? 'approve' : 'reject';
      const body = confirmAction === 'reject' ? { adminNote: rejectReason } : {};

      const result = await api(`/api/admin/approvals/${selectedApproval.id}/${endpoint}`, {
        method: 'POST',
        body
      });

      setMessage(result.message || (confirmAction === 'approve' ? 'הבקשה אושרה בהצלחה' : 'הבקשה נדחתה'));
      setMessageType('success');
      setShowConfirmModal(false);
      setConfirmAction(null);
      setRejectReason('');

      // Refresh list and close detail after 2 seconds
      setTimeout(() => {
        fetchApprovals();
        handleCloseDetail();
      }, 2000);
    } catch (err) {
      setMessage(err.message || 'שגיאה בביצוע הפעולה');
      setMessageType('error');
      setActionLoading(false);
    }
  }

  function formatDate(dateString) {
    if (!dateString) return 'לא זמין';
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  function getStatusBadge(status) {
    const styles = {
      PENDING_APPROVAL: { bg: '#fef3c7', color: '#92400e', label: 'ממתין לאישור' },
      APPROVED: { bg: '#d1fae5', color: '#065f46', label: 'אושר' },
      REJECTED: { bg: '#fee2e2', color: '#991b1b', label: 'נדחה' },
      DRAFT: { bg: '#e5e7eb', color: '#374151', label: 'טיוטה' }
    };

    const style = styles[status] || styles.DRAFT;

    return (
      <span style={{
        display: 'inline-block',
        padding: 'var(--space-1) var(--space-2)',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--text-sm)',
        fontWeight: '500',
        backgroundColor: style.bg,
        color: style.color
      }}>
        {style.label}
      </span>
    );
  }

  if (loading) {
    return <LoadingState title="טוען רשימת בקשות..." />;
  }

  if (error) {
    return (
      <div style={{ padding: 'var(--space-4)' }}>
        <p style={{ color: 'var(--danger-color)' }}>{error}</p>
        <button onClick={fetchApprovals} className="btn-primary" style={{ marginTop: 'var(--space-3)' }}>
          נסה שוב
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-4)', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--space-4)'
      }}>
        <h1 style={{ margin: 0 }}>אישורי נותני שירות</h1>
        <button onClick={fetchApprovals} className="btn-secondary">
          רענן
        </button>
      </div>

      {approvals.length === 0 ? (
        <EmptyState
          icon="✓"
          title="אין בקשות ממתינות כרגע"
          description="כל בקשות נותני השירות טופלו. בקשות חדשות יופיעו כאן"
        />
      ) : (
        <div style={{
          background: 'white',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{
                background: 'var(--bg-secondary)',
                borderBottom: '1px solid var(--border-color)'
              }}>
                <th style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: '600' }}>שם העסק</th>
                <th style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: '600' }}>שם נותן השירות</th>
                <th style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: '600' }}>טלפון</th>
                <th style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: '600' }}>עיר</th>
                <th style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: '600' }}>תאריך הגשה</th>
                <th style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: '600' }}>סטטוס</th>
              </tr>
            </thead>
            <tbody>
              {approvals.map((approval) => (
                <tr
                  key={approval.id}
                  onClick={() => handleRowClick(approval)}
                  style={{
                    borderBottom: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                >
                  <td style={{ padding: 'var(--space-3)' }}>
                    {approval.serviceProvider?.name || 'לא זמין'}
                  </td>
                  <td style={{ padding: 'var(--space-3)' }}>
                    {approval.serviceProvider?.owner?.fullName || 'לא זמין'}
                  </td>
                  <td style={{ padding: 'var(--space-3)' }}>
                    {approval.serviceProvider?.phone || 'לא זמין'}
                  </td>
                  <td style={{ padding: 'var(--space-3)' }}>
                    {approval.serviceProvider?.cityNameHebrew || approval.serviceProvider?.city || 'לא זמין'}
                  </td>
                  <td style={{ padding: 'var(--space-3)' }}>{formatDate(approval.createdAt)}</td>
                  <td style={{ padding: 'var(--space-3)' }}>{getStatusBadge(approval.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {selectedApproval && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 'var(--space-4)'
          }}
          onClick={handleCloseDetail}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              padding: 'var(--space-6)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {detailLoading ? (
              <p>טוען פרטים...</p>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
                  <h2 style={{ margin: 0 }}>פרטי בקשה לאישור</h2>
                  <button onClick={handleCloseDetail} className="btn-secondary">סגור</button>
                </div>

                <div style={{ marginBottom: 'var(--space-4)' }}>
                  {getStatusBadge(selectedApproval.status)}
                </div>

                {message && (
                  <div style={{
                    padding: 'var(--space-3)',
                    marginBottom: 'var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    background: messageType === 'error' ? '#fee2e2' : '#d1fae5',
                    color: messageType === 'error' ? '#991b1b' : '#065f46'
                  }}>
                    {message}
                  </div>
                )}

                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <h3>פרטי העסק</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                    <div>
                      <strong>שם:</strong> {selectedApproval.serviceProvider?.name || 'לא זמין'}
                    </div>
                    <div>
                      <strong>טלפון:</strong> {selectedApproval.serviceProvider?.phone || 'לא זמין'}
                    </div>
                    <div>
                      <strong>עיר:</strong> {selectedApproval.serviceProvider?.cityNameHebrew || selectedApproval.serviceProvider?.city || 'לא זמין'}
                    </div>
                    <div>
                      <strong>קטגוריה:</strong> {selectedApproval.serviceProvider?.category?.name || 'לא זמין'}
                    </div>
                  </div>
                  {selectedApproval.serviceProvider?.description && (
                    <div style={{ marginTop: 'var(--space-2)' }}>
                      <strong>תיאור:</strong> {selectedApproval.serviceProvider.description}
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <h3>פרטי נותן השירות</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                    <div>
                      <strong>שם מלא:</strong> {selectedApproval.serviceProvider?.owner?.fullName || 'לא זמין'}
                    </div>
                    <div>
                      <strong>אימייל:</strong> {selectedApproval.serviceProvider?.owner?.email || 'לא זמין'}
                    </div>
                    <div>
                      <strong>טלפון:</strong> {selectedApproval.serviceProvider?.owner?.phone || 'לא זמין'}
                    </div>
                    <div>
                      <strong>תאריך הרשמה:</strong> {formatDate(selectedApproval.serviceProvider?.owner?.createdAt)}
                    </div>
                  </div>
                </div>

                {selectedApproval.serviceProvider?.professions && selectedApproval.serviceProvider.professions.length > 0 && (
                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    <h3>תחומי התמחות</h3>
                    <ul>
                      {selectedApproval.serviceProvider.professions.map((bp) => (
                        <li key={bp.id}>
                          {bp.profession?.field?.nameHebrew || 'לא זמין'} - {bp.profession?.nameHebrew || 'לא זמין'}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedApproval.serviceProvider?.services && selectedApproval.serviceProvider.services.length > 0 && (
                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    <h3>שירותים</h3>
                    <ul>
                      {selectedApproval.serviceProvider.services.map((service) => (
                        <li key={service.id}>
                          {service.serviceTemplate?.nameHebrew || service.name || 'לא זמין'} - {service.durationMinutes} דקות - ₪{service.regularPrice}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedApproval.documents && selectedApproval.documents.length > 0 ? (
                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    <h3>מסמכים</h3>
                    <ul>
                      {selectedApproval.documents.map((doc) => (
                        <li key={doc.id}>
                          {doc.documentType?.nameHebrew || 'מסמך'} - {doc.fileName} ({doc.fileSizeKB} KB) - {getStatusBadge(doc.status)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    <h3>מסמכים</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>לא הועלו מסמכים</p>
                  </div>
                )}

                {selectedApproval.consents && selectedApproval.consents.length > 0 && (
                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    <h3>הסכמות משפטיות</h3>
                    <ul>
                      {selectedApproval.consents.map((consent) => (
                        <li key={consent.id}>
                          {consent.consentType?.titleHe || 'הסכמה'} - אושר ב-{formatDate(consent.agreedAt)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedApproval.adminNote && (
                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    <h3>הערת מנהל</h3>
                    <p>{selectedApproval.adminNote}</p>
                  </div>
                )}

                {selectedApproval.reviewedBy && (
                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    <p><strong>נבדק על ידי:</strong> {selectedApproval.reviewedBy.fullName} ב-{formatDate(selectedApproval.reviewedAt)}</p>
                  </div>
                )}

                {selectedApproval.status === 'PENDING_APPROVAL' && (
                  <div style={{
                    display: 'flex',
                    gap: 'var(--space-3)',
                    marginTop: 'var(--space-4)',
                    paddingTop: 'var(--space-4)',
                    borderTop: '1px solid var(--border-color)'
                  }}>
                    <button
                      onClick={handleApproveClick}
                      className="btn-primary"
                      style={{ flex: 1, background: 'var(--success-color)' }}
                      disabled={actionLoading}
                    >
                      אשר בקשה
                    </button>
                    <button
                      onClick={handleRejectClick}
                      className="btn-secondary"
                      style={{
                        flex: 1,
                        color: 'var(--danger-color)',
                        borderColor: 'var(--danger-color)'
                      }}
                      disabled={actionLoading}
                    >
                      דחה בקשה
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
            padding: 'var(--space-4)'
          }}
          onClick={handleCancelConfirm}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '500px',
              width: '100%',
              padding: 'var(--space-6)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>
              {confirmAction === 'approve' ? 'אישור בקשה' : 'דחיית בקשה'}
            </h3>
            <p>
              {confirmAction === 'approve'
                ? 'האם אתה בטוח שברצונך לאשר את הבקשה? העסק יהפוך לפעיל במערכת.'
                : 'האם אתה בטוח שברצונך לדחות את הבקשה? נא להזין סיבת דחייה.'}
            </p>

            {confirmAction === 'reject' && (
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="סיבת דחייה (חובה)"
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: 'var(--space-2)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 'var(--space-3)',
                  fontFamily: 'inherit'
                }}
              />
            )}

            {message && messageType === 'error' && (
              <div style={{
                padding: 'var(--space-2)',
                marginBottom: 'var(--space-3)',
                borderRadius: 'var(--radius-md)',
                background: '#fee2e2',
                color: '#991b1b'
              }}>
                {message}
              </div>
            )}

            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button
                onClick={handleCancelConfirm}
                className="btn-secondary"
                style={{ flex: 1 }}
                disabled={actionLoading}
              >
                ביטול
              </button>
              <button
                onClick={handleConfirmAction}
                className="btn-primary"
                style={{
                  flex: 1,
                  background: confirmAction === 'approve' ? 'var(--success-color)' : 'var(--danger-color)'
                }}
                disabled={actionLoading}
              >
                {actionLoading ? 'מבצע...' : (confirmAction === 'approve' ? 'אשר' : 'דחה')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
