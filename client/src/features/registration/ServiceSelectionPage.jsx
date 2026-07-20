import { useState, useEffect } from 'react';
import './ServiceSelectionPage.css';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export default function ServiceSelectionPage({
  selectedFieldId,
  selectedFieldName,
  selectedProfessionId,
  selectedProfessionName,
  setView,
  onServicesSelected
}) {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);

  useEffect(() => {
    if (selectedProfessionId) {
      loadServices();
    }
  }, [selectedProfessionId]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredServices(services);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = services.filter(service =>
        service.nameHebrew?.toLowerCase().includes(query) ||
        service.name?.toLowerCase().includes(query)
      );
      setFilteredServices(filtered);
    }
  }, [searchQuery, services]);

  async function loadServices() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_URL}/api/registration/professions/${selectedProfessionId}/services`
      );
      if (!response.ok) {
        throw new Error('Failed to load services');
      }
      const data = await response.json();
      setServices(data);
      setFilteredServices(data);
    } catch (err) {
      console.error('Error loading services:', err);
      setError('שגיאה בטעינת השירותים. אנא נסו שוב.');
    } finally {
      setLoading(false);
    }
  }

  function handleServiceToggle(serviceId) {
    setSelectedServiceIds((prev) => {
      if (prev.includes(serviceId)) {
        return prev.filter((id) => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  }

  function handleCreateServiceGroup() {
    if (selectedServiceIds.length > 0 && onServicesSelected) {
      // Find full service objects for selected IDs
      const selectedServices = services.filter(s => selectedServiceIds.includes(s.id));
      onServicesSelected(selectedServices);
    }
    setView('register-service-group-summary');
  }

  function handleBack() {
    setView('register-profession-selection');
  }

  function handleRequestService() {
    setShowRequestModal(true);
  }

  function handleCloseModal() {
    setShowRequestModal(false);
  }

  if (loading) {
    return (
      <div className="service-selection">
        <div className="service-selection-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>טוען שירותים...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="service-selection">
        <div className="service-selection-container">
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h2>אופס! משהו השתבש</h2>
            <p>{error}</p>
            <button className="btn-primary" onClick={loadServices}>
              נסה שוב
            </button>
            <button className="btn-secondary" onClick={handleBack}>
              חזרה
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="service-selection">
        <div className="service-selection-container">
          <div className="empty-state">
            <div className="selected-profession-badge">
              <div className="badge-field">{selectedFieldName}</div>
              <div className="badge-profession">{selectedProfessionName}</div>
            </div>
            <div className="empty-icon">📋</div>
            <h2>אין שירותים זמינים</h2>
            <p>המקצוע שנבחר עדיין אינו כולל שירותים.</p>
            <div className="empty-actions">
              <button className="btn-secondary" onClick={handleBack}>
                חזרה
              </button>
              <button className="btn-link-large" onClick={handleRequestService}>
                בקש להוסיף שירות
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="service-selection">
      <div className="service-selection-container">
        <div className="selected-profession-badge">
          <div className="badge-field">{selectedFieldName}</div>
          <div className="badge-profession">{selectedProfessionName}</div>
        </div>

        <div className="service-selection-header">
          <h1 className="service-selection-title">בחרו את השירותים שלכם</h1>
          <p className="service-selection-subtitle">
            ניתן לבחור שירות אחד או יותר. השירותים שנבחרו ייכללו בקבוצת השירותים.
          </p>
        </div>

        <div className="service-selection-search">
          <input
            type="text"
            className="search-input"
            placeholder="חיפוש שירות..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="חיפוש שירות"
          />
        </div>

        {filteredServices.length === 0 ? (
          <div className="no-results">
            <p>לא נמצאו תוצאות עבור "{searchQuery}"</p>
          </div>
        ) : (
          <div className="service-grid">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className={`service-card ${
                  selectedServiceIds.includes(service.id) ? 'service-card-selected' : ''
                }`}
                onClick={() => handleServiceToggle(service.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleServiceToggle(service.id);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`בחר שירות ${service.nameHebrew}`}
                aria-pressed={selectedServiceIds.includes(service.id)}
              >
                <h3 className="service-card-title">{service.nameHebrew || service.name}</h3>
                {service.description && (
                  <p className="service-card-description">{service.description}</p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="service-selection-footer">
          <button
            className="btn-primary btn-lg"
            onClick={handleCreateServiceGroup}
            disabled={selectedServiceIds.length === 0}
          >
            צור קבוצת שירותים ({selectedServiceIds.length})
          </button>
          <button className="btn-secondary btn-lg" onClick={handleBack}>
            חזרה
          </button>
        </div>

        <div className="service-request-section">
          <p className="service-request-text">לא מצאת את השירות שלך?</p>
          <button className="btn-link" onClick={handleRequestService}>
            בקש להוסיף שירות
          </button>
        </div>
      </div>

      {showRequestModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">✉️</div>
            <h2 className="modal-title">בקשת הוספת שירות</h2>
            <p className="modal-text">בקשת הוספת שירות תתווסף בשלב הבא</p>
            <button className="btn-primary" onClick={handleCloseModal}>
              הבנתי
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
