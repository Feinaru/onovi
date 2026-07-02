import { useState, useEffect } from 'react';
import './BusinessDetailsPage.css';

const API_URL = 'http://localhost:3000';

export default function BusinessDetailsPage({
  businessDetails,
  serviceGroups,
  onBusinessDetailsChange,
  onRegistrationComplete,
  setView
}) {
  const [formData, setFormData] = useState({
    serviceProviderName: businessDetails?.serviceProviderName || '',
    businessName: businessDetails?.businessName || '',
    businessIdNumber: businessDetails?.businessIdNumber || '',
    phone: businessDetails?.phone || '',
    email: businessDetails?.email || '',
    password: businessDetails?.password || '',
    address: businessDetails?.address || ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    // Validate on mount and when formData changes
    validateForm();
  }, [formData]);

  function validateForm() {
    const newErrors = {};

    // Required fields
    if (!formData.serviceProviderName.trim()) {
      newErrors.serviceProviderName = 'שם נותן השירות הוא שדה חובה';
    }

    if (!formData.businessName.trim()) {
      newErrors.businessName = 'שם העסק הוא שדה חובה';
    }

    if (!formData.businessIdNumber.trim()) {
      newErrors.businessIdNumber = 'מספר מזהה עסק הוא שדה חובה';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'טלפון הוא שדה חובה';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'אימייל הוא שדה חובה';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'כתובת אימייל לא תקינה';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'סיסמה היא שדה חובה';
    } else if (formData.password.length < 8) {
      newErrors.password = 'הסיסמה חייבת להכיל לפחות 8 תווים';
    } else if (!/[a-zA-Z]/.test(formData.password)) {
      newErrors.password = 'הסיסמה חייבת להכיל לפחות אות אחת';
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = 'הסיסמה חייבת להכיל לפחות ספרה אחת';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'כתובת העסק היא שדה חובה';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleChange(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  function handleBlur(field) {
    setTouched(prev => ({ ...prev, [field]: true }));
  }

  async function handleContinue() {
    // Mark all fields as touched
    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    if (!validateForm()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      // Extract field IDs, profession IDs, and service template IDs from service groups
      const fieldIds = [...new Set(serviceGroups.map(g => g.fieldId))];
      const professionIds = [...new Set(serviceGroups.map(g => g.professionId))];
      const serviceTemplateIds = [...new Set(serviceGroups.flatMap(g => g.services.map(s => s.id)))];

      // Call registration API
      const response = await fetch(`${API_URL}/api/register/service-provider`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          serviceProviderName: formData.serviceProviderName,
          businessName: formData.businessName,
          businessIdentificationNumber: formData.businessIdNumber,
          phone: formData.phone,
          address: formData.address,
          city: formData.address, // Using address as city for now
          fieldIds,
          professionIds,
          serviceTemplateIds
        })
      });

      const registrationResult = await response.json();

      if (!response.ok) {
        throw new Error(registrationResult.error || 'Registration failed');
      }

      // Registration successful, now log in with the credentials
      const loginResponse = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: formData.phone,
          password: formData.password
        })
      });

      const loginResult = await loginResponse.json();

      if (!loginResponse.ok) {
        throw new Error(loginResult.message || 'Login failed after registration');
      }

      // Save business details
      onBusinessDetailsChange(formData);

      // Notify parent of successful registration with user/business data and login token
      if (onRegistrationComplete) {
        onRegistrationComplete({
          ...registrationResult.data,
          token: loginResult.token
        });
      }

      // Navigate to document upload
      setView('register-document-upload');
    } catch (err) {
      console.error('Registration error:', err);
      setSubmitError(err.message || 'שגיאה ביצירת החשבון. אנא נסו שוב.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleBack() {
    // Save current data before going back
    onBusinessDetailsChange(formData);
    setView('register-service-group-summary');
  }

  const isValid = Object.keys(errors).length === 0;

  return (
    <div className="business-details">
      <div className="business-details-container">
        <div className="business-details-header">
          <h1 className="business-details-title">פרטי נותן השירות והעסק</h1>
          <p className="business-details-subtitle">
            כמעט סיימנו. עכשיו נשלים את פרטי נותן השירות והעסק.
          </p>
        </div>

        <form className="business-details-form" onSubmit={(e) => e.preventDefault()}>
          {/* Service Provider Name */}
          <div className="form-group">
            <label htmlFor="serviceProviderName" className="form-label">
              שם נותן השירות <span className="required">*</span>
            </label>
            <input
              id="serviceProviderName"
              type="text"
              className={`form-input ${touched.serviceProviderName && errors.serviceProviderName ? 'form-input-error' : ''}`}
              value={formData.serviceProviderName}
              onChange={(e) => handleChange('serviceProviderName', e.target.value)}
              onBlur={() => handleBlur('serviceProviderName')}
              placeholder="הזן שם נותן השירות"
            />
            {touched.serviceProviderName && errors.serviceProviderName && (
              <span className="form-error">{errors.serviceProviderName}</span>
            )}
          </div>

          {/* Business Name */}
          <div className="form-group">
            <label htmlFor="businessName" className="form-label">
              שם העסק <span className="required">*</span>
            </label>
            <input
              id="businessName"
              type="text"
              className={`form-input ${touched.businessName && errors.businessName ? 'form-input-error' : ''}`}
              value={formData.businessName}
              onChange={(e) => handleChange('businessName', e.target.value)}
              onBlur={() => handleBlur('businessName')}
              placeholder="הזן שם העסק"
            />
            {touched.businessName && errors.businessName && (
              <span className="form-error">{errors.businessName}</span>
            )}
          </div>

          {/* Business ID Number */}
          <div className="form-group">
            <label htmlFor="businessIdNumber" className="form-label">
              מספר מזהה עסק <span className="required">*</span>
            </label>
            <input
              id="businessIdNumber"
              type="text"
              className={`form-input ${touched.businessIdNumber && errors.businessIdNumber ? 'form-input-error' : ''}`}
              value={formData.businessIdNumber}
              onChange={(e) => handleChange('businessIdNumber', e.target.value)}
              onBlur={() => handleBlur('businessIdNumber')}
              placeholder="הזן מספר מזהה עסק"
            />
            <span className="form-helper">ח.פ / עוסק מורשה / עוסק פטור</span>
            {touched.businessIdNumber && errors.businessIdNumber && (
              <span className="form-error">{errors.businessIdNumber}</span>
            )}
          </div>

          {/* Phone */}
          <div className="form-group">
            <label htmlFor="phone" className="form-label">
              טלפון <span className="required">*</span>
            </label>
            <input
              id="phone"
              type="tel"
              className={`form-input ${touched.phone && errors.phone ? 'form-input-error' : ''}`}
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              onBlur={() => handleBlur('phone')}
              placeholder="הזן מספר טלפון"
            />
            {touched.phone && errors.phone && (
              <span className="form-error">{errors.phone}</span>
            )}
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              אימייל <span className="required">*</span>
            </label>
            <input
              id="email"
              type="email"
              className={`form-input ${touched.email && errors.email ? 'form-input-error' : ''}`}
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              placeholder="הזן כתובת אימייל"
            />
            {touched.email && errors.email && (
              <span className="form-error">{errors.email}</span>
            )}
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              סיסמה <span className="required">*</span>
            </label>
            <input
              id="password"
              type="password"
              className={`form-input ${touched.password && errors.password ? 'form-input-error' : ''}`}
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              onBlur={() => handleBlur('password')}
              placeholder="הזן סיסמה"
            />
            <span className="form-helper">לפחות 8 תווים, אות אחת וספרה אחת</span>
            {touched.password && errors.password && (
              <span className="form-error">{errors.password}</span>
            )}
          </div>

          {/* Business Location */}
          <div className="form-group">
            <label htmlFor="address" className="form-label">
              מיקום העסק <span className="required">*</span>
            </label>
            <input
              id="address"
              type="text"
              className={`form-input ${touched.address && errors.address ? 'form-input-error' : ''}`}
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              onBlur={() => handleBlur('address')}
              placeholder="הזן כתובת העסק"
            />
            <div className="location-placeholder-card">
              <span className="location-placeholder-icon">📍</span>
              <span className="location-placeholder-text">בחירת מיקום במפה תתווסף בהמשך</span>
            </div>
            {touched.address && errors.address && (
              <span className="form-error">{errors.address}</span>
            )}
          </div>

          {/* Submit Error */}
          {submitError && (
            <div className="form-submit-error">
              <span className="error-icon">⚠️</span>
              <span className="error-text">{submitError}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="business-details-footer">
            <button
              type="button"
              className="btn-primary btn-lg"
              onClick={handleContinue}
              disabled={!isValid || submitting}
            >
              {submitting ? 'יוצר חשבון...' : 'המשך'}
            </button>
            <button
              type="button"
              className="btn-secondary btn-lg"
              onClick={handleBack}
              disabled={submitting}
            >
              חזרה
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
