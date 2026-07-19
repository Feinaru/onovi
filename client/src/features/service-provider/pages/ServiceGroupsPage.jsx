import { useState, useEffect } from 'react';
import { api } from '../../../api';
import './ServiceGroupsPage.css';

/**
 * ServiceGroupsPage - Service Groups Management
 * Phase 13.2 / Epic 1
 *
 * Service Group = BusinessProfession + BusinessService records
 * Displays groups by Field > Profession > Services
 */
export default function ServiceGroupsPage({ user }) {
  const [serviceGroups, setServiceGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [editingGroup, setEditingGroup] = useState(null);

  // Form state
  const [fields, setFields] = useState([]);
  const [professions, setProfessions] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedFieldId, setSelectedFieldId] = useState('');
  const [selectedProfessionId, setSelectedProfessionId] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);

  // Modals
  const [deleteConfirmGroup, setDeleteConfirmGroup] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchServiceGroups();
    fetchFields();
  }, []);

  async function fetchServiceGroups() {
    try {
      setLoading(true);
      setError(null);

      const data = await api('/api/service-provider/service-groups');

      if (data.success) {
        setServiceGroups(data.data);
      }
    } catch (err) {
      console.error('Fetch service groups error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchFields() {
    try {
      const data = await api('/api/registration/fields');
      setFields(data);
    } catch (err) {
      console.error('Fetch fields error:', err);
    }
  }

  async function fetchProfessions(fieldId) {
    try {
      const data = await api(`/api/registration/fields/${fieldId}/professions`);
      setProfessions(data);
    } catch (err) {
      console.error('Fetch professions error:', err);
    }
  }

  async function fetchServices(professionId) {
    try {
      const data = await api(`/api/registration/professions/${professionId}/services`);
      setServices(data);
    } catch (err) {
      console.error('Fetch services error:', err);
    }
  }

  function handleAddClick() {
    setModalMode('add');
    setEditingGroup(null);
    setSelectedFieldId('');
    setSelectedProfessionId('');
    setSelectedServiceIds([]);
    setProfessions([]);
    setServices([]);
    setShowModal(true);
  }

  function handleEditClick(group) {
    setModalMode('edit');
    setEditingGroup(group);
    setSelectedFieldId(group.fieldId);
    setSelectedProfessionId(group.professionId);
    setSelectedServiceIds(group.services.map(s => s.serviceTemplateId));

    // Fetch professions and services
    fetchProfessions(group.fieldId);
    fetchServices(group.professionId);

    setShowModal(true);
  }

  function handleDeleteClick(group) {
    setDeleteConfirmGroup(group);
  }

  function handleCloseModal() {
    setShowModal(false);
    setModalMode('add');
    setEditingGroup(null);
    setSelectedFieldId('');
    setSelectedProfessionId('');
    setSelectedServiceIds([]);
    setProfessions([]);
    setServices([]);
  }

  function handleFieldChange(e) {
    const fieldId = e.target.value;
    setSelectedFieldId(fieldId);
    setSelectedProfessionId('');
    setSelectedServiceIds([]);
    setProfessions([]);
    setServices([]);

    if (fieldId) {
      fetchProfessions(fieldId);
    }
  }

  function handleProfessionChange(e) {
    const professionId = e.target.value;
    setSelectedProfessionId(professionId);
    setSelectedServiceIds([]);
    setServices([]);

    if (professionId) {
      fetchServices(professionId);
    }
  }

  function handleServiceToggle(serviceId) {
    setSelectedServiceIds(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  }

  async function handleSubmit() {
    // Validate
    if (!selectedFieldId || !selectedProfessionId) {
      setError('יש לבחור תחום ומקצוע');
      return;
    }

    if (selectedServiceIds.length === 0) {
      setError('יש לבחור לפחות שירות אחד');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      let data;
      if (modalMode === 'add') {
        data = await api('/api/service-provider/service-groups', {
          method: 'POST',
          body: JSON.stringify({
            fieldId: parseInt(selectedFieldId),
            professionId: parseInt(selectedProfessionId),
            serviceTemplateIds: selectedServiceIds
          })
        });
      } else {
        data = await api(`/api/service-provider/service-groups/${editingGroup.businessProfessionId}`, {
          method: 'PUT',
          body: JSON.stringify({
            serviceTemplateIds: selectedServiceIds
          })
        });
      }

      if (data.success) {
        setSuccess(modalMode === 'add' ? 'קבוצת שירותים נוספה בהצלחה' : 'קבוצת שירותים עודכנה בהצלחה');
        handleCloseModal();
        await fetchServiceGroups();
      }
    } catch (err) {
      console.error('Save service group error:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteConfirmGroup) return;

    try {
      setSubmitting(true);
      setError(null);

      const data = await api(`/api/service-provider/service-groups/${deleteConfirmGroup.businessProfessionId}`, {
        method: 'DELETE'
      });

      if (data.success) {
        setSuccess('קבוצת שירותים נמחקה בהצלחה');
        setDeleteConfirmGroup(null);
        await fetchServiceGroups();
      }
    } catch (err) {
      console.error('Delete service group error:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="service-groups-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>טוען קבוצות שירותים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="service-groups-page">
      <div className="page-header">
        <h1>קבוצות שירותים</h1>
        <p className="page-description">נהל את קבוצות השירותים שלך - תחומים, מקצועות ושירותים</p>
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

      <div className="page-actions">
        <button className="btn-primary" onClick={handleAddClick}>
          + הוסף קבוצת שירותים
        </button>
      </div>

      {/* Service Groups List */}
      {serviceGroups.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✂️</div>
          <div className="empty-state-title">אין עדיין קבוצות שירותים</div>
          <div className="empty-state-description">
            התחל בהוספת קבוצת שירותים ראשונה כדי להציע שירותים ללקוחות שלך
          </div>
          <button className="btn-primary" onClick={handleAddClick}>
            + הוסף קבוצת שירותים
          </button>
        </div>
      ) : (
        <div className="service-groups-list">
          {serviceGroups.map(group => (
            <div key={group.businessProfessionId} className="service-group-card">
              <div className="service-group-header">
                <div className="service-group-info">
                  <div className="service-group-field">{group.fieldName}</div>
                  <div className="service-group-profession">{group.professionName}</div>
                </div>
                <div className="service-group-actions">
                  <button
                    className="btn-icon btn-edit"
                    onClick={() => handleEditClick(group)}
                    title="ערוך"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-icon btn-delete"
                    onClick={() => handleDeleteClick(group)}
                    title="מחק"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="services-list">
                {group.services.map(service => (
                  <div key={service.id} className="service-item">
                    <div className="service-name">{service.name}</div>
                    <div className="service-details">
                      <span>{service.durationMinutes} דקות</span>
                      <span>₪{service.regularPrice}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {modalMode === 'add' ? 'הוסף קבוצת שירותים' : 'ערוך קבוצת שירותים'}
              </h2>
              <button className="modal-close" onClick={handleCloseModal}>✕</button>
            </div>

            <div className="modal-body">
              {/* Field */}
              <div className="form-group">
                <label className="form-label required">תחום</label>
                <select
                  className="form-select"
                  value={selectedFieldId}
                  onChange={handleFieldChange}
                  disabled={modalMode === 'edit'}
                >
                  <option value="">בחר תחום</option>
                  {fields.map(field => (
                    <option key={field.id} value={field.id}>
                      {field.nameHebrew}
                    </option>
                  ))}
                </select>
              </div>

              {/* Profession */}
              <div className="form-group">
                <label className="form-label required">מקצוע</label>
                <select
                  className="form-select"
                  value={selectedProfessionId}
                  onChange={handleProfessionChange}
                  disabled={!selectedFieldId || modalMode === 'edit'}
                >
                  <option value="">בחר מקצוע</option>
                  {professions.map(profession => (
                    <option key={profession.id} value={profession.id}>
                      {profession.nameHebrew}
                    </option>
                  ))}
                </select>
              </div>

              {/* Services */}
              {selectedProfessionId && (
                <div className="form-group">
                  <label className="form-label required">שירותים</label>
                  {services.length > 0 ? (
                    <>
                      <div className="services-selection">
                        {services.map(service => (
                          <label key={service.id} className="service-checkbox">
                            <input
                              type="checkbox"
                              checked={selectedServiceIds.includes(service.id)}
                              onChange={() => handleServiceToggle(service.id)}
                            />
                            <div className="service-checkbox-label">
                              <div className="service-checkbox-name">{service.nameHebrew}</div>
                              <div className="service-checkbox-info">
                                {service.defaultDurationMinutes} דקות • ₪{service.defaultPrice || 0}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                      <small style={{ display: 'block', marginTop: '8px', color: '#666' }}>
                        נבחרו {selectedServiceIds.length} שירותים
                      </small>
                    </>
                  ) : (
                    <small style={{ display: 'block', marginTop: '8px', color: '#666' }}>
                      אין שירותים זמינים למקצוע זה כרגע. יש לבחור מקצוע אחר או להוסיף שירותים לפני יצירת הקבוצה.
                    </small>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn-primary"
                onClick={handleSubmit}
                disabled={submitting || !selectedFieldId || !selectedProfessionId || selectedServiceIds.length === 0}
              >
                {submitting ? 'שומר...' : 'שמור'}
              </button>
              <button
                className="btn-secondary"
                onClick={handleCloseModal}
                disabled={submitting}
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmGroup && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmGroup(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 className="modal-title">אישור מחיקה</h2>
              <button className="modal-close" onClick={() => setDeleteConfirmGroup(null)}>✕</button>
            </div>

            <div className="modal-body">
              <p>האם אתה בטוח שברצונך למחוק את קבוצת השירותים?</p>
              <p style={{ marginTop: '8px', fontWeight: 600 }}>
                {deleteConfirmGroup.fieldName} - {deleteConfirmGroup.professionName}
              </p>
              <p style={{ marginTop: '8px', color: '#666', fontSize: '0.9rem' }}>
                פעולה זו תמחק את כל השירותים בקבוצה ({deleteConfirmGroup.services.length} שירותים)
              </p>
            </div>

            <div className="modal-footer">
              <button
                className="btn-danger"
                onClick={handleDeleteConfirm}
                disabled={submitting}
              >
                {submitting ? 'מוחק...' : 'מחק'}
              </button>
              <button
                className="btn-secondary"
                onClick={() => setDeleteConfirmGroup(null)}
                disabled={submitting}
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
