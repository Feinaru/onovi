import React from 'react';
import BusinessProfileForm from '../components/BusinessProfileForm';

/**
 * SettingsTab - Business settings and profile management
 */
function SettingsTab({
  businesses,
  categories,
  businessForm,
  editingBusiness,
  setEditingBusiness,
  showMessage,
  reload,
  resetBusinessForm
}) {
  return (
    <div>
      <div className="card mb-8">
        <div className="card-header">
          <h3 className="card-title">יצירת עסק חדש</h3>
          <p className="card-description">הוסף עסק חדש למערכת</p>
        </div>
        <BusinessProfileForm
          business={businessForm}
          categories={categories}
          onSave={resetBusinessForm}
          showMessage={showMessage}
          reload={reload}
        />
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">העסקים שלי ({businesses.length})</h3>
          <p className="card-description">ניהול העסקים הקיימים</p>
        </div>
        {businesses.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🏢</div>
            <div className="empty-state-title">אין עסקים עדיין</div>
            <div className="empty-state-description">צור את העסק הראשון שלך כדי להתחיל</div>
          </div>
        )}
        {businesses.map(b => (
          <div
            key={b.id}
            style={{
              padding: 'var(--space-5)',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 'var(--space-4)'
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{
                fontWeight: 'var(--font-bold)',
                fontSize: 'var(--text-lg)',
                marginBottom: 'var(--space-2)'
              }}>
                {b.name}
              </div>
              <div style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)',
                marginBottom: 'var(--space-1)'
              }}>
                📍 {b.city} · 📞 {b.phone}
              </div>
              <span className={`badge ${
                b.status === 'ACTIVE' ? 'badge-success' :
                b.status === 'PENDING_APPROVAL' ? 'badge-warning' :
                'badge-gray'
              }`}>
                {b.status === 'ACTIVE' ? '✓ פעיל' :
                 b.status === 'PENDING_APPROVAL' ? '⏳ ממתין לאישור' :
                 b.status}
              </span>
            </div>
            <button
              className="btn-secondary btn-sm"
              onClick={() => {
                console.log('[SettingsTab] Opening edit for business:', {
                  id: b.id,
                  name: b.name,
                  locationVerifiedByBusiness: b.locationVerifiedByBusiness,
                  latitude: b.latitude,
                  longitude: b.longitude
                });
                setEditingBusiness(b);
              }}
            >
              ✏️ ערוך
            </button>
          </div>
        ))}
      </div>

      {editingBusiness && (
        <div className="modal-backdrop" onClick={() => setEditingBusiness(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setEditingBusiness(null)}>✕</button>
            <h3>עריכת עסק</h3>
            <BusinessProfileForm
              business={editingBusiness}
              categories={categories}
              onSave={() => setEditingBusiness(null)}
              onCancel={() => setEditingBusiness(null)}
              showMessage={showMessage}
              reload={reload}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsTab;
