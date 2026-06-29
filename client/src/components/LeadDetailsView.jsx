import { useState, useEffect } from 'react';
import { api } from '../api';

export default function LeadDetailsView({ leadId, onBack, onCreateNew }) {
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [noteContent, setNoteContent] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [loggingAction, setLoggingAction] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState(false);
  const [followUpAction, setFollowUpAction] = useState('שיחה');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('10:00');
  const [savingFollowUp, setSavingFollowUp] = useState(false);
  const [showFollowUpSuggestion, setShowFollowUpSuggestion] = useState(false);
  const [lastActionType, setLastActionType] = useState(null);

  useEffect(() => {
    async function fetchLead() {
      setLoading(true);
      setError(null);
      try {
        const data = await api(`/api/leads/${leadId}`);
        setLead(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchLead();
  }, [leadId]);

  function formatDate(dateString) {
    if (!dateString) return 'לא זמין';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'היום';
    if (diffDays === 1) return 'אתמול';
    if (diffDays < 7) return `לפני ${diffDays} ימים`;
    if (diffDays < 30) return `לפני ${Math.floor(diffDays / 7)} שבועות`;
    if (diffDays < 365) return `לפני ${Math.floor(diffDays / 30)} חודשים`;
    return date.toLocaleDateString('he-IL');
  }

  function getStatusBadge(status) {
    const statusMap = {
      NEW: { label: 'חדש', color: '#6b7280' },
      CONTACTED: { label: 'יצר קשר', color: '#3b82f6' },
      INTERESTED: { label: 'מעוניין', color: '#8b5cf6' },
      MEETING_SCHEDULED: { label: 'נקבעה פגישה', color: '#f59e0b' },
      PROPOSAL_SENT: { label: 'נשלחה הצעה', color: '#06b6d4' },
      CLOSED_WON: { label: 'נסגר בהצלחה', color: '#22c55e' },
      CLOSED_LOST: { label: 'נסגר ללא הצלחה', color: '#ef4444' },
      INACTIVE: { label: 'לא פעיל', color: '#9ca3af' }
    };
    const { label, color } = statusMap[status] || { label: status, color: '#6b7280' };
    return { label, color };
  }

  function getIdentifierTypeLabel(type) {
    const labels = {
      ISRAELI_ID: 'תעודת זהות',
      COMPANY_NUMBER: 'ח.פ',
      AUTHORIZED_DEALER: 'עוסק מורשה',
      EXEMPT_DEALER: 'עוסק פטור'
    };
    return labels[type] || type;
  }

  function getRegistrationStatusBadge(isRegistered) {
    if (isRegistered) {
      return { label: 'רשום במערכת', color: '#22c55e' };
    }
    return { label: 'לא רשום', color: '#6b7280' };
  }

  function getPriorityBadge(priority) {
    if (priority === 'HIGH') {
      return { icon: '🔴', label: 'גבוהה', color: '#ef4444' };
    }
    if (priority === 'MEDIUM') {
      return { icon: '🟡', label: 'בינונית', color: '#f59e0b' };
    }
    return { icon: '⚪', label: 'נמוכה', color: '#9ca3af' };
  }

  function getEventIcon(eventType) {
    const icons = {
      LEAD_CREATED: '✨',
      CONTACTED: '📞',
      EMAIL_SENT: '✉️',
      MEETING_SCHEDULED: '📅',
      MEETING_COMPLETED: '✅',
      QUOTE_SENT: '💰',
      FOLLOW_UP: '🔔',
      STATUS_CHANGED: '🔄',
      NOTE_ADDED: '📝',
      REGISTERED: '🎉',
      PHONE_CALL_OUTBOUND: '📞',
      PHONE_CALL_INBOUND: '📞',
      WHATSAPP_SENT: '💬',
      WHATSAPP_RECEIVED: '💬',
      EMAIL_RECEIVED: '✉️',
      PROPOSAL_SENT: '💰',
      FOLLOW_UP_SCHEDULED: '🔔',
      FOLLOW_UP_COMPLETED: '✅'
    };
    return icons[eventType] || '📌';
  }

  async function handleAddNote() {
    if (!noteContent.trim()) return;

    setAddingNote(true);
    try {
      await api(`/api/leads/${leadId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ content: noteContent.trim() })
      });

      // Clear the input
      setNoteContent('');

      // Refresh lead data to get updated timeline
      const data = await api(`/api/leads/${leadId}`);
      setLead(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setAddingNote(false);
    }
  }

  async function handleStatusChange(newStatus) {
    if (changingStatus) return;

    setChangingStatus(true);
    try {
      const data = await api(`/api/leads/${leadId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });

      // Update lead with response
      setLead(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setChangingStatus(false);
    }
  }

  async function handleQuickAction(action) {
    if (loggingAction) return;

    setLoggingAction(true);
    try {
      const data = await api(`/api/leads/${leadId}/actions`, {
        method: 'POST',
        body: JSON.stringify({ action })
      });

      // Update lead with response
      setLead(data);

      // Show follow-up suggestion after successful action
      setLastActionType(action);
      setShowFollowUpSuggestion(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoggingAction(false);
    }
  }

  function handleEditFollowUp() {
    // Pre-populate with existing values if available
    if (lead.nextAction) {
      setFollowUpAction(lead.nextAction);
    }
    if (lead.nextActionAt) {
      const date = new Date(lead.nextActionAt);
      setFollowUpDate(date.toISOString().split('T')[0]);
      setFollowUpTime(date.toTimeString().substring(0, 5));
    } else {
      // Default to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setFollowUpDate(tomorrow.toISOString().split('T')[0]);
      setFollowUpTime('10:00');
    }
    setEditingFollowUp(true);
  }

  async function handleSaveFollowUp() {
    if (!followUpDate || !followUpTime) return;

    // Validate date is not in the past
    const dateTime = new Date(`${followUpDate}T${followUpTime}`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateTime < today) {
      setError('לא ניתן לתזמן מעקב לתאריך בעבר');
      return;
    }

    setSavingFollowUp(true);
    try {
      const data = await api(`/api/leads/${leadId}/follow-up`, {
        method: 'PATCH',
        body: JSON.stringify({
          nextAction: followUpAction,
          nextActionAt: dateTime.toISOString()
        })
      });

      // Update lead with response
      setLead(data);
      setEditingFollowUp(false);
      setError(null); // Clear any previous errors
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingFollowUp(false);
    }
  }

  function formatFollowUpDate(dateString) {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    const timeStr = date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false });

    if (dateOnly.getTime() === today.getTime()) {
      return `היום · ${timeStr}`;
    }
    if (dateOnly.getTime() === tomorrow.getTime()) {
      return `מחר · ${timeStr}`;
    }
    const dateStr = date.toLocaleDateString('he-IL', { month: 'short', day: 'numeric' });
    return `${dateStr} · ${timeStr}`;
  }

  function getFollowUpIcon(action) {
    const icons = {
      'שיחה': '📞',
      'WhatsApp': '💬',
      'אימייל': '✉️',
      'פגישה': '📅',
      'שלח הצעה': '💰',
      'אחר': '📌'
    };
    return icons[action] || '📌';
  }

  function getActionLabel(actionType) {
    const labels = {
      'CALL': 'שיחה',
      'WHATSAPP': 'WhatsApp',
      'EMAIL': 'אימייל'
    };
    return labels[actionType] || 'שיחה';
  }

  async function handleFollowUpSuggestion(preset) {
    // Close the suggestion
    setShowFollowUpSuggestion(false);

    if (preset === 'skip') {
      return;
    }

    if (preset === 'custom') {
      // Open the existing follow-up editor
      handleEditFollowUp();
      return;
    }

    // Calculate the date based on preset
    const now = new Date();
    let targetDate = new Date(now);

    if (preset === 'tomorrow') {
      targetDate.setDate(targetDate.getDate() + 1);
    } else if (preset === '3days') {
      targetDate.setDate(targetDate.getDate() + 3);
    } else if (preset === 'week') {
      targetDate.setDate(targetDate.getDate() + 7);
    }

    // Set time to 10:00
    targetDate.setHours(10, 0, 0, 0);

    // Get the action label based on the last action type
    const actionLabel = getActionLabel(lastActionType);

    // Create the follow-up
    setSavingFollowUp(true);
    try {
      const data = await api(`/api/leads/${leadId}/follow-up`, {
        method: 'PATCH',
        body: JSON.stringify({
          nextAction: actionLabel,
          nextActionAt: targetDate.toISOString()
        })
      });

      // Update lead with response
      setLead(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingFollowUp(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: 'var(--space-4)' }}>⏳</div>
        <div>טוען פרטי ליד...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 'var(--space-6)' }}>
        <div style={{
          backgroundColor: '#fee',
          padding: 'var(--space-4)',
          borderRadius: 'var(--radius-2)',
          marginBottom: 'var(--space-4)',
          color: '#dc2626'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>❌</div>
          <div>{error}</div>
        </div>
        <button
          onClick={onBack}
          style={{
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-2)',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: '500'
          }}
        >
          חזרה ללידים
        </button>
      </div>
    );
  }

  if (!lead) {
    return (
      <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
        <div style={{ fontSize: '1.2rem', marginBottom: 'var(--space-4)', color: '#666' }}>
          ליד לא נמצא
        </div>
        <button
          onClick={onBack}
          style={{
            marginTop: 'var(--space-4)',
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-2)',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: '500'
          }}
        >
          חזרה ללידים
        </button>
      </div>
    );
  }

  const statusBadge = getStatusBadge(lead.status);
  const registrationBadge = getRegistrationStatusBadge(lead.isRegistered);
  const priorityBadge = getPriorityBadge(lead.priority);

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header with Back Button */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <button
          onClick={onBack}
          style={{
            padding: 'var(--space-2) var(--space-4)',
            backgroundColor: 'transparent',
            color: 'var(--accent-9)',
            border: '1px solid var(--accent-9)',
            borderRadius: 'var(--radius-2)',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          ← חזרה לרשימת לידים
        </button>
      </div>

      {/* Main Info Card */}
      <div style={{
        backgroundColor: 'white',
        padding: 'var(--space-6)',
        borderRadius: 'var(--radius-3)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: 'var(--space-6)'
      }}>
        <h1 style={{ margin: 0, marginBottom: 'var(--space-4)', fontSize: '1.8rem' }}>
          {lead.businessName}
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: 'var(--space-1)' }}>טלפון</div>
            <div style={{ fontWeight: '500' }}>{lead.phone}</div>
          </div>

          {lead.contactPersonName && (
            <div>
              <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: 'var(--space-1)' }}>איש קשר</div>
              <div style={{ fontWeight: '500' }}>{lead.contactPersonName}</div>
            </div>
          )}

          {lead.email && (
            <div>
              <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: 'var(--space-1)' }}>אימייל</div>
              <div style={{ fontWeight: '500' }}>{lead.email}</div>
            </div>
          )}

          <div>
            <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: 'var(--space-1)' }}>
              {getIdentifierTypeLabel(lead.identifierType)}
            </div>
            <div style={{ fontWeight: '500', fontFamily: 'monospace', fontSize: '1rem', direction: 'ltr', textAlign: 'right' }}>
              {lead.identifierValue}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          <span style={{
            padding: 'var(--space-2) var(--space-3)',
            backgroundColor: statusBadge.color,
            color: 'white',
            borderRadius: 'var(--radius-2)',
            fontSize: '0.85rem',
            fontWeight: '500'
          }}>
            {statusBadge.label}
          </span>
          <span style={{
            padding: 'var(--space-2) var(--space-3)',
            backgroundColor: registrationBadge.color,
            color: 'white',
            borderRadius: 'var(--radius-2)',
            fontSize: '0.85rem',
            fontWeight: '500'
          }}>
            {registrationBadge.label}
          </span>
          <span style={{
            padding: 'var(--space-2) var(--space-3)',
            backgroundColor: priorityBadge.color + '20',
            color: priorityBadge.color,
            borderRadius: 'var(--radius-2)',
            fontSize: '0.85rem',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-1)'
          }}>
            <span>{priorityBadge.icon}</span>
            <span>{priorityBadge.label}</span>
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid #eee' }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: 'var(--space-1)' }}>נוצר</div>
            <div>{formatDate(lead.createdAt)}</div>
          </div>
          {lead.lastContactedAt && (
            <div>
              <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: 'var(--space-1)' }}>יצירת קשר אחרונה</div>
              <div>{formatDate(lead.lastContactedAt)}</div>
            </div>
          )}
        </div>

        {lead.linkedBusiness && (
          <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-4)', backgroundColor: '#f0fdf4', borderRadius: 'var(--radius-2)' }}>
            <div style={{ fontSize: '0.85rem', color: '#166534', marginBottom: 'var(--space-2)', fontWeight: '600' }}>
              🎉 עסק רשום במערכת
            </div>
            <div style={{ color: '#166534' }}>
              {lead.linkedBusiness.name}
            </div>
          </div>
        )}
      </div>

      {/* Status Management */}
      <div style={{
        backgroundColor: 'white',
        padding: 'var(--space-6)',
        borderRadius: 'var(--radius-3)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: 'var(--space-6)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
          <h2 style={{ margin: 0, fontSize: '1.3rem' }}>סטטוס</h2>
          <span style={{
            padding: 'var(--space-2) var(--space-4)',
            backgroundColor: statusBadge.color,
            color: 'white',
            borderRadius: 'var(--radius-2)',
            fontSize: '0.9rem',
            fontWeight: '500'
          }}>
            {statusBadge.label}
          </span>
        </div>

        <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: 'var(--space-4)' }}>
          שינוי סטטוס
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-2)' }}>
          {['NEW', 'CONTACTED', 'INTERESTED', 'MEETING_SCHEDULED', 'PROPOSAL_SENT', 'CLOSED_WON', 'CLOSED_LOST'].map(status => {
            const badge = getStatusBadge(status);
            const isCurrent = lead.status === status;
            return (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                disabled={isCurrent || changingStatus}
                style={{
                  padding: 'var(--space-3)',
                  backgroundColor: isCurrent ? badge.color : 'white',
                  color: isCurrent ? 'white' : badge.color,
                  border: `2px solid ${badge.color}`,
                  borderRadius: 'var(--radius-2)',
                  cursor: isCurrent || changingStatus ? 'not-allowed' : 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  opacity: isCurrent ? 1 : (changingStatus ? 0.5 : 1),
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!isCurrent && !changingStatus) {
                    e.target.style.backgroundColor = badge.color;
                    e.target.style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isCurrent && !changingStatus) {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.color = badge.color;
                  }
                }}
              >
                {badge.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{
        backgroundColor: 'white',
        padding: 'var(--space-6)',
        borderRadius: 'var(--radius-3)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: 'var(--space-6)'
      }}>
        <h2 style={{ margin: 0, marginBottom: 'var(--space-4)', fontSize: '1.3rem' }}>
          פעולות מהירות
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)' }}>
          <button
            onClick={() => handleQuickAction('CALL')}
            disabled={loggingAction}
            style={{
              padding: 'var(--space-4)',
              backgroundColor: loggingAction ? '#f3f4f6' : 'white',
              border: '2px solid #3b82f6',
              borderRadius: 'var(--radius-2)',
              cursor: loggingAction ? 'not-allowed' : 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-2)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!loggingAction) {
                e.target.style.backgroundColor = '#eff6ff';
              }
            }}
            onMouseLeave={(e) => {
              if (!loggingAction) {
                e.target.style.backgroundColor = 'white';
              }
            }}
          >
            <span style={{ fontSize: '2rem' }}>📞</span>
            <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#3b82f6' }}>שיחה</span>
          </button>

          <button
            onClick={() => handleQuickAction('WHATSAPP')}
            disabled={loggingAction}
            style={{
              padding: 'var(--space-4)',
              backgroundColor: loggingAction ? '#f3f4f6' : 'white',
              border: '2px solid #22c55e',
              borderRadius: 'var(--radius-2)',
              cursor: loggingAction ? 'not-allowed' : 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-2)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!loggingAction) {
                e.target.style.backgroundColor = '#f0fdf4';
              }
            }}
            onMouseLeave={(e) => {
              if (!loggingAction) {
                e.target.style.backgroundColor = 'white';
              }
            }}
          >
            <span style={{ fontSize: '2rem' }}>💬</span>
            <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#22c55e' }}>WhatsApp</span>
          </button>

          <button
            onClick={() => handleQuickAction('EMAIL')}
            disabled={loggingAction}
            style={{
              padding: 'var(--space-4)',
              backgroundColor: loggingAction ? '#f3f4f6' : 'white',
              border: '2px solid #8b5cf6',
              borderRadius: 'var(--radius-2)',
              cursor: loggingAction ? 'not-allowed' : 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-2)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!loggingAction) {
                e.target.style.backgroundColor = '#faf5ff';
              }
            }}
            onMouseLeave={(e) => {
              if (!loggingAction) {
                e.target.style.backgroundColor = 'white';
              }
            }}
          >
            <span style={{ fontSize: '2rem' }}>✉️</span>
            <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#8b5cf6' }}>אימייל</span>
          </button>
        </div>

        {/* Follow-up Suggestion */}
        {showFollowUpSuggestion && (
          <div style={{
            marginTop: 'var(--space-4)',
            padding: 'var(--space-4)',
            backgroundColor: '#fef3c7',
            borderRadius: 'var(--radius-2)',
            border: '1px solid #fbbf24'
          }}>
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <div style={{ fontWeight: '600', marginBottom: 'var(--space-1)', fontSize: '0.95rem' }}>
                לתזמן מעקב?
              </div>
              <div style={{ fontSize: '0.85rem', color: '#666' }}>
                בחר מתי תרצה ליצור קשר עם הליד הזה שוב
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleFollowUpSuggestion('tomorrow')}
                disabled={savingFollowUp}
                style={{
                  padding: 'var(--space-2) var(--space-3)',
                  backgroundColor: savingFollowUp ? '#f3f4f6' : 'white',
                  border: '1px solid #d97706',
                  borderRadius: 'var(--radius-2)',
                  cursor: savingFollowUp ? 'not-allowed' : 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  color: '#d97706',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!savingFollowUp) {
                    e.target.style.backgroundColor = '#fed7aa';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!savingFollowUp) {
                    e.target.style.backgroundColor = 'white';
                  }
                }}
              >
                מחר
              </button>

              <button
                onClick={() => handleFollowUpSuggestion('3days')}
                disabled={savingFollowUp}
                style={{
                  padding: 'var(--space-2) var(--space-3)',
                  backgroundColor: savingFollowUp ? '#f3f4f6' : 'white',
                  border: '1px solid #d97706',
                  borderRadius: 'var(--radius-2)',
                  cursor: savingFollowUp ? 'not-allowed' : 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  color: '#d97706',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!savingFollowUp) {
                    e.target.style.backgroundColor = '#fed7aa';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!savingFollowUp) {
                    e.target.style.backgroundColor = 'white';
                  }
                }}
              >
                בעוד 3 ימים
              </button>

              <button
                onClick={() => handleFollowUpSuggestion('week')}
                disabled={savingFollowUp}
                style={{
                  padding: 'var(--space-2) var(--space-3)',
                  backgroundColor: savingFollowUp ? '#f3f4f6' : 'white',
                  border: '1px solid #d97706',
                  borderRadius: 'var(--radius-2)',
                  cursor: savingFollowUp ? 'not-allowed' : 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  color: '#d97706',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!savingFollowUp) {
                    e.target.style.backgroundColor = '#fed7aa';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!savingFollowUp) {
                    e.target.style.backgroundColor = 'white';
                  }
                }}
              >
                בעוד שבוע
              </button>

              <button
                onClick={() => handleFollowUpSuggestion('custom')}
                disabled={savingFollowUp}
                style={{
                  padding: 'var(--space-2) var(--space-3)',
                  backgroundColor: savingFollowUp ? '#f3f4f6' : 'white',
                  border: '1px solid #d97706',
                  borderRadius: 'var(--radius-2)',
                  cursor: savingFollowUp ? 'not-allowed' : 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  color: '#d97706',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!savingFollowUp) {
                    e.target.style.backgroundColor = '#fed7aa';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!savingFollowUp) {
                    e.target.style.backgroundColor = 'white';
                  }
                }}
              >
                מותאם אישית
              </button>

              <button
                onClick={() => handleFollowUpSuggestion('skip')}
                disabled={savingFollowUp}
                style={{
                  padding: 'var(--space-2) var(--space-3)',
                  backgroundColor: savingFollowUp ? '#f3f4f6' : 'white',
                  border: '1px solid #9ca3af',
                  borderRadius: 'var(--radius-2)',
                  cursor: savingFollowUp ? 'not-allowed' : 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  color: '#6b7280',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!savingFollowUp) {
                    e.target.style.backgroundColor = '#f3f4f6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!savingFollowUp) {
                    e.target.style.backgroundColor = 'white';
                  }
                }}
              >
                דלג
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Follow-up Section */}
      <div style={{
        backgroundColor: 'white',
        padding: 'var(--space-6)',
        borderRadius: 'var(--radius-3)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: 'var(--space-6)'
      }}>
        <h2 style={{ margin: 0, marginBottom: 'var(--space-4)', fontSize: '1.3rem' }}>
          מעקב
        </h2>

        {!editingFollowUp ? (
          // Display mode
          <div>
            {lead.nextAction && lead.nextActionAt ? (
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                  <span style={{ fontSize: '1.5rem' }}>{getFollowUpIcon(lead.nextAction)}</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: '500' }}>{lead.nextAction}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: '#666' }}>
                  <span style={{ fontSize: '1.2rem' }}>📅</span>
                  <span>{formatFollowUpDate(lead.nextActionAt)}</span>
                  {lead.followUpState === 'OVERDUE' && (
                    <span style={{
                      marginLeft: 'var(--space-2)',
                      padding: 'var(--space-1) var(--space-2)',
                      backgroundColor: '#fee',
                      color: '#dc2626',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      borderRadius: 'var(--radius-1)'
                    }}>
                      באיחור
                    </span>
                  )}
                  {lead.followUpState === 'TODAY' && (
                    <span style={{
                      marginLeft: 'var(--space-2)',
                      padding: 'var(--space-1) var(--space-2)',
                      backgroundColor: '#fef3c7',
                      color: '#d97706',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      borderRadius: 'var(--radius-1)'
                    }}>
                      היום
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ color: '#999', marginBottom: 'var(--space-4)' }}>
                לא נקבע מעקב
              </div>
            )}
            <button
              onClick={handleEditFollowUp}
              style={{
                padding: 'var(--space-2) var(--space-4)',
                backgroundColor: 'var(--accent-9)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-2)',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}
            >
              {lead.nextAction ? 'ערוך' : 'הגדר מעקב'}
            </button>
          </div>
        ) : (
          // Edit mode
          <div>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: '0.9rem', fontWeight: '500' }}>
                פעולה
              </label>
              <select
                value={followUpAction}
                onChange={(e) => setFollowUpAction(e.target.value)}
                disabled={savingFollowUp}
                style={{
                  width: '100%',
                  padding: 'var(--space-3)',
                  fontSize: '0.95rem',
                  border: '1px solid #d1d5db',
                  borderRadius: 'var(--radius-2)',
                  backgroundColor: 'white'
                }}
              >
                <option>שיחה</option>
                <option>WhatsApp</option>
                <option>אימייל</option>
                <option>פגישה</option>
                <option>שלח הצעה</option>
                <option>אחר</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              <div>
                <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: '0.9rem', fontWeight: '500' }}>
                  תאריך
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  disabled={savingFollowUp}
                  style={{
                    width: '100%',
                    padding: 'var(--space-3)',
                    fontSize: '0.95rem',
                    border: '1px solid #d1d5db',
                    borderRadius: 'var(--radius-2)'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: '0.9rem', fontWeight: '500' }}>
                  שעה
                </label>
                <input
                  type="time"
                  value={followUpTime}
                  onChange={(e) => setFollowUpTime(e.target.value)}
                  disabled={savingFollowUp}
                  style={{
                    width: '100%',
                    padding: 'var(--space-3)',
                    fontSize: '0.95rem',
                    border: '1px solid #d1d5db',
                    borderRadius: 'var(--radius-2)'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button
                onClick={handleSaveFollowUp}
                disabled={!followUpDate || !followUpTime || savingFollowUp}
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  backgroundColor: followUpDate && followUpTime && !savingFollowUp ? 'var(--accent-9)' : '#d1d5db',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-2)',
                  cursor: followUpDate && followUpTime && !savingFollowUp ? 'pointer' : 'not-allowed',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}
              >
                {savingFollowUp ? 'שומר...' : 'שמור'}
              </button>
              <button
                onClick={() => setEditingFollowUp(false)}
                disabled={savingFollowUp}
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  backgroundColor: 'white',
                  color: '#666',
                  border: '1px solid #d1d5db',
                  borderRadius: 'var(--radius-2)',
                  cursor: savingFollowUp ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}
              >
                ביטול
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Timeline Section */}
      <div style={{
        backgroundColor: 'white',
        padding: 'var(--space-6)',
        borderRadius: 'var(--radius-3)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: 'var(--space-6)'
      }}>
        <h2 style={{ margin: 0, marginBottom: 'var(--space-4)', fontSize: '1.3rem' }}>
          ציר זמן
        </h2>

        {/* Add Note Input */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="הוסף הערה..."
            disabled={addingNote}
            style={{
              width: '100%',
              minHeight: '80px',
              padding: 'var(--space-3)',
              fontSize: '0.95rem',
              border: '1px solid #d1d5db',
              borderRadius: 'var(--radius-2)',
              resize: 'vertical',
              fontFamily: 'inherit',
              marginBottom: 'var(--space-3)'
            }}
          />
          <button
            onClick={handleAddNote}
            disabled={!noteContent.trim() || addingNote}
            style={{
              padding: 'var(--space-3) var(--space-4)',
              backgroundColor: noteContent.trim() && !addingNote ? 'var(--accent-9)' : '#d1d5db',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-2)',
              cursor: noteContent.trim() && !addingNote ? 'pointer' : 'not-allowed',
              fontSize: '0.95rem',
              fontWeight: '500'
            }}
          >
            {addingNote ? 'מוסיף...' : 'הוסף הערה'}
          </button>
        </div>

        {/* Timeline Events */}
        {lead.timelineEvents && lead.timelineEvents.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {lead.timelineEvents.map((event) => (
              <div
                key={event.id}
                style={{
                  padding: 'var(--space-4)',
                  backgroundColor: '#f9fafb',
                  borderRadius: 'var(--radius-2)',
                  borderRight: '3px solid var(--accent-9)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                  <div style={{ fontSize: '1.5rem' }}>{getEventIcon(event.type)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: 'var(--space-1)' }}>
                      {event.type.replace(/_/g, ' ')}
                    </div>
                    <div style={{ marginBottom: 'var(--space-2)' }}>
                      {event.description}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#999' }}>
                      {formatDate(event.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#999', padding: 'var(--space-4)' }}>
            אין אירועים בציר הזמן
          </div>
        )}
      </div>

    </div>
  );
}
