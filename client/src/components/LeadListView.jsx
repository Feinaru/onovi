import { useState, useEffect } from 'react';
import { api } from '../api';

export default function LeadListView({ onCreateNew, onViewLead }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadLeads();
  }, []);

  async function loadLeads() {
    setLoading(true);
    setError('');
    try {
      const data = await api('/api/leads');
      setLeads(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(status) {
    const statusConfig = {
      NEW: { label: 'חדש', color: 'primary' },
      CONTACTED: { label: 'נוצר קשר', color: 'primary' },
      INTERESTED: { label: 'מעוניין', color: 'success' },
      MEETING_SCHEDULED: { label: 'פגישה קבועה', color: 'warning' },
      PROPOSAL_SENT: { label: 'הצעה נשלחה', color: 'warning' },
      CLOSED_WON: { label: 'נסגר בהצלחה', color: 'success' },
      CLOSED_LOST: { label: 'נסגר ללא הצלחה', color: 'danger' },
      INACTIVE: { label: 'לא פעיל', color: 'gray' }
    };

    const config = statusConfig[status] || { label: status, color: 'gray' };
    return <span className={`badge badge-${config.color}`}>{config.label}</span>;
  }

  function getIdentifierTypeLabel(type) {
    const labels = {
      ISRAELI_ID: 'ת.ז.',
      COMPANY_NUMBER: 'ח.פ.',
      AUTHORIZED_DEALER: 'עוסק מורשה',
      EXEMPT_DEALER: 'עוסק פטור'
    };
    return labels[type] || type;
  }

  function getPriorityIndicator(priority) {
    if (priority >= 1000) return '🚨'; // Critical
    if (priority >= 500) return '🎉'; // Registered
    if (priority >= 300) return '🆕'; // New
    if (priority >= 200) return '⚠️'; // Inactive
    if (priority >= 150) return '⏰'; // Upcoming
    return '';
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'היום';
    if (diffDays === 1) return 'אתמול';
    if (diffDays < 7) return `לפני ${diffDays} ימים`;
    if (diffDays < 30) return `לפני ${Math.floor(diffDays / 7)} שבועות`;
    return date.toLocaleDateString('he-IL');
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
        <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)' }}>⏳</div>
        <div style={{ color: 'var(--text-secondary)' }}>טוען לידים...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
        <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)' }}>❌</div>
        <div style={{ color: 'var(--danger)', marginBottom: 'var(--space-4)' }}>{error}</div>
        <button className="btn-secondary" onClick={loadLeads}>נסה שוב</button>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
        <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)' }}>📋</div>
        <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>
          אין לידים במערכת
        </div>
        <div style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
          צור את הליד הראשון כדי להתחיל
        </div>
        <button className="btn-primary" onClick={onCreateNew}>
          ➕ ליד חדש
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-1)' }}>
            לידים ({leads.length})
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
            רשימת כל הלידים במערכת, ממוינים לפי עדיפות
          </p>
        </div>
        <button className="btn-primary" onClick={onCreateNew}>
          ➕ ליד חדש
        </button>
      </div>

      {/* Lead List */}
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-light)' }}>
              <th style={{ padding: 'var(--space-3)', textAlign: 'right', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}></th>
              <th style={{ padding: 'var(--space-3)', textAlign: 'right', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>שם העסק</th>
              <th style={{ padding: 'var(--space-3)', textAlign: 'right', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>טלפון</th>
              <th style={{ padding: 'var(--space-3)', textAlign: 'right', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>מזהה</th>
              <th style={{ padding: 'var(--space-3)', textAlign: 'right', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>סטטוס</th>
              <th style={{ padding: 'var(--space-3)', textAlign: 'right', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>רישום</th>
              <th style={{ padding: 'var(--space-3)', textAlign: 'right', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>נוצר</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr
                key={lead.id}
                onClick={() => onViewLead(lead.id)}
                style={{
                  borderBottom: '1px solid var(--border-light)',
                  cursor: 'pointer',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                {/* Priority Indicator */}
                <td style={{ padding: 'var(--space-3)', fontSize: 'var(--text-lg)', width: '40px' }}>
                  {getPriorityIndicator(lead.priority)}
                </td>

                {/* Business Name */}
                <td style={{ padding: 'var(--space-3)' }}>
                  <div style={{ fontWeight: 'var(--font-medium)' }}>{lead.businessName}</div>
                  {lead.contactPersonName && (
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                      {lead.contactPersonName}
                    </div>
                  )}
                </td>

                {/* Phone */}
                <td style={{ padding: 'var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                  {lead.phone}
                </td>

                {/* Identifier */}
                <td style={{ padding: 'var(--space-3)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                    {getIdentifierTypeLabel(lead.identifierType)}
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', fontFamily: 'monospace' }}>
                    {lead.identifierValue}
                  </div>
                </td>

                {/* Lead Status */}
                <td style={{ padding: 'var(--space-3)' }}>
                  {getStatusBadge(lead.status)}
                </td>

                {/* Registration Status */}
                <td style={{ padding: 'var(--space-3)' }}>
                  {lead.registrationStatus === 'REGISTERED' ? (
                    <span className="badge badge-success">✓ רשום</span>
                  ) : (
                    <span className="badge badge-gray">לא רשום</span>
                  )}
                </td>

                {/* Created Date */}
                <td style={{ padding: 'var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                  {formatDate(lead.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
