/**
 * ComingSoonPage - Placeholder for future features
 */
export default function ComingSoonPage({ pageName, icon }) {
  return (
    <div className="empty-state" style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="empty-state-icon" style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>
          {icon}
        </div>
        <div className="empty-state-title" style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-3)' }}>
          {pageName}
        </div>
        <div className="empty-state-description">
          תכונה זו תהיה זמינה בקרוב
        </div>
        <div style={{ marginTop: 'var(--space-6)' }}>
          <span className="badge badge-primary" style={{ fontSize: 'var(--text-base)', padding: 'var(--space-2) var(--space-4)' }}>
            בפיתוח
          </span>
        </div>
      </div>
    </div>
  );
}
