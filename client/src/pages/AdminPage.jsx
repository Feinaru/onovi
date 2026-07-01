import { useEffect, useState } from 'react';
import { api } from '../api';
import UsersPage from '../features/admin/users/UsersPage';

export default function AdminPage({ user, setView }) {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryForm, setCategoryForm] = useState({ name: '', icon: '' });
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  async function load() {
    setError('');
    setMsg('');

    try {
      const dashboardData = await api('/admin/dashboard');
      const businessesData = await api('/admin/businesses');
      const categoriesData = await api('/admin/categories');

      setDashboard(dashboardData);
      setBusinesses(businessesData);
      setCategories(categoriesData);
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveCategory(e) {
    e.preventDefault();
    setError('');
    setMsg('');

    try {
      if (editingCategoryId) {
        await api(`/admin/categories/${editingCategoryId}`, {
          method: 'PUT',
          body: JSON.stringify(categoryForm)
        });
        setMsg('הקטגוריה עודכנה');
      } else {
        await api('/admin/categories', {
          method: 'POST',
          body: JSON.stringify(categoryForm)
        });
        setMsg('הקטגוריה נוספה');
      }

      setCategoryForm({ name: '', icon: '' });
      setEditingCategoryId(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEditCategory(category) {
    setEditingCategoryId(category.id);
    setCategoryForm({
      name: category.name || '',
      icon: category.icon || ''
    });
  }

  async function deleteCategory(id) {
    if (!confirm('למחוק את הקטגוריה?')) return;

    setError('');
    setMsg('');

    try {
      await api(`/admin/categories/${id}`, { method: 'DELETE' });
      setMsg('הקטגוריה נמחקה');
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function approveBusiness(id) {
    setError('');
    setMsg('');

    try {
      await api(`/admin/businesses/${id}/approve`, { method: 'PATCH' });
      setMsg('העסק אושר בהצלחה');
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function suspendBusiness(id) {
    setError('');
    setMsg('');

    try {
      await api(`/admin/businesses/${id}/suspend`, { method: 'PATCH' });
      setMsg('העסק הושעה');
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    if (user?.role === 'ADMIN') load();
  }, [user]);

  if (!user || user.role !== 'ADMIN') {
    return (
      <section className="panel narrow">
        <h2>Admin Panel</h2>
        <p>צריך להתחבר כאדמין.</p>
        <button className="primary" onClick={() => setView('auth')}>
          כניסת אדמין
        </button>
      </section>
    );
  }

  const pendingBusinesses = businesses.filter(b => b.status === 'PENDING_APPROVAL');

  if (activeSection === 'users') {
    return <UsersPage />;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">ניהול מערכת</h1>
        <p className="page-description">ברוך הבא, {user.fullName} - לוח הבקרה של האדמין</p>
      </div>

      <div style={{ marginBottom: 'var(--space-6)', display: 'flex', gap: 'var(--space-3)' }}>
        <button
          className={activeSection === 'dashboard' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveSection('dashboard')}
        >
          📊 לוח בקרה
        </button>
        <button
          className={activeSection === 'users' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveSection('users')}
        >
          👥 משתמשים
        </button>
      </div>

      {error && (
        <div style={{
          padding: 'var(--space-4)',
          background: 'var(--danger-50)',
          color: 'var(--danger-700)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 'var(--space-6)',
          border: '1px solid var(--danger-200)'
        }}>
          ⚠️ {error}
        </div>
      )}
      {msg && (
        <div style={{
          padding: 'var(--space-4)',
          background: 'var(--success-50)',
          color: 'var(--success-700)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 'var(--space-6)',
          border: '1px solid var(--success-200)'
        }}>
          ✓ {msg}
        </div>
      )}

      {!dashboard && !error && (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)' }}>⏳</div>
          <div style={{ fontSize: 'var(--text-lg)', color: 'var(--text-secondary)' }}>טוען נתונים...</div>
        </div>
      )}

      {dashboard && (
        <>
          <div className="grid grid-4 mb-8">
            <div className="kpi-card">
              <div className="kpi-header">
                <div className="kpi-icon kpi-icon-primary">👥</div>
                <div className="kpi-label">משתמשים</div>
              </div>
              <div className="kpi-value">{dashboard.usersCount}</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <div className="kpi-icon kpi-icon-accent">🏷️</div>
                <div className="kpi-label">קטגוריות</div>
              </div>
              <div className="kpi-value">{dashboard.categoriesCount}</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <div className="kpi-icon kpi-icon-primary">🏢</div>
                <div className="kpi-label">עסקים</div>
              </div>
              <div className="kpi-value">{dashboard.businessesCount}</div>
              {dashboard.pendingBusinessesCount > 0 && (
                <div className="kpi-trend" style={{ color: 'var(--warning-600)' }}>
                  ⏳ {dashboard.pendingBusinessesCount} ממתינים לאישור
                </div>
              )}
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <div className="kpi-icon kpi-icon-success">🛎️</div>
                <div className="kpi-label">שירותים</div>
              </div>
              <div className="kpi-value">{dashboard.servicesCount}</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <div className="kpi-icon kpi-icon-accent">📅</div>
                <div className="kpi-label">תורים פתוחים</div>
              </div>
              <div className="kpi-value">{dashboard.openSlotsCount}</div>
              <div className="kpi-trend">מתוך {dashboard.slotsCount} סה"כ</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <div className="kpi-icon kpi-icon-primary">📋</div>
                <div className="kpi-label">הזמנות</div>
              </div>
              <div className="kpi-value">{dashboard.bookingsCount}</div>
            </div>
          </div>

          <div style={{ marginBottom: 'var(--space-8)' }}>
            <button className="btn-secondary" onClick={load}>🔄 רענן נתונים</button>
          </div>
        </>
      )}

      <div className="card mb-8">
        <div className="card-header">
          <h3 className="card-title">ניהול קטגוריות</h3>
          <p className="card-description">הוסף ונהל את קטגוריות השירותים</p>
        </div>

        <form onSubmit={saveCategory} style={{ marginBottom: 'var(--space-6)' }}>
          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">שם הקטגוריה *</label>
              <input
                placeholder="לדוגמה: ספרות שיער"
                value={categoryForm.name}
                onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">אייקון (אופציונלי)</label>
              <input
                placeholder="💇"
                value={categoryForm.icon}
                onChange={e => setCategoryForm({ ...categoryForm, icon: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button className="btn-primary">
              {editingCategoryId ? '✓ עדכן קטגוריה' : '➕ הוסף קטגוריה'}
            </button>

            {editingCategoryId && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setEditingCategoryId(null);
                  setCategoryForm({ name: '', icon: '' });
                }}
              >
                ביטול
              </button>
            )}
          </div>
        </form>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>שם</th>
                <th>אייקון</th>
                <th>סטטוס</th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(category => (
                <tr key={category.id}>
                  <td style={{ fontWeight: 'var(--font-semibold)' }}>{category.name}</td>
                  <td style={{ fontSize: 'var(--text-xl)' }}>{category.icon || '—'}</td>
                  <td>
                    <span className={`badge ${category.isActive ? 'badge-success' : 'badge-gray'}`}>
                      {category.isActive ? '✓ פעילה' : '○ לא פעילה'}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn-sm btn-secondary" onClick={() => startEditCategory(category)}>✏️ ערוך</button>
                      <button className="btn-sm btn-danger" onClick={() => deleteCategory(category.id)}>🗑️ מחק</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">עסקים ממתינים לאישור ({pendingBusinesses.length})</h3>
          <p className="card-description">אשר או דחה עסקים חדשים</p>
        </div>

        {!pendingBusinesses.length && (
          <div className="empty-state">
            <div className="empty-state-icon">✓</div>
            <div className="empty-state-title">אין עסקים ממתינים</div>
            <div className="empty-state-description">כל העסקים אושרו</div>
          </div>
        )}

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>עסק</th>
                <th>בעלים</th>
                <th>קטגוריה</th>
                <th>מיקום</th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {pendingBusinesses.map(business => (
                <tr key={business.id}>
                  <td>
                    <div style={{ fontWeight: 'var(--font-semibold)' }}>{business.name}</div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>📞 {business.phone}</div>
                  </td>
                  <td>{business.owner?.fullName || 'לא ידוע'}</td>
                  <td>
                    <span className="badge badge-gray">
                      {business.category?.icon} {business.category?.name || 'ללא קטגוריה'}
                    </span>
                  </td>
                  <td>📍 {business.city}</td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn-sm btn-success" onClick={() => approveBusiness(business.id)}>
                        ✓ אשר
                      </button>
                      <button className="btn-sm btn-danger" onClick={() => suspendBusiness(business.id)}>
                        ✗ דחה
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}