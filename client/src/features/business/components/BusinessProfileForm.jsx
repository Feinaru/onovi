import React from 'react';
import { api } from '../../../api';
import BusinessAddressForm from '../../../components/BusinessAddressForm';

/**
 * BusinessProfileForm - Create or edit business form
 */
function BusinessProfileForm({
  business,
  categories,
  onSave,
  onCancel,
  showMessage,
  reload
}) {
  const [formData, setFormData] = React.useState(business);

  async function handleSubmit(e) {
    e.preventDefault();

    console.log('[BusinessProfileForm] Submitting - Address object:', {
      cityCode: formData.cityCode,
      cityNameHebrew: formData.cityNameHebrew,
      streetCode: formData.streetCode,
      streetNameHebrew: formData.streetNameHebrew,
      houseNumber: formData.houseNumber,
      formattedAddress: formData.formattedAddress,
      isComplete: formData.isComplete
    });

    // Validate address
    if (!formData.cityCode || !formData.streetCode || !formData.houseNumber) {
      console.error('[BusinessProfileForm] Validation failed');
      showMessage('יש למלא כתובת מלאה: עיר, רחוב ומספר בית');
      return;
    }

    if (!formData.isComplete) {
      console.error('[BusinessProfileForm] Address not complete');
      showMessage('יש לבחור עיר ורחוב מתוך הרשימות הרשמיות בלבד');
      return;
    }

    const payload = {
      name: formData.name,
      description: formData.description,
      phone: formData.phone,
      cityCode: formData.cityCode,
      cityNameHebrew: formData.cityNameHebrew,
      streetCode: formData.streetCode,
      streetNameHebrew: formData.streetNameHebrew,
      houseNumber: formData.houseNumber,
      formattedAddress: formData.formattedAddress,
      latitude: formData.latitude,
      longitude: formData.longitude,
      hasExactCoordinates: formData.hasExactCoordinates,
      isEstimatedLocation: formData.isEstimatedLocation,
      locationVerifiedByBusiness: formData.locationVerifiedByBusiness === true,
      categoryId: formData.categoryId
    };

    // For create, add identifier fields
    if (!formData.id) {
      payload.identifierType = formData.identifierType;
      payload.identifierValue = formData.identifierValue;
    }

    console.log('[BusinessProfileForm] Sending payload:', payload);

    try {
      const url = formData.id ? `/businesses/${formData.id}` : '/businesses';
      const method = formData.id ? 'PATCH' : 'POST';

      const response = await api(url, {
        method,
        body: JSON.stringify(payload)
      });

      console.log('[BusinessProfileForm] Success:', response);
      showMessage(formData.id ? 'העסק עודכן בהצלחה' : 'העסק נוצר בהצלחה');
      await reload();
      onSave();
    } catch (err) {
      console.error('[BusinessProfileForm] Error:', err);
      showMessage(err.message);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-2">
        <div className="form-group">
          <label className="form-label">שם העסק *</label>
          <input
            placeholder={formData.id ? "שם עסק" : "לדוגמה: מספרת דן"}
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">טלפון *</label>
          <input
            placeholder={formData.id ? "טלפון" : "03-1234567"}
            value={formData.phone}
            onChange={e => setFormData({ ...formData, phone: e.target.value })}
            required
          />
        </div>
      </div>

      {/* Only show identifier fields for new business */}
      {!formData.id && (
        <div className="grid grid-2">
          <div className="form-group">
            <label className="form-label">סוג מזהה עסקי *</label>
            <select
              value={formData.identifierType}
              onChange={e => setFormData({ ...formData, identifierType: e.target.value })}
              required
            >
              <option value="ISRAELI_ID">תעודת זהות</option>
              <option value="COMPANY_NUMBER">חברה בע"מ / ח.פ</option>
              <option value="AUTHORIZED_DEALER">עוסק מורשה</option>
              <option value="EXEMPT_DEALER">עוסק פטור</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">מספר מזהה *</label>
            <input
              placeholder="למשל: 123456789"
              value={formData.identifierValue}
              onChange={e => setFormData({ ...formData, identifierValue: e.target.value })}
              required
            />
            <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
              {formData.identifierType === 'ISRAELI_ID' && 'תעודת זהות ישראלית - 9 ספרות'}
              {formData.identifierType === 'COMPANY_NUMBER' && 'מספר חברה - 9 ספרות'}
              {formData.identifierType === 'AUTHORIZED_DEALER' && 'עוסק מורשה - 9 ספרות'}
              {formData.identifierType === 'EXEMPT_DEALER' && 'עוסק פטור - 9 ספרות'}
            </div>
          </div>
        </div>
      )}

      <BusinessAddressForm
        value={formData}
        onChange={(addressData) => {
          setFormData({
            ...formData,
            ...addressData
          });
        }}
        required={true}
      />

      <div className="form-group">
        <label className="form-label">קטגוריה *</label>
        <select
          value={formData.categoryId}
          onChange={e => setFormData({ ...formData, categoryId: Number(e.target.value) })}
          required
        >
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">תיאור (אופציונלי)</label>
        <textarea
          placeholder="תיאור העסק..."
          value={formData.description || ''}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <button className="btn-primary" type="submit">
        {formData.id ? '💾 שמור שינויים' : '💼 שמור עסק'}
      </button>
      {onCancel && (
        <button className="btn-secondary" type="button" onClick={onCancel} style={{ marginRight: 'var(--space-3)' }}>
          ביטול
        </button>
      )}
    </form>
  );
}

export default BusinessProfileForm;
