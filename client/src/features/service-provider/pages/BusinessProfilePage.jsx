import { useState, useEffect } from 'react';
import { getToken, api } from '../../../api';
import './BusinessProfilePage.css';

/**
 * Business Profile Management Page
 *
 * Allows SERVICE_PROVIDER to view and edit business profile
 * - Editable: name, phone, email, city, street, houseNumber, description
 * - Read-only: identifierType, identifierValue, approvalStatus
 */
export default function BusinessProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    description: '',
    city: '',
    street: '',
    houseNumber: '',
    logoUrl: '',
    coverImageUrl: '',
    galleryImages: []
  });

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      setLoading(true);
      setError(null);

      const data = await api('/api/service-provider/business/profile');

      if (data.success) {
        setProfile(data.data);
        let parsedGallery = [];
        if (data.data.galleryImages) {
          try {
            parsedGallery = JSON.parse(data.data.galleryImages);
          } catch (e) {
            console.error('Failed to parse gallery images:', e);
          }
        }
        setFormData({
          name: data.data.name || '',
          phone: data.data.phone || '',
          email: data.data.ownerEmail || '',
          description: data.data.description || '',
          city: data.data.city || '',
          street: data.data.street || '',
          houseNumber: data.data.houseNumber || '',
          logoUrl: data.data.logoUrl || '',
          coverImageUrl: data.data.coverImageUrl || '',
          galleryImages: parsedGallery
        });
      }
    } catch (err) {
      console.error('Fetch profile error:', err);
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

  function handleImageUpload(fieldName, event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('יש לבחור קובץ תמונה בלבד');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('גודל הקובץ חייב להיות עד 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setFormData(prev => ({
        ...prev,
        [fieldName]: e.target.result
      }));
    };
    reader.readAsDataURL(file);
  }

  function handleGalleryAdd(event) {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // Limit to 10 images
    const remainingSlots = 10 - formData.galleryImages.length;
    if (files.length > remainingSlots) {
      setError(`ניתן להעלות עד ${remainingSlots} תמונות נוספות`);
      return;
    }

    const readers = files.map(file => {
      return new Promise((resolve) => {
        if (!file.type.startsWith('image/')) {
          resolve(null);
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          resolve(null);
          return;
        }
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then(results => {
      const validImages = results.filter(r => r !== null);
      setFormData(prev => ({
        ...prev,
        galleryImages: [...prev.galleryImages, ...validImages]
      }));
    });
  }

  function handleGalleryRemove(index) {
    setFormData(prev => ({
      ...prev,
      galleryImages: prev.galleryImages.filter((_, i) => i !== index)
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Validate required fields
    if (!formData.name.trim()) {
      setError('שם העסק הוא שדה חובה');
      return;
    }

    if (!formData.phone.trim()) {
      setError('מספר טלפון הוא שדה חובה');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const data = await api('/api/service-provider/business/profile', {
        method: 'PUT',
        body: JSON.stringify(formData)
      });

      if (data.success) {
        setSuccess('הפרטים עודכנו בהצלחה');
        // Refresh profile to get latest data
        await fetchProfile();
      }
    } catch (err) {
      console.error('Update profile error:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function getApprovalStatusLabel(status) {
    const labels = {
      DRAFT: 'טיוטה',
      PENDING_APPROVAL: 'ממתין לאישור',
      APPROVED: 'מאושר',
      REJECTED: 'נדחה'
    };
    return labels[status] || status;
  }

  function getApprovalStatusDescription(status) {
    const descriptions = {
      DRAFT: 'יש להשלים את ההרשמה',
      PENDING_APPROVAL: 'הבקשה נשלחה ונבדקת',
      APPROVED: 'ניתן להתחיל לקבל הזמנות',
      REJECTED: 'יש לעדכן את הפרטים בהתאם להערות'
    };
    return descriptions[status] || '';
  }

  function getApprovalStatusClass(status) {
    const classes = {
      DRAFT: 'status-draft',
      PENDING_APPROVAL: 'status-pending',
      APPROVED: 'status-approved',
      REJECTED: 'status-rejected'
    };
    return classes[status] || '';
  }

  function getIdentifierTypeLabel(type) {
    const labels = {
      BUSINESS_ID: 'ח.פ.',
      NONPROFIT_ID: 'ע.ר.'
    };
    return labels[type] || type;
  }

  if (loading) {
    return (
      <div className="business-profile-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>טוען פרטי עסק...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="business-profile-page">
        <div className="error-state">
          <p className="error-message">{error || 'לא נמצא עסק'}</p>
          <button className="btn-secondary" onClick={fetchProfile}>נסה שוב</button>
        </div>
      </div>
    );
  }

  return (
    <div className="business-profile-page">
      <div className="page-header">
        <h1>פרטי העסק</h1>
        <p className="page-description">ערוך את פרטי העסק שלך</p>
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

      {/* Read-only info section */}
      <div className="info-card">
        <h2 className="section-title">מידע כללי</h2>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">סוג מזהה:</span>
            <span className="info-value">{getIdentifierTypeLabel(profile.identifierType)}</span>
          </div>
          <div className="info-item">
            <span className="info-label">מספר מזהה:</span>
            <span className="info-value">{profile.identifierValue}</span>
          </div>
          <div className="info-item full-width">
            <span className="info-label">סטטוס אישור:</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span className={`status-badge ${getApprovalStatusClass(profile.approvalStatus)}`}>
                {getApprovalStatusLabel(profile.approvalStatus)}
              </span>
              <span style={{ fontSize: '0.9rem', color: '#666' }}>
                {getApprovalStatusDescription(profile.approvalStatus)}
              </span>
            </div>
          </div>
          {profile.adminNote && (
            <div className="info-item full-width">
              <span className="info-label">הערת מנהל:</span>
              <span className="info-value">{profile.adminNote}</span>
            </div>
          )}
        </div>
      </div>

      {/* Editable form */}
      <form className="profile-form" onSubmit={handleSubmit}>
        <h2 className="section-title">פרטים לעריכה</h2>

        <div className="form-grid">
          {/* Business name */}
          <div className="form-group">
            <label htmlFor="name" className="form-label required">
              שם העסק
            </label>
            <input
              type="text"
              id="name"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Phone */}
          <div className="form-group">
            <label htmlFor="phone" className="form-label required">
              טלפון
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              className="form-input"
              value={formData.phone}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Email - Account email (read-only) */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              אימייל חשבון
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              value={formData.email}
              disabled
              title="אימייל החשבון אינו ניתן לשינוי כאן"
            />
            <small style={{ display: 'block', marginTop: '4px', color: '#666', fontSize: '0.85rem' }}>
              לשינוי אימייל החשבון, עבור להגדרות חשבון
            </small>
          </div>

          {/* City */}
          <div className="form-group">
            <label htmlFor="city" className="form-label">
              עיר
            </label>
            <input
              type="text"
              id="city"
              name="city"
              className="form-input"
              value={formData.city}
              onChange={handleInputChange}
            />
          </div>

          {/* Street */}
          <div className="form-group">
            <label htmlFor="street" className="form-label">
              רחוב
            </label>
            <input
              type="text"
              id="street"
              name="street"
              className="form-input"
              value={formData.street}
              onChange={handleInputChange}
            />
          </div>

          {/* House number */}
          <div className="form-group">
            <label htmlFor="houseNumber" className="form-label">
              מספר בית
            </label>
            <input
              type="text"
              id="houseNumber"
              name="houseNumber"
              className="form-input"
              value={formData.houseNumber}
              onChange={handleInputChange}
            />
          </div>

          {/* Description - full width */}
          <div className="form-group full-width">
            <label htmlFor="description" className="form-label">
              תיאור העסק
            </label>
            <textarea
              id="description"
              name="description"
              className="form-textarea"
              value={formData.description}
              onChange={handleInputChange}
              rows="4"
              placeholder="תאר את העסק שלך..."
            />
          </div>
        </div>

        {/* Media Section */}
        <h2 className="section-title" style={{ marginTop: 'var(--space-8)' }}>מדיה</h2>
        <div className="form-grid">
          {/* Logo */}
          <div className="form-group">
            <label className="form-label">לוגו</label>
            <div className="image-upload-area">
              {formData.logoUrl ? (
                <div className="image-preview">
                  <img src={formData.logoUrl} alt="Logo" />
                  <button
                    type="button"
                    className="btn-remove-image"
                    onClick={() => setFormData(prev => ({ ...prev, logoUrl: '' }))}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="upload-placeholder">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload('logoUrl', e)}
                    style={{ display: 'none' }}
                  />
                  <span>📷</span>
                  <span>העלה לוגו</span>
                </label>
              )}
            </div>
          </div>

          {/* Cover Image */}
          <div className="form-group">
            <label className="form-label">תמונת רקע</label>
            <div className="image-upload-area">
              {formData.coverImageUrl ? (
                <div className="image-preview">
                  <img src={formData.coverImageUrl} alt="Cover" />
                  <button
                    type="button"
                    className="btn-remove-image"
                    onClick={() => setFormData(prev => ({ ...prev, coverImageUrl: '' }))}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="upload-placeholder">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload('coverImageUrl', e)}
                    style={{ display: 'none' }}
                  />
                  <span>📷</span>
                  <span>העלה תמונת רקע</span>
                </label>
              )}
            </div>
          </div>

          {/* Gallery */}
          <div className="form-group full-width">
            <label className="form-label">גלריה (עד 10 תמונות)</label>
            <div className="gallery-grid">
              {formData.galleryImages.map((img, index) => (
                <div key={index} className="gallery-item">
                  <img src={img} alt={`Gallery ${index + 1}`} />
                  <button
                    type="button"
                    className="btn-remove-image"
                    onClick={() => handleGalleryRemove(index)}
                  >
                    ✕
                  </button>
                </div>
              ))}
              {formData.galleryImages.length < 10 && (
                <label className="gallery-upload-placeholder">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryAdd}
                    style={{ display: 'none' }}
                  />
                  <span>+</span>
                  <span>הוסף תמונות</span>
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="form-actions">
          <button
            type="submit"
            className="btn-primary"
            disabled={saving}
          >
            {saving ? 'שומר...' : 'שמור שינויים'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={fetchProfile}
            disabled={saving}
          >
            בטל
          </button>
        </div>
      </form>
    </div>
  );
}
