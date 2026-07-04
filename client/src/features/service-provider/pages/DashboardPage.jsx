/**
 * DashboardPage - Service Provider Dashboard
 * Shows welcome message, approval status, and quick overview
 */
export default function DashboardPage({ user, approvalStatus }) {
  function renderApprovalStatusCard() {
    if (!approvalStatus) {
      return (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">סטטוס אישור</h3>
          </div>
          <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)' }}>טוען נתונים...</p>
          </div>
        </div>
      );
    }

    const statusConfig = {
      DRAFT: {
        icon: '📝',
        title: 'טיוטה',
        message: 'ההרשמה שלך בטיוטה. השלם את הפרטים והגש לאישור.',
        color: 'var(--text-secondary)',
        bgColor: 'var(--bg-secondary)'
      },
      PENDING_APPROVAL: {
        icon: '⏳',
        title: 'ממתין לאישור',
        message: 'הבקשה שלך נשלחה ונמצאת בבדיקה. נעדכן אותך בהקדם.',
        color: 'var(--warning-700)',
        bgColor: 'var(--warning-50)'
      },
      APPROVED: {
        icon: '✅',
        title: 'מאושר',
        message: 'העסק שלך אושר! אתה יכול להתחיל לנהל את השירותים והזמינות.',
        color: 'var(--success-700)',
        bgColor: 'var(--success-50)'
      },
      REJECTED: {
        icon: '❌',
        title: 'נדחה',
        message: approvalStatus.adminNote || 'הבקשה נדחתה. אנא צור קשר עם התמיכה.',
        color: 'var(--danger-700)',
        bgColor: 'var(--danger-50)'
      }
    };

    const config = statusConfig[approvalStatus.status] || statusConfig.DRAFT;

    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">סטטוס אישור</h3>
        </div>
        <div style={{
          padding: 'var(--space-6)',
          background: config.bgColor,
          borderRadius: 'var(--radius-lg)',
          margin: 'var(--space-4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)' }}>
            <div style={{ fontSize: '3rem' }}>{config.icon}</div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, marginBottom: 'var(--space-2)', color: config.color, fontWeight: 'var(--font-semibold)' }}>
                {config.title}
              </h4>
              <p style={{ margin: 0, color: config.color }}>
                {config.message}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Welcome Card */}
      <div className="card">
        <div style={{ padding: 'var(--space-6)' }}>
          <h1 style={{ margin: 0, marginBottom: 'var(--space-2)', fontSize: 'var(--text-3xl)' }}>
            שלום, {user.fullName} 👋
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 'var(--text-lg)' }}>
            ברוכים הבאים לאזור העבודה שלך
          </p>
        </div>
      </div>

      {/* Approval Status */}
      {renderApprovalStatusCard()}

      {/* Quick Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-4)' }}>
        <div className="card">
          <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-2)' }}>✂️</div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-1)' }}>
              -
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
              שירותים
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-2)' }}>📄</div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-1)' }}>
              -
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
              מסמכים
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-2)' }}>✓</div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-1)' }}>
              -
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
              הסכמות
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">פעולות מהירות</h3>
        </div>
        <div style={{ padding: 'var(--space-6)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <button className="btn-secondary" disabled>
            ➕ הוסף שירות חדש
          </button>
          <button className="btn-secondary" disabled>
            📄 העלה מסמך
          </button>
          <button className="btn-secondary" disabled>
            📅 נהל זמינות
          </button>
        </div>
        <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
          <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', textAlign: 'center' }}>
            תכונות אלה יהיו זמינות בקרוב
          </p>
        </div>
      </div>
    </div>
  );
}
