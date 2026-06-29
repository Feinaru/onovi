import React from 'react';
import BusinessStats from '../components/BusinessStats';

/**
 * DashboardTab - Business dashboard with overview and statistics
 */
function DashboardTab({ businesses, services, slots, bookings, setActiveTab }) {
  return (
    <div>
      <BusinessStats services={services} slots={slots} bookings={bookings} />

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">העסקים שלי</h3>
          <p className="card-description">רשימת העסקים שאתה מנהל</p>
        </div>
        {businesses.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🏢</div>
            <div className="empty-state-title">אין עדיין עסקים</div>
            <div className="empty-state-description">צור את העסק הראשון שלך בהגדרות</div>
            <button className="btn-primary" onClick={() => setActiveTab('settings')}>
              צור עסק חדש
            </button>
          </div>
        )}
        {businesses.map(b => (
          <div
            key={b.id}
            style={{
              padding: 'var(--space-4)',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{ fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-1)' }}>
                {b.name}
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                📍 {b.city} · 📞 {b.phone}
              </div>
            </div>
            <span className={`badge ${b.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>
              {b.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DashboardTab;
