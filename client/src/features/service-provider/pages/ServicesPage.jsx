/**
 * ServicesPage - Services and Service Groups management
 * Placeholder for Phase 13.2
 */
export default function ServicesPage({ user }) {
  return (
    <div className="empty-state" style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: '500px' }}>
        <div className="empty-state-icon" style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>
          ✂️
        </div>
        <div className="empty-state-title" style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-3)' }}>
          ניהול שירותים
        </div>
        <div className="empty-state-description" style={{ marginBottom: 'var(--space-6)' }}>
          כאן תוכל לנהל את קבוצות השירותים שלך, להוסיף שירותים חדשים, לערוך מחירים ומשך זמן, ולהפעיל/להשבית שירותים.
        </div>
        <div>
          <span className="badge badge-primary" style={{ fontSize: 'var(--text-base)', padding: 'var(--space-2) var(--space-4)' }}>
            Phase 13.2 - בפיתוח
          </span>
        </div>
      </div>
    </div>
  );
}
