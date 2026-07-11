import { useState, useEffect } from 'react';
import { api } from '../../../api';

/**
 * DashboardPage - Service Provider Dashboard
 * Shows welcome message, approval status, and quick overview
 */
export default function DashboardPage({ user, approvalStatus }) {
  const [stats, setStats] = useState({
    pendingCount: 0,
    todayCount: 0,
    weeklyCount: 0,
    weeklyRevenue: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      setLoadingStats(true);
      const bookingsRes = await api('/api/service-provider/bookings');
      const bookingsData = bookingsRes.success && Array.isArray(bookingsRes.data)
        ? bookingsRes.data
        : [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];

      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const pending = bookingsData.filter(b => b.status === 'PENDING').length;
      const todayBookings = bookingsData.filter(b => b.slot?.date === todayStr).length;
      const weeklyBookings = bookingsData.filter(b => {
        if (!b.slot?.date) return false;
        const bookingDate = new Date(b.slot.date);
        return bookingDate >= weekAgo && bookingDate <= today;
      });
      const weeklyRev = weeklyBookings.reduce((sum, b) => sum + (b.price || 0), 0);

      setStats({
        pendingCount: pending,
        todayCount: todayBookings,
        weeklyCount: weeklyBookings.length,
        weeklyRevenue: weeklyRev
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoadingStats(false);
    }
  }

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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <div className="card">
          <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-2)' }}>⏳</div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-1)' }}>
              {loadingStats ? '...' : stats.pendingCount}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
              תורים ממתינים
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-2)' }}>📅</div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-1)' }}>
              {loadingStats ? '...' : stats.todayCount}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
              תורים היום
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-2)' }}>📊</div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-1)' }}>
              {loadingStats ? '...' : stats.weeklyCount}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
              תורים השבוע
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-2)' }}>💰</div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-1)' }}>
              {loadingStats ? '...' : `₪${stats.weeklyRevenue}`}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
              הכנסות השבוע
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">מה כדאי לעשות עכשיו?</h3>
        </div>
        <div style={{ padding: 'var(--space-4)' }}>
          {stats.pendingCount > 0 && (
            <div style={{
              padding: 'var(--space-4)',
              marginBottom: 'var(--space-3)',
              background: 'var(--warning-50)',
              border: '1px solid var(--warning-200)',
              borderRadius: 'var(--radius-md)'
            }}>
              <div style={{ fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-1)', color: 'var(--warning-700)' }}>
                ⏳ יש {stats.pendingCount} תורים ממתינים לאישור
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                עבור לדף ההזמנות כדי לאשר או לדחות תורים
              </div>
            </div>
          )}
          {stats.todayCount > 0 && (
            <div style={{
              padding: 'var(--space-4)',
              marginBottom: 'var(--space-3)',
              background: 'var(--primary-50)',
              border: '1px solid var(--primary-200)',
              borderRadius: 'var(--radius-md)'
            }}>
              <div style={{ fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-1)', color: 'var(--primary-700)' }}>
                📅 יש לך {stats.todayCount} תורים היום
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                בדוק את הפרטים ותתכונן ללקוחות שלך
              </div>
            </div>
          )}
          {stats.pendingCount === 0 && stats.todayCount === 0 && !loadingStats && (
            <div style={{
              padding: 'var(--space-4)',
              background: 'var(--success-50)',
              border: '1px solid var(--success-200)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>✓</div>
              <div style={{ fontWeight: 'var(--font-semibold)', color: 'var(--success-700)' }}>
                הכל מעודכן!
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
                אין תורים ממתינים לטיפול כרגע
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
