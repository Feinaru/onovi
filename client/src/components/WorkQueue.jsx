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

  // Collapse CRM lead statuses into the 5 canonical Lomea badge variants
  // (see docs/LOMEA_DESIGN_SYSTEM.md §4.10 / styles.css .badge-*).
  function getStatusBadgeClass(status) {
    const classes = {
      NEW: 'badge-primary',
      CONTACTED: 'badge-primary',
      INTERESTED: 'badge-success',
      MEETING_SCHEDULED: 'badge-warning',
      PROPOSAL_SENT: 'badge-warning',
      CLOSED_WON: 'badge-success',
      CLOSED_LOST: 'badge-danger',
      INACTIVE: 'badge-gray'
    };
    return classes[status] || 'badge-gray';
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

  function LeadCard({ lead, accentColor = 'var(--border-subtle)' }) {
    const priorityBadge = getPriorityBadge(lead.priority);

    return (
      <div
        onClick={() => onViewLead(lead.id)}
        style={{
          backgroundColor: 'var(--bg-elevated)',
          padding: 'var(--space-4)',
          borderRadius: 'var(--radius-2)',
          borderLeft: `4px solid ${accentColor}`,
          cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: 'var(--shadow-sm)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: '600' }}>
              {lead.businessName}
            </h3>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
              {lead.phone}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-base)' }} title={priorityBadge.label}>
              {priorityBadge.icon}
            </span>
            <span className={`badge ${getStatusBadgeClass(lead.status)}`}>
              {getStatusLabel(lead.status)}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
          {lead.nextAction && lead.nextActionAt && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span>📌</span>
              <span style={{ fontWeight: '500' }}>{lead.nextAction}</span>
              <span style={{ color: 'var(--text-secondary)' }}>· {formatDate(lead.nextActionAt)}</span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--text-secondary)' }}>
            <span>🕒</span>
            <span>יצירת קשר אחרונה: {formatLastContacted(lead.lastContactedAt)}</span>
          </div>

          {lead.linkedBusiness && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span>✅</span>
              <span style={{ color: 'var(--success-600)', fontSize: 'var(--text-sm)', fontWeight: '500' }}>
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
        <h2 style={{ margin: 0, marginBottom: 'var(--space-4)', fontSize: 'var(--text-xl)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span>{icon}</span>
          <span>{title}</span>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', fontWeight: 'normal' }}>
            ({leads.length})
          </span>
        </h2>

        {leads.length === 0 ? (
          <div style={{
            padding: 'var(--space-4)',
            backgroundColor: 'var(--gray-50)',
            borderRadius: 'var(--radius-2)',
            color: 'var(--text-tertiary)',
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
        <div style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-4)' }}>⏳</div>
        <div>טוען תור עבודה...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 'var(--space-6)' }}>
        <div style={{
          backgroundColor: 'var(--danger-50)',
          padding: 'var(--space-4)',
          borderRadius: 'var(--radius-2)',
          marginBottom: 'var(--space-4)'
        }}>
          <div style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-2)' }}>❌</div>
          <div>{error}</div>
        </div>
      </div>
    );
  }

  if (!queue) return null;

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <h1 style={{ margin: 0, fontSize: 'var(--text-3xl)' }}>תור העבודה שלך</h1>
        <button className="btn-primary" onClick={onCreateNew}>
          + ליד חדש
        </button>
      </div>

      <QueueSection
        title="באיחור"
        icon="🔴"
        leads={queue.overdue}
        emptyMessage="אין פעולות באיחור"
        accentColor="var(--border-subtle)"
      />

      <QueueSection
        title="היום"
        icon="🟡"
        leads={queue.today}
        emptyMessage="אין מעקבים מתוזמנים להיום"
        accentColor="var(--border-subtle)"
      />

      <QueueSection
        title="לידים חדשים"
        icon="🟢"
        leads={queue.newLeads}
        emptyMessage="אין לידים חדשים"
        accentColor="var(--border-subtle)"
      />

      <QueueSection
        title="פעילים לאחרונה"
        icon="⚪"
        leads={queue.recent}
        emptyMessage="אין פעילות אחרונה"
        accentColor="var(--border-subtle)"
      />
    </div>
  );
}
