import { useState } from 'react';
import { api } from '../api';

export default function AuthPanel({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    role: 'CUSTOMER'
  });
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');

    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const body = mode === 'login'
        ? { phone: form.phone, password: form.password }
        : form;

      const result = await api(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
      });

      onLogin(result.user, result.token);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 5000);
    }
  }

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto' }}>
      <div className="page-header text-center">
        <h1 className="page-title">{mode === 'login' ? 'כניסה ל-Lomea' : 'הרשמה ל-Lomea'}</h1>
        <p className="page-description">
          {mode === 'login'
            ? 'התחברו כדי לנהל את התורים שלכם'
            : 'הצטרפו לאלפי עסקים ולקוחות מרוצים'}
        </p>
      </div>

      <div className="card">
        <form onSubmit={submit}>
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">שם מלא *</label>
              <input
                placeholder="הזן שם מלא"
                value={form.fullName}
                onChange={e => setForm({ ...form, fullName: e.target.value })}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">טלפון *</label>
            <input
              placeholder="הזן מספר טלפון"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              required
            />
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">אימייל (אופציונלי)</label>
              <input
                type="email"
                placeholder="הזן כתובת אימייל"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">סיסמה *</label>
            <input
              placeholder="הזן סיסמה"
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">סוג משתמש *</label>
              <select
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
              >
                <option value="CUSTOMER">👤 לקוח</option>
                <option value="BUSINESS">💼 עסק</option>
              </select>
            </div>
          )}

          {error && (
            <div style={{
              padding: 'var(--space-4)',
              background: 'var(--danger-50)',
              color: 'var(--danger-700)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: 'var(--space-5)',
              fontSize: 'var(--text-sm)'
            }}>
              ⚠️ {error}
            </div>
          )}

          <button type="submit" className="btn-primary btn-lg" style={{ width: '100%' }}>
            {mode === 'login' ? '🔓 כניסה' : '✨ הרשמה'}
          </button>
        </form>

        <div className="divider" />

        <button
          type="button"
          className="btn-ghost"
          style={{ width: '100%' }}
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login' ? 'אין חשבון? הרשמה' : 'כבר יש חשבון? כניסה'}
        </button>
      </div>

      {mode === 'login' && (
        <div style={{
          marginTop: 'var(--space-8)',
          padding: 'var(--space-6)',
          background: 'var(--primary-50)',
          border: '1px solid var(--primary-200)',
          borderRadius: 'var(--radius-xl)',
          fontSize: 'var(--text-sm)',
          color: 'var(--text-secondary)'
        }}>
          <div style={{ fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-3)', color: 'var(--primary-700)' }}>
            🧪 חשבונות דמו לבדיקה
          </div>
          <div style={{ display: 'grid', gap: 'var(--space-2)', color: 'var(--text-primary)' }}>
            <div><strong>👨‍💼 אדמין:</strong> 0500000001 / admin123</div>
            <div><strong>💼 עסק:</strong> 0500000002 / 123456</div>
            <div><strong>👤 לקוח:</strong> 0500000003 / 123456</div>
          </div>
        </div>
      )}
    </div>
  );
}
