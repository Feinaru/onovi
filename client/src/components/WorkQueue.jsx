import { useState, useEffect } from 'react';
import { api } from '../api';

export default function WorkQueue({ onViewLead, onCreateNew }) {
  const [queue, setQueue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchQueue();
  }, []);

  async function fetchQueue() {
    setLoading(true);
    setError(null);
    try {
      const data = await api('/api/leads/work-queue');
      setQueue(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString) {
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

  function formatLastContacted(dateString) {
    if (!dateString) return 'אף פעם';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'היום';
    if (diffDays === 1) return 'אתמול';
    if (diffDays < 7) return `לפני ${diffDays} ימים`;
    if (diffDays < 30) return `לפני ${Math.floor(diffDays / 7)} שבועות`;
    if (diffDays < 365) return `לפני ${Math.floor(diffDays / 30)} חודשים`;
    return date.toLocaleDateString('he-IL', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function getStatusLabel(status) {
    const labels = {
      NEW: 'חדש',
      CONTACTED: 'יצר קשר',
      INTERESTED: 'מעוניין',
      MEETING_SCHEDULED: 'נקבעה פגישה',
      PROPOSAL_SENT: 'נשלחה הצעה',
      CLOSED_WON: 'נסגר בהצלחה',
      CLOSED_LOST: 'נסגר ללא הצלחה',
      INACTIVE: 'לא פעיל'
    };
    return labels[status] || status;
  }

  function getStatusColor(status) {
    const colors = {
      NEW: '#3b82f6',
      CONTACTED: '#8b5cf6',
      INTERESTED: '#10b981',
      MEETING_SCHEDULED: '#f59e0b',
      PROPOSAL_SENT: '#06b6d4',
      CLOSED_WON: '#22c55e',
      CLOSED_LOST: '#ef4444',
      INACTIVE: '#9ca3af'
    };
    return colors[status] || '#6b7280';
  }

  function getPriorityBadge(priority) {
    if (priority === 'HIGH') {
      return { icon: '🔴', label: 'עדיפות גבוהה' };
    }
    if (priority === 'MEDIUM') {
      return { icon: '🟡', label: 'עדיפות בינונית' };
    }
    return { icon: '⚪', label: 'עדיפות נמוכה' };
  }

  function LeadCard({ lead, accentColor = '#e5e7eb' }) {
    const priorityBadge = getPriorityBadge(lead.priority);

    return (
      <div
        onClick={() => onViewLead(lead.id)}
        style={{
          backgroundColor: 'white',
          padding: 'var(--space-4)',
          borderRadius: 'var(--radius-2)',
          borderLeft: `4px solid ${accentColor}`,
          cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>
              {lead.businessName}
            </h3>
            <div style={{ fontSize: '0.9rem', color: '#666', marginTop: 'var(--space-1)' }}>
              {lead.phone}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
            <span style={{ fontSize: '1rem' }} title={priorityBadge.label}>
              {priorityBadge.icon}
            </span>
            <div style={{
              padding: 'var(--space-1) var(--space-2)',
              backgroundColor: getStatusColor(lead.status) + '20',
              color: getStatusColor(lead.status),
              borderRadius: 'var(--radius-1)',
              fontSize: '0.75rem',
              fontWeight: '600'
            }}>
              {getStatusLabel(lead.status)}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: '0.85rem' }}>
          {lead.nextAction && lead.nextActionAt && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span>📌</span>
              <span style={{ fontWeight: '500' }}>{lead.nextAction}</span>
              <span style={{ color: '#666' }}>· {formatDate(lead.nextActionAt)}</span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: '#666' }}>
            <span>🕒</span>
            <span>יצירת קשר אחרונה: {formatLastContacted(lead.lastContactedAt)}</span>
          </div>

          {lead.linkedBusiness && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span>✅</span>
              <span style={{ color: '#22c55e', fontSize: '0.85rem', fontWeight: '500' }}>
                רשום במערכת
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  function QueueSection({ title, leads, emptyMessage, accentColor, icon }) {
    return (
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h2 style={{ margin: 0, marginBottom: 'var(--space-4)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span>{icon}</span>
          <span>{title}</span>
          <span style={{ fontSize: '0.9rem', color: '#999', fontWeight: 'normal' }}>
            ({leads.length})
          </span>
        </h2>

        {leads.length === 0 ? (
          <div style={{
            padding: 'var(--space-4)',
            backgroundColor: '#f9fafb',
            borderRadius: 'var(--radius-2)',
            color: '#999',
            textAlign: 'center'
          }}>
            {emptyMessage}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {leads.map(lead => (
              <LeadCard key={lead.id} lead={lead} accentColor={accentColor} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: 'var(--space-4)' }}>⏳</div>
        <div>טוען תור עבודה...</div>
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
          marginBottom: 'var(--space-4)'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>❌</div>
          <div>{error}</div>
        </div>
      </div>
    );
  }

  if (!queue) return null;

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <h1 style={{ margin: 0, fontSize: '2rem' }}>תור העבודה שלך</h1>
        <button
          onClick={onCreateNew}
          style={{
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: 'var(--accent-9)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-2)',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: '500'
          }}
        >
          + ליד חדש
        </button>
      </div>

      <QueueSection
        title="באיחור"
        icon="🔴"
        leads={queue.overdue}
        emptyMessage="אין פעולות באיחור"
        accentColor="#ef4444"
      />

      <QueueSection
        title="היום"
        icon="🟡"
        leads={queue.today}
        emptyMessage="אין מעקבים מתוזמנים להיום"
        accentColor="#f59e0b"
      />

      <QueueSection
        title="לידים חדשים"
        icon="🟢"
        leads={queue.newLeads}
        emptyMessage="אין לידים חדשים"
        accentColor="#3b82f6"
      />

      <QueueSection
        title="פעילים לאחרונה"
        icon="⚪"
        leads={queue.recent}
        emptyMessage="אין פעילות אחרונה"
        accentColor="#e5e7eb"
      />
    </div>
  );
}
