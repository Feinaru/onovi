import { useState, useEffect } from 'react';
import { api } from '../../../api';
import './SettingsPage.css';

/**
 * SettingsPage - Business Settings Management
 * Epic 1 - Sprint C
 *
 * Settings:
 * - General: Language, Timezone
 * - Business: Appointment buffer, Booking behavior
 * - Future placeholders: Notifications, Payments, Integrations
 */
export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    language: 'he',
    timezone: 'Asia/Jerusalem',
    defaultAppointmentBufferMins: 0,
    defaultBookingBehavior: 'manual'
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      setLoading(true);
      setError(null);

      const data = await api('/api/service-provider/business/profile');

      if (data.success) {
        setSettings(data.data);
        setFormData({
          language: data.data.language || 'he',
          timezone: data.data.timezone || 'Asia/Jerusalem',
          defaultAppointmentBufferMins: data.data.defaultAppointmentBufferMins || 0,
          defaultBookingBehavior: data.data.defaultBookingBehavior || 'manual'
        });
      }
    } catch (err) {
      console.error('Fetch settings error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const data = await api('/api/service-provider/business/settings', {
        method: 'PUT',
        body: JSON.stringify({
          language: formData.language,
          timezone: formData.timezone,
          defaultAppointmentBufferMins: parseInt(formData.defaultAppointmentBufferMins),
          defaultBookingBehavior: formData.defaultBookingBehavior
        })
      });

      if (data.success) {
        setSuccess('ההגדרות עודכנו בהצלחה');
        await fetchSettings();
      }
    } catch (err) {
      console.error('Update settings error:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="settings-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>טוען הגדרות...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>הגדרות</h1>
        <p className="page-description">נהל את הגדרות העסק שלך</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          <span>{error}</span>
          <button className="alert-close" onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <span className="alert-icon">✅</span>
          <span>{success}</span>
          <button className="alert-close" onClick={() => setSuccess(null)}>✕</button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* General Settings */}
        <div className="settings-section">
          <h2 className="section-title">הגדרות כלליות</h2>
          <div className="settings-grid">
            {/* Language */}
            <div className="form-group">
              <label htmlFor="language" className="form-label">
                שפה
              </label>
              <select
                id="language"
                name="language"
                className="form-select"
                value={formData.language}
                onChange={handleInputChange}
              >
                <option value="he">עברית</option>
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </select>
            </div>

            {/* Timezone */}
            <div className="form-group">
              <label htmlFor="timezone" className="form-label">
                אזור זמן
              </label>
              <select
                id="timezone"
                name="timezone"
                className="form-select"
                value={formData.timezone}
                onChange={handleInputChange}
              >
                <option value="Asia/Jerusalem">ישראל (Asia/Jerusalem)</option>
                <option value="Europe/London">לונדון (Europe/London)</option>
                <option value="America/New_York">ניו יורק (America/New_York)</option>
                <option value="Europe/Paris">פריז (Europe/Paris)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Business Settings */}
        <div className="settings-section">
          <h2 className="section-title">הגדרות עסק</h2>
          <div className="settings-grid">
            {/* Appointment Buffer */}
            <div className="form-group">
              <label htmlFor="defaultAppointmentBufferMins" className="form-label">
                מרווח זמן ברירת מחדל בין פגישות (דקות)
              </label>
              <input
                type="number"
                id="defaultAppointmentBufferMins"
                name="defaultAppointmentBufferMins"
                className="form-input"
                value={formData.defaultAppointmentBufferMins}
                onChange={handleInputChange}
                min="0"
                max="120"
              />
              <small className="form-hint">
                זמן המרווח בין פגישות לניקיון/הכנה
              </small>
            </div>

            {/* Booking Behavior */}
            <div className="form-group">
              <label htmlFor="defaultBookingBehavior" className="form-label">
                התנהגות הזמנה ברירת מחדל
              </label>
              <select
                id="defaultBookingBehavior"
                name="defaultBookingBehavior"
                className="form-select"
                value={formData.defaultBookingBehavior}
                onChange={handleInputChange}
              >
                <option value="manual">ידני - דורש אישור</option>
                <option value="auto">אוטומטי - מאושר מיידי</option>
              </select>
              <small className="form-hint">
                האם הזמנות חדשות דורשות אישור ידני או מאושרות אוטומטית
              </small>
            </div>
          </div>
        </div>

        {/* Future Placeholders */}
        <div className="settings-section disabled">
          <h2 className="section-title">
            התראות
            <span className="badge-coming-soon">בקרוב</span>
          </h2>
          <p className="section-description">
            הגדרות התראות ישלחו בגרסה עתידית
          </p>
        </div>

        <div className="settings-section disabled">
          <h2 className="section-title">
            תשלומים
            <span className="badge-coming-soon">בקרוב</span>
          </h2>
          <p className="section-description">
            הגדרות תשלום ואמצעי תשלום ישלחו בגרסה עתידית
          </p>
        </div>

        <div className="settings-section disabled">
          <h2 className="section-title">
            אינטגרציות
            <span className="badge-coming-soon">בקרוב</span>
          </h2>
          <p className="section-description">
            חיבורים למערכות חיצוניות ישלחו בגרסה עתידית
          </p>
        </div>

        {/* Actions */}
        <div className="form-actions">
          <button
            type="submit"
            className="btn-primary"
            disabled={saving}
          >
            {saving ? 'שומר...' : 'שמור הגדרות'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={fetchSettings}
            disabled={saving}
          >
            בטל
          </button>
        </div>
      </form>
    </div>
  );
}
