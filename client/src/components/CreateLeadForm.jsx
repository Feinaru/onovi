import { useState } from 'react';
import { api } from '../api';

export default function CreateLeadForm({ onSuccess, onCancel }) {
  const [form, setForm] = useState({
    identifierType: 'ISRAELI_ID',
    identifierValue: '',
    businessName: '',
    contactPersonName: '',
    phone: '',
    email: '',
    source: 'ישיר',
    initialNote: ''
  });

  const [error, setError] = useState('');
  const [duplicateInfo, setDuplicateInfo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const identifierTypes = [
    { value: 'ISRAELI_ID', label: 'תעודת זהות' },
    { value: 'COMPANY_NUMBER', label: 'חברה בע"מ' },
    { value: 'AUTHORIZED_DEALER', label: 'עוסק מורשה' },
    { value: 'EXEMPT_DEALER', label: 'עוסק פטור' }
  ];

  const sources = [
    'ישיר',
    'שיחת טלפון',
    'אתר אינטרנט',
    'המלצה',
    'רשתות חברתיות',
    'אחר'
  ];

  function updateField(field, value) {
    setForm({ ...form, [field]: value });
    setError('');
    setDuplicateInfo(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setDuplicateInfo(null);
    setIsSubmitting(true);

    try {
      const data = {
        identifierType: form.identifierType,
        identifierValue: form.identifierValue.trim(),
        businessName: form.businessName.trim(),
        phone: form.phone.trim(),
      };

      if (form.contactPersonName) data.contactPersonName = form.contactPersonName.trim();
      if (form.email) data.email = form.email.trim();
      if (form.source) data.source = form.source;
      if (form.initialNote) data.initialNote = form.initialNote.trim();

      const result = await api('/api/leads', {
        method: 'POST',
        body: JSON.stringify(data)
      });

      // Success
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      setIsSubmitting(false);

      // Check if it's a duplicate identifier error
      if (err.message.includes('כבר קיים')) {
        // Try to parse the error response for duplicate info
        setError(err.message);
        // Note: In a real implementation, you'd want the API to return structured error data
      } else {
        setError(err.message);
      }
    }
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>
          ליד חדש
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
          הוסף ליד חדש למערכת ניהול הלקוחות
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Identifier Type and Value */}
        <div style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-4)' }}>
            מזהה רשמי <span style={{ color: 'var(--danger-600)' }}>*</span>
          </h3>

          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label className="form-label">סוג מזהה</label>
            <select
              className="form-input"
              value={form.identifierType}
              onChange={(e) => updateField('identifierType', e.target.value)}
              required
            >
              {identifierTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">מספר מזהה</label>
            <input
              type="text"
              className="form-input"
              value={form.identifierValue}
              onChange={(e) => updateField('identifierValue', e.target.value)}
              placeholder={form.identifierType === 'ISRAELI_ID' ? 'למשל: 123456789' : 'למשל: 514588832'}
              required
            />
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
              {form.identifierType === 'ISRAELI_ID' && 'תעודת זהות ישראלית - 9 ספרות'}
              {form.identifierType === 'COMPANY_NUMBER' && 'מספר חברה - 9 ספרות'}
              {form.identifierType === 'AUTHORIZED_DEALER' && 'עוסק מורשה - 9 ספרות'}
              {form.identifierType === 'EXEMPT_DEALER' && 'עוסק פטור - 9 ספרות'}
            </div>
          </div>
        </div>

        {/* Business Info */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-4)' }}>
            פרטי העסק
          </h3>

          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label className="form-label">שם העסק <span style={{ color: 'var(--danger-600)' }}>*</span></label>
            <input
              type="text"
              className="form-input"
              value={form.businessName}
              onChange={(e) => updateField('businessName', e.target.value)}
              placeholder="למשל: מסעדת אלפרד"
              required
            />
          </div>

          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label className="form-label">טלפון <span style={{ color: 'var(--danger-600)' }}>*</span></label>
            <input
              type="tel"
              className="form-input"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="050-1234567"
              required
            />
          </div>

          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label className="form-label">איש קשר</label>
            <input
              type="text"
              className="form-input"
              value={form.contactPersonName}
              onChange={(e) => updateField('contactPersonName', e.target.value)}
              placeholder="למשל: יוסי כהן"
            />
          </div>

          <div>
            <label className="form-label">אימייל</label>
            <input
              type="email"
              className="form-input"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="email@example.com"
            />
          </div>
        </div>

        {/* Source and Notes */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-4)' }}>
            מידע נוסף
          </h3>

          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label className="form-label">מקור</label>
            <select
              className="form-input"
              value={form.source}
              onChange={(e) => updateField('source', e.target.value)}
            >
              {sources.map(source => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">הערה ראשונית</label>
            <textarea
              className="form-input"
              value={form.initialNote}
              onChange={(e) => updateField('initialNote', e.target.value)}
              placeholder="הערות, תיאור השיחה, דרישות מיוחדות..."
              rows={4}
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            marginBottom: 'var(--space-4)',
            padding: 'var(--space-4)',
            background: 'var(--danger-50)',
            border: '1px solid var(--danger-600)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--danger-700)'
          }}>
            <div style={{ fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-1)' }}>
              שגיאה
            </div>
            <div>{error}</div>
          </div>
        )}

        {/* Duplicate Info */}
        {duplicateInfo && (
          <div style={{
            marginBottom: 'var(--space-4)',
            padding: 'var(--space-4)',
            background: 'var(--warning-50)',
            border: '1px solid var(--warning-500)',
            borderRadius: 'var(--radius-md)'
          }}>
            <div style={{ fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>
              ⚠️ ליד כבר קיים במערכת
            </div>
            <div style={{ fontSize: 'var(--text-sm)' }}>
              <div>שם: {duplicateInfo.businessName}</div>
              <div>טלפון: {duplicateInfo.phone}</div>
              <div>סטטוס: {duplicateInfo.status}</div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
          {onCancel && (
            <button
              type="button"
              className="btn-secondary"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              ביטול
            </button>
          )}
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'שומר...' : 'צור ליד'}
          </button>
        </div>
      </form>
    </div>
  );
}
