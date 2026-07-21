import { useState, useEffect } from 'react';
import { api } from '../api';

// Terminal statuses remove the lead from the active work queue.
const TERMINAL_STATUSES = ['CLOSED_WON', 'CLOSED_LOST', 'INACTIVE'];

// Feedback copy shown after a successful terminal status change.
const TERMINAL_FEEDBACK = {
  CLOSED_WON: 'הליד נסגר בהצלחה והוסר מתור העבודה. ניתן למצוא אותו בכל הלידים.',
  CLOSED_LOST: 'הליד נסגר ללא הצלחה והוסר מתור העבודה. ניתן למצוא אותו בכל הלידים.',
  INACTIVE: 'הליד סומן כלא פעיל והוסר מתור העבודה. ניתן למצוא אותו בכל הלידים.'
};

export default function LeadDetailsView({ leadId, onBack, onCreateNew }) {
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [pendingStatus, setPendingStatus] = useState(null);
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
      NEW: { label: 'חדש', color: 'var(--gray-500)' },
      CONTACTED: { label: 'יצר קשר', color: 'var(--info-500)' },
      INTERESTED: { label: 'מעוניין', color: 'var(--primary-500)' },
      MEETING_SCHEDULED: { label: 'נקבעה פגישה', color: 'var(--warning-500)' },
      PROPOSAL_SENT: { label: 'נשלחה הצעה', color: 'var(--info-600)' },
      CLOSED_WON: { label: 'נסגר בהצלחה', color: 'var(--success-500)' },
      CLOSED_LOST: { label: 'נסגר ללא הצלחה', color: 'var(--danger-500)' },
      INACTIVE: { label: 'לא פעיל', color: 'var(--gray-400)' }
    };
    const { label, color } = statusMap[status] || { label: status, color: 'var(--gray-500)' };
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
      return { label: 'רשום במערכת', color: 'var(--success-500)' };
    }
    return { label: 'לא רשום', color: 'var(--gray-500)' };
  }

  function getPriorityBadge(priority) {
    if (priority === 'HIGH') {
      return { icon: '🔴', label: 'גבוהה', color: 'var(--danger-600)', bg: 'var(--danger-50)' };
    }
    if (priority === 'MEDIUM') {
      return { icon: '🟡', label: 'בינונית', color: 'var(--warning-600)', bg: 'var(--warning-50)' };
    }
    return { icon: '⚪', label: 'נמוכה', color: 'var(--gray-600)', bg: 'var(--gray-100)' };
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
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setAddingNote(false);
    }
  }

  // Intercept terminal statuses to confirm first; non-terminal statuses change immediately.
  function requestStatusChange(newStatus) {
    if (changingStatus) return;
    if (lead.status === newStatus) return;

    if (TERMINAL_STATUSES.includes(newStatus)) {
      setPendingStatus(newStatus);
    } else {
      handleStatusChange(newStatus);
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

      const text = TERMINAL_STATUSES.includes(newStatus)
        ? TERMINAL_FEEDBACK[newStatus]
        : 'הסטטוס עודכן בהצלחה.';
      setFeedback({ type: 'success', text });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setChangingStatus(false);
      setPendingStatus(null);
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
      setFeedback({ type: 'error', text: err.message });
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
      setFeedback({ type: 'error', text: 'לא ניתן לתזמן מעקב לתאריך בעבר' });
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
      setFeedback(null); // Clear any previous feedback
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
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
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setSavingFollowUp(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
        <div style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-4)' }}>⏳</div>
        <div>טוען פרטי ליד...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 'var(--space-6)' }}>
        <div style={{
          backgroundColor: 'var(--danger-50)',
          padding: 'var(--space-4)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-4)',
          color: 'var(--danger-600)'
        }}>
          <div style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-2)' }}>❌</div>
          <div>{error}</div>
        </div>
        <button
          onClick={onBack}
          style={{
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: 'var(--primary-600)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontSize: 'var(--text-base)',
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
        <div style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)', color: 'var(--text-secondary)' }}>
          ליד לא נמצא
        </div>
        <button
          onClick={onBack}
          style={{
            marginTop: 'var(--space-4)',
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: 'var(--primary-600)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontSize: 'var(--text-base)',
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
      {/* Inline feedback / error banner */}
      {feedback && (
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 'var(--space-3)',
          padding: 'var(--space-4)',
          marginBottom: 'var(--space-4)',
          borderRadius: 'var(--radius-md)',
          backgroundColor: feedback.type === 'success' ? 'var(--success-50)' : 'var(--danger-50)',
          color: feedback.type === 'success' ? 'var(--success-700)' : 'var(--danger-700)',
          fontSize: 'var(--text-sm)',
          fontWeight: '500'
        }}>
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            aria-label="סגור"
            style={{
              flexShrink: 0,
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: 'var(--text-base)',
              lineHeight: 1,
              padding: 0
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Header with Back Button */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <button
          onClick={onBack}
          style={{
            padding: 'var(--space-2) var(--space-4)',
            backgroundColor: 'transparent',
            color: 'var(--primary-600)',
            border: '1px solid var(--primary-600)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontSize: 'var(--text-sm)'
          }}
        >
          ← חזרה לרשימת לידים
        </button>
      </div>

      {/* Main Info Card */}
      <div style={{
        backgroundColor: 'var(--bg-elevated)',
        padding: 'var(--space-6)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: 'var(--space-6)'
      }}>
        <h1 style={{ margin: 0, marginBottom: 'var(--space-4)', fontSize: 'var(--text-3xl)' }}>
          {lead.businessName}
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>טלפון</div>
            <div style={{ fontWeight: '500' }}>{lead.phone}</div>
          </div>

          {lead.contactPersonName && (
            <div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>איש קשר</div>
              <div style={{ fontWeight: '500' }}>{lead.contactPersonName}</div>
            </div>
          )}

          {lead.email && (
            <div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>אימייל</div>
              <div style={{ fontWeight: '500' }}>{lead.email}</div>
            </div>
          )}

          <div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>
              {getIdentifierTypeLabel(lead.identifierType)}
            </div>
            <div style={{ fontWeight: '500', fontFamily: 'monospace', fontSize: 'var(--text-base)', direction: 'ltr', textAlign: 'right' }}>
              {lead.identifierValue}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          <span style={{
            padding: 'var(--space-2) var(--space-3)',
            backgroundColor: statusBadge.color,
            color: 'white',
            borderRadius: 'var(--radius-full)',
            fontSize: 'var(--text-sm)',
            fontWeight: '500'
          }}>
            {statusBadge.label}
          </span>
          <span style={{
            padding: 'var(--space-2) var(--space-3)',
            backgroundColor: registrationBadge.color,
            color: 'white',
            borderRadius: 'var(--radius-full)',
            fontSize: 'var(--text-sm)',
            fontWeight: '500'
          }}>
            {registrationBadge.label}
          </span>
          <span style={{
            padding: 'var(--space-2) var(--space-3)',
            backgroundColor: priorityBadge.bg,
            color: priorityBadge.color,
            borderRadius: 'var(--radius-full)',
            fontSize: 'var(--text-sm)',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-1)'
          }}>
            <span>{priorityBadge.icon}</span>
            <span>{priorityBadge.label}</span>
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-subtle)' }}>
          <div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>נוצר</div>
            <div>{formatDate(lead.createdAt)}</div>
          </div>
          {lead.lastContactedAt && (
            <div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>יצירת קשר אחרונה</div>
              <div>{formatDate(lead.lastContactedAt)}</div>
            </div>
          )}
        </div>

        {lead.linkedBusiness && (
          <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-4)', backgroundColor: 'var(--success-50)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--success-700)', marginBottom: 'var(--space-2)', fontWeight: '600' }}>
              🎉 עסק רשום במערכת
            </div>
            <div style={{ color: 'var(--success-700)' }}>
              {lead.linkedBusiness.name}
            </div>
          </div>
        )}
      </div>

      {/* Status Management */}
      <div style={{
        backgroundColor: 'var(--bg-elevated)',
        padding: 'var(--space-6)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: 'var(--space-6)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
          <h2 style={{ margin: 0, fontSize: 'var(--text-xl)' }}>סטטוס</h2>
          <span style={{
            padding: 'var(--space-2) var(--space-4)',
            backgroundColor: statusBadge.color,
            color: 'white',
            borderRadius: 'var(--radius-full)',
            fontSize: 'var(--text-sm)',
            fontWeight: '500'
          }}>
            {statusBadge.label}
          </span>
        </div>

        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
          שינוי סטטוס
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-2)' }}>
          {['NEW', 'CONTACTED', 'INTERESTED', 'MEETING_SCHEDULED', 'PROPOSAL_SENT', 'CLOSED_WON', 'CLOSED_LOST', 'INACTIVE'].map(status => {
            const badge = getStatusBadge(status);
            const isCurrent = lead.status === status;
            return (
              <button
                key={status}
                onClick={() => requestStatusChange(status)}
                disabled={isCurrent || changingStatus}
                style={{
                  padding: 'var(--space-3)',
                  backgroundColor: isCurrent ? badge.color : 'var(--bg-elevated)',
                  color: isCurrent ? 'white' : badge.color,
                  border: `2px solid ${badge.color}`,
                  borderRadius: 'var(--radius-md)',
                  cursor: isCurrent || changingStatus ? 'not-allowed' : 'pointer',
                  fontSize: 'var(--text-sm)',
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
                    e.target.style.backgroundColor = 'var(--bg-elevated)';
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
        backgroundColor: 'var(--bg-elevated)',
        padding: 'var(--space-6)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: 'var(--space-6)'
      }}>
        <h2 style={{ margin: 0, marginBottom: 'var(--space-4)', fontSize: 'var(--text-xl)' }}>
          פעולות מהירות
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)' }}>
          <button
            onClick={() => handleQuickAction('CALL')}
            disabled={loggingAction}
            style={{
              padding: 'var(--space-4)',
              backgroundColor: loggingAction ? 'var(--gray-100)' : 'var(--bg-elevated)',
              border: '2px solid var(--info-500)',
              borderRadius: 'var(--radius-md)',
              cursor: loggingAction ? 'not-allowed' : 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-2)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!loggingAction) {
                e.target.style.backgroundColor = 'var(--info-50)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loggingAction) {
                e.target.style.backgroundColor = 'var(--bg-elevated)';
              }
            }}
          >
            <span style={{ fontSize: 'var(--text-3xl)' }}>📞</span>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: '500', color: 'var(--info-500)' }}>שיחה</span>
          </button>

          <button
            onClick={() => handleQuickAction('WHATSAPP')}
            disabled={loggingAction}
            style={{
              padding: 'var(--space-4)',
              backgroundColor: loggingAction ? 'var(--gray-100)' : 'var(--bg-elevated)',
              border: '2px solid var(--success-500)',
              borderRadius: 'var(--radius-md)',
              cursor: loggingAction ? 'not-allowed' : 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-2)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!loggingAction) {
                e.target.style.backgroundColor = 'var(--success-50)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loggingAction) {
                e.target.style.backgroundColor = 'var(--bg-elevated)';
              }
            }}
          >
            <span style={{ fontSize: 'var(--text-3xl)' }}>💬</span>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: '500', color: 'var(--success-500)' }}>WhatsApp</span>
          </button>

          <button
            onClick={() => handleQuickAction('EMAIL')}
            disabled={loggingAction}
            style={{
              padding: 'var(--space-4)',
              backgroundColor: loggingAction ? 'var(--gray-100)' : 'var(--bg-elevated)',
              border: '2px solid var(--primary-500)',
              borderRadius: 'var(--radius-md)',
              cursor: loggingAction ? 'not-allowed' : 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-2)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!loggingAction) {
                e.target.style.backgroundColor = 'var(--primary-50)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loggingAction) {
                e.target.style.backgroundColor = 'var(--bg-elevated)';
              }
            }}
          >
            <span style={{ fontSize: 'var(--text-3xl)' }}>✉️</span>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: '500', color: 'var(--primary-500)' }}>אימייל</span>
          </button>
        </div>

        {/* Follow-up Suggestion */}
        {showFollowUpSuggestion && (
          <div style={{
            marginTop: 'var(--space-4)',
            padding: 'var(--space-4)',
            backgroundColor: 'var(--warning-50)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--warning-500)'
          }}>
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <div style={{ fontWeight: '600', marginBottom: 'var(--space-1)', fontSize: 'var(--text-base)' }}>
                לתזמן מעקב?
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                בחר מתי תרצה ליצור קשר עם הליד הזה שוב
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleFollowUpSuggestion('tomorrow')}
                disabled={savingFollowUp}
                style={{
                  padding: 'var(--space-2) var(--space-3)',
                  backgroundColor: savingFollowUp ? 'var(--gray-100)' : 'var(--bg-elevated)',
                  border: '1px solid var(--warning-600)',
                  borderRadius: 'var(--radius-md)',
                  cursor: savingFollowUp ? 'not-allowed' : 'pointer',
                  fontSize: 'var(--text-sm)',
                  fontWeight: '500',
                  color: 'var(--warning-600)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!savingFollowUp) {
                    e.target.style.backgroundColor = 'var(--warning-100)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!savingFollowUp) {
                    e.target.style.backgroundColor = 'var(--bg-elevated)';
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
                  backgroundColor: savingFollowUp ? 'var(--gray-100)' : 'var(--bg-elevated)',
                  border: '1px solid var(--warning-600)',
                  borderRadius: 'var(--radius-md)',
                  cursor: savingFollowUp ? 'not-allowed' : 'pointer',
                  fontSize: 'var(--text-sm)',
                  fontWeight: '500',
                  color: 'var(--warning-600)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!savingFollowUp) {
                    e.target.style.backgroundColor = 'var(--warning-100)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!savingFollowUp) {
                    e.target.style.backgroundColor = 'var(--bg-elevated)';
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
                  backgroundColor: savingFollowUp ? 'var(--gray-100)' : 'var(--bg-elevated)',
                  border: '1px solid var(--warning-600)',
                  borderRadius: 'var(--radius-md)',
                  cursor: savingFollowUp ? 'not-allowed' : 'pointer',
                  fontSize: 'var(--text-sm)',
                  fontWeight: '500',
                  color: 'var(--warning-600)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!savingFollowUp) {
                    e.target.style.backgroundColor = 'var(--warning-100)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!savingFollowUp) {
                    e.target.style.backgroundColor = 'var(--bg-elevated)';
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
                  backgroundColor: savingFollowUp ? 'var(--gray-100)' : 'var(--bg-elevated)',
                  border: '1px solid var(--warning-600)',
                  borderRadius: 'var(--radius-md)',
                  cursor: savingFollowUp ? 'not-allowed' : 'pointer',
                  fontSize: 'var(--text-sm)',
                  fontWeight: '500',
                  color: 'var(--warning-600)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!savingFollowUp) {
                    e.target.style.backgroundColor = 'var(--warning-100)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!savingFollowUp) {
                    e.target.style.backgroundColor = 'var(--bg-elevated)';
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
                  backgroundColor: savingFollowUp ? 'var(--gray-100)' : 'var(--bg-elevated)',
                  border: '1px solid var(--gray-400)',
                  borderRadius: 'var(--radius-md)',
                  cursor: savingFollowUp ? 'not-allowed' : 'pointer',
                  fontSize: 'var(--text-sm)',
                  fontWeight: '500',
                  color: 'var(--gray-600)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!savingFollowUp) {
                    e.target.style.backgroundColor = 'var(--gray-100)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!savingFollowUp) {
                    e.target.style.backgroundColor = 'var(--bg-elevated)';
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
        backgroundColor: 'var(--bg-elevated)',
        padding: 'var(--space-6)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: 'var(--space-6)'
      }}>
        <h2 style={{ margin: 0, marginBottom: 'var(--space-4)', fontSize: 'var(--text-xl)' }}>
          מעקב
        </h2>

        {!editingFollowUp ? (
          // Display mode
          <div>
            {lead.nextAction && lead.nextActionAt ? (
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                  <span style={{ fontSize: 'var(--text-2xl)' }}>{getFollowUpIcon(lead.nextAction)}</span>
                  <span style={{ fontSize: 'var(--text-lg)', fontWeight: '500' }}>{lead.nextAction}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--text-secondary)' }}>
                  <span style={{ fontSize: 'var(--text-lg)' }}>📅</span>
                  <span>{formatFollowUpDate(lead.nextActionAt)}</span>
                  {lead.followUpState === 'OVERDUE' && (
                    <span style={{
                      marginLeft: 'var(--space-2)',
                      padding: 'var(--space-1) var(--space-2)',
                      backgroundColor: 'var(--danger-50)',
                      color: 'var(--danger-600)',
                      fontSize: 'var(--text-xs)',
                      fontWeight: '600',
                      borderRadius: 'var(--radius-full)'
                    }}>
                      באיחור
                    </span>
                  )}
                  {lead.followUpState === 'TODAY' && (
                    <span style={{
                      marginLeft: 'var(--space-2)',
                      padding: 'var(--space-1) var(--space-2)',
                      backgroundColor: 'var(--warning-50)',
                      color: 'var(--warning-600)',
                      fontSize: 'var(--text-xs)',
                      fontWeight: '600',
                      borderRadius: 'var(--radius-full)'
                    }}>
                      היום
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-4)' }}>
                לא נקבע מעקב
              </div>
            )}
            <button
              onClick={handleEditFollowUp}
              style={{
                padding: 'var(--space-2) var(--space-4)',
                backgroundColor: 'var(--primary-600)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontSize: 'var(--text-sm)',
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
              <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', fontWeight: '500' }}>
                פעולה
              </label>
              <select
                value={followUpAction}
                onChange={(e) => setFollowUpAction(e.target.value)}
                disabled={savingFollowUp}
                style={{
                  width: '100%',
                  padding: 'var(--space-3)',
                  fontSize: 'var(--text-base)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-elevated)'
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
                <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', fontWeight: '500' }}>
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
                    fontSize: 'var(--text-base)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 'var(--radius-md)'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', fontWeight: '500' }}>
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
                    fontSize: 'var(--text-base)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 'var(--radius-md)'
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
                  backgroundColor: followUpDate && followUpTime && !savingFollowUp ? 'var(--primary-600)' : 'var(--gray-300)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  cursor: followUpDate && followUpTime && !savingFollowUp ? 'pointer' : 'not-allowed',
                  fontSize: 'var(--text-sm)',
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
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 'var(--radius-md)',
                  cursor: savingFollowUp ? 'not-allowed' : 'pointer',
                  fontSize: 'var(--text-sm)',
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
        backgroundColor: 'var(--bg-elevated)',
        padding: 'var(--space-6)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: 'var(--space-6)'
      }}>
        <h2 style={{ margin: 0, marginBottom: 'var(--space-4)', fontSize: 'var(--text-xl)' }}>
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
              fontSize: 'var(--text-base)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-md)',
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
              backgroundColor: noteContent.trim() && !addingNote ? 'var(--primary-600)' : 'var(--gray-300)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: noteContent.trim() && !addingNote ? 'pointer' : 'not-allowed',
              fontSize: 'var(--text-base)',
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
                  backgroundColor: 'var(--gray-50)',
                  borderRadius: 'var(--radius-md)',
                  borderRight: '3px solid var(--primary-600)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                  <div style={{ fontSize: 'var(--text-2xl)' }}>{getEventIcon(event.type)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>
                      {event.type.replace(/_/g, ' ')}
                    </div>
                    <div style={{ marginBottom: 'var(--space-2)' }}>
                      {event.description}
                    </div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
                      {formatDate(event.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 'var(--space-4)' }}>
            אין אירועים בציר הזמן
          </div>
        )}
      </div>

      {/* Terminal status confirmation modal */}
      {pendingStatus && (
        <div className="modal-backdrop" onClick={() => !changingStatus && setPendingStatus(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <button
              type="button"
              className="modal-close"
              onClick={() => setPendingStatus(null)}
              disabled={changingStatus}
              aria-label="סגור"
            >
              ✕
            </button>
            <div className="modal-header">
              <h3 className="modal-title">שינוי סטטוס</h3>
            </div>
            <p style={{
              margin: 0,
              marginBottom: 'var(--space-6)',
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-base)',
              lineHeight: 1.6
            }}>
              שינוי הסטטוס יסיר את הליד מתור העבודה הפעיל. ניתן יהיה למצוא אותו בכל הלידים. להמשיך?
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button
                type="button"
                onClick={() => handleStatusChange(pendingStatus)}
                disabled={changingStatus}
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  backgroundColor: 'var(--primary-600)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  cursor: changingStatus ? 'not-allowed' : 'pointer',
                  fontSize: 'var(--text-sm)',
                  fontWeight: '500',
                  opacity: changingStatus ? 0.6 : 1
                }}
              >
                {changingStatus ? 'משנה...' : 'אשר שינוי סטטוס'}
              </button>
              <button
                type="button"
                onClick={() => setPendingStatus(null)}
                disabled={changingStatus}
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 'var(--radius-md)',
                  cursor: changingStatus ? 'not-allowed' : 'pointer',
                  fontSize: 'var(--text-sm)',
                  fontWeight: '500'
                }}
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
