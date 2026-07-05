import { useState, useEffect } from 'react';
import { getToken } from '../../../api';
import './ServicesPage.css';

/**
 * ServicesPage - Individual Services Management
 * Epic 1 - Sprint A
 *
 * Manage individual BusinessService records
 * Features: Edit name, price, duration, active/inactive, visible to customers
 * Calendar color placeholder for future
 * No deletion from this screen (deletion happens through Service Groups)
 */
export default function ServicesPage({ user }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Modal state
  const [editingService, setEditingService] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    customName: '',
    description: '',
    durationMinutes: 0,
    regularPrice: 0,
    active: true,
    visibleToCustomers: true,
    calendarColor: ''
  });

  useEffect(() => {
    fetchServices();
  }, []);

  async function fetchServices() {
    try {
      setLoading(true);
      setError(null);

      const token = getToken();
      const response = await fetch('/api/service-provider/services', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load services');
      }

      if (data.success) {
        setServices(data.data);
      }
    } catch (err) {
      console.error('Fetch services error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleEditClick(service) {
    setEditingService(service);
    setFormData({
      customName: service.name,
      description: service.description || '',
      durationMinutes: service.durationMinutes,
      regularPrice: service.regularPrice,
      active: service.active,
      visibleToCustomers: service.visibleToCustomers,
      calendarColor: service.calendarColor || ''
    });
    setShowEditModal(true);
  }

  function handleCloseModal() {
    setShowEditModal(false);
    setEditingService(null);
    setFormData({
      customName: '',
      description: '',
      durationMinutes: 0,
      regularPrice: 0,
      active: true,
      visibleToCustomers: true,
      calendarColor: ''
    });
  }

  function handleInputChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Validate
    if (!formData.customName.trim()) {
      setError('שם השירות הוא שדה חובה');
      return;
    }

    if (formData.durationMinutes <= 0) {
      setError('משך השירות חייב להיות גדול מ-0');
      return;
    }

    if (formData.regularPrice < 0) {
      setError('מחיר לא יכול להיות שלילי');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const token = getToken();
      const response = await fetch(`/api/service-provider/services/${editingService.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customName: formData.customName,
          description: formData.description || null,
          durationMinutes: parseInt(formData.durationMinutes),
          regularPrice: parseInt(formData.regularPrice),
          active: formData.active,
          visibleToCustomers: formData.visibleToCustomers,
          calendarColor: formData.calendarColor || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update service');
      }

      if (data.success) {
        setSuccess('השירות עודכן בהצלחה');
        handleCloseModal();
        await fetchServices();
      }
    } catch (err) {
      console.error('Update service error:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(service) {
    try {
      setError(null);

      const token = getToken();
      const response = await fetch(`/api/service-provider/services/${service.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          active: !service.active
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update service');
      }

      if (data.success) {
        setSuccess(`השירות ${!service.active ? 'הופעל' : 'הושבת'} בהצלחה`);
        await fetchServices();
      }
    } catch (err) {
      console.error('Toggle service error:', err);
      setError(err.message);
    }
  }

  if (loading) {
    return (
      <div className="services-management-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>טוען שירותים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="services-management-page">
      <div className="page-header">
        <h1>ניהול שירותים</h1>
        <p className="page-description">ערוך ונהל את השירותים שלך</p>
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

      {/* Services List */}
      {services.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✂️</div>
          <div className="empty-state-title">אין עדיין שירותים</div>
          <div className="empty-state-description">
            הוסף שירותים דרך קבוצות שירותים כדי להתחיל
          </div>
        </div>
      ) : (
        <div className="services-table">
          <table>
            <thead>
              <tr>
                <th>שם השירות</th>
                <th>תחום / מקצוע</th>
                <th>משך (דקות)</th>
                <th>מחיר (₪)</th>
                <th>סטטוס</th>
                <th>גלוי ללקוחות</th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {services.map(service => (
                <tr key={service.id} className={!service.active ? 'inactive-row' : ''}>
                  <td>
                    <div className="service-name-cell">
                      <span className="service-name">{service.name}</span>
                      {service.description && (
                        <span className="service-description">{service.description}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="service-category">
                      <span className="field-name">{service.fieldName}</span>
                      <span className="profession-name">{service.professionName}</span>
                    </div>
                  </td>
                  <td>{service.durationMinutes}</td>
                  <td>₪{service.regularPrice}</td>
                  <td>
                    <span className={`status-badge ${service.active ? 'active' : 'inactive'}`}>
                      {service.active ? 'פעיל' : 'מושבת'}
                    </span>
                  </td>
                  <td>
                    <span className={`visibility-badge ${service.visibleToCustomers ? 'visible' : 'hidden'}`}>
                      {service.visibleToCustomers ? 'גלוי' : 'מוסתר'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => handleEditClick(service)}
                        title="ערוך"
                      >
                        ✏️
                      </button>
                      <button
                        className={`btn-icon ${service.active ? 'btn-disable' : 'btn-enable'}`}
                        onClick={() => handleToggleActive(service)}
                        title={service.active ? 'השבת' : 'הפעל'}
                      >
                        {service.active ? '⏸️' : '▶️'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingService && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">ערוך שירות</h2>
              <button className="modal-close" onClick={handleCloseModal}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  {/* Service Name */}
                  <div className="form-group full-width">
                    <label className="form-label required">שם השירות</label>
                    <input
                      type="text"
                      name="customName"
                      className="form-input"
                      value={formData.customName}
                      onChange={handleInputChange}
                      required
                    />
                    <small className="form-hint">שם ברירת מחדל: {editingService.templateName}</small>
                  </div>

                  {/* Description */}
                  <div className="form-group full-width">
                    <label className="form-label">תיאור</label>
                    <textarea
                      name="description"
                      className="form-textarea"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                    />
                  </div>

                  {/* Duration */}
                  <div className="form-group">
                    <label className="form-label required">משך (דקות)</label>
                    <input
                      type="number"
                      name="durationMinutes"
                      className="form-input"
                      value={formData.durationMinutes}
                      onChange={handleInputChange}
                      min="1"
                      max="1440"
                      required
                    />
                  </div>

                  {/* Price */}
                  <div className="form-group">
                    <label className="form-label required">מחיר (₪)</label>
                    <input
                      type="number"
                      name="regularPrice"
                      className="form-input"
                      value={formData.regularPrice}
                      onChange={handleInputChange}
                      min="0"
                      required
                    />
                  </div>

                  {/* Active Status */}
                  <div className="form-group">
                    <label className="form-checkbox-label">
                      <input
                        type="checkbox"
                        name="active"
                        checked={formData.active}
                        onChange={handleInputChange}
                      />
                      <span>שירות פעיל</span>
                    </label>
                  </div>

                  {/* Visible to Customers */}
                  <div className="form-group">
                    <label className="form-checkbox-label">
                      <input
                        type="checkbox"
                        name="visibleToCustomers"
                        checked={formData.visibleToCustomers}
                        onChange={handleInputChange}
                      />
                      <span>גלוי ללקוחות</span>
                    </label>
                  </div>

                  {/* Calendar Color (placeholder for future) */}
                  <div className="form-group full-width">
                    <label className="form-label">צבע ביומן (בעתיד)</label>
                    <input
                      type="text"
                      name="calendarColor"
                      className="form-input"
                      value={formData.calendarColor}
                      onChange={handleInputChange}
                      placeholder="#3B82F6"
                      disabled
                    />
                    <small className="form-hint">תכונה זו תהיה זמינה בגרסה עתידית</small>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'שומר...' : 'שמור'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCloseModal}
                  disabled={submitting}
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
