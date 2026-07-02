import { useState, useEffect } from 'react';
import './FieldSelectionPage.css';

const API_URL = 'http://localhost:3000';

export default function FieldSelectionPage({ setView, onFieldSelected, onFieldNameSelected }) {
  const [fields, setFields] = useState([]);
  const [filteredFields, setFilteredFields] = useState([]);
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [selectedFieldName, setSelectedFieldName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);

  useEffect(() => {
    loadFields();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredFields(fields);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = fields.filter(field =>
        field.nameHebrew?.toLowerCase().includes(query) ||
        field.name?.toLowerCase().includes(query)
      );
      setFilteredFields(filtered);
    }
  }, [searchQuery, fields]);

  async function loadFields() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/registration/fields`);
      if (!response.ok) {
        throw new Error('Failed to load fields');
      }
      const data = await response.json();
      setFields(data);
      setFilteredFields(data);
    } catch (err) {
      console.error('Error loading fields:', err);
      setError('שגיאה בטעינת התחומים. אנא נסו שוב.');
    } finally {
      setLoading(false);
    }
  }

  function handleFieldSelect(fieldId) {
    setSelectedFieldId(fieldId);
    const field = fields.find(f => f.id === fieldId);
    if (field) {
      setSelectedFieldName(field.nameHebrew || field.name);
    }
  }

  function handleContinue() {
    if (selectedFieldId && onFieldSelected) {
      onFieldSelected(selectedFieldId);
    }
    if (selectedFieldName && onFieldNameSelected) {
      onFieldNameSelected(selectedFieldName);
    }
    // Navigate to profession selection
    setView('register-profession-selection');
  }

  function handleBack() {
    setView('register-entry');
  }

  function handleRequestField() {
    setShowRequestModal(true);
  }

  function handleCloseModal() {
    setShowRequestModal(false);
  }

  if (loading) {
    return (
      <div className="field-selection">
        <div className="field-selection-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>טוען תחומים...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="field-selection">
        <div className="field-selection-container">
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h2>אופס! משהו השתבש</h2>
            <p>{error}</p>
            <button className="btn-primary" onClick={loadFields}>
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

  if (fields.length === 0) {
    return (
      <div className="field-selection">
        <div className="field-selection-container">
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h2>אין תחומים זמינים</h2>
            <p>נראה שאין תחומים פעילים כרגע. אנא צרו קשר עם התמיכה.</p>
            <button className="btn-secondary" onClick={handleBack}>
              חזרה
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="field-selection">
      <div className="field-selection-container">
        <div className="field-selection-header">
          <h1 className="field-selection-title">בחרו את התחום שלכם</h1>
          <p className="field-selection-subtitle">
            בחרו את התחום העיקרי שבו אתם מספקים שירותים
          </p>
        </div>

        <div className="field-selection-search">
          <input
            type="text"
            className="search-input"
            placeholder="חיפוש תחום..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="חיפוש תחום"
          />
        </div>

        {filteredFields.length === 0 ? (
          <div className="no-results">
            <p>לא נמצאו תוצאות עבור "{searchQuery}"</p>
          </div>
        ) : (
          <div className="field-grid">
            {filteredFields.map((field) => (
              <div
                key={field.id}
                className={`field-card ${selectedFieldId === field.id ? 'field-card-selected' : ''}`}
                onClick={() => handleFieldSelect(field.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleFieldSelect(field.id);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`בחר תחום ${field.nameHebrew}`}
                aria-pressed={selectedFieldId === field.id}
              >
                {field.icon && (
                  <div className="field-card-icon">{field.icon === 'massage' ? '💆' : field.icon === 'beauty' ? '💅' : '📋'}</div>
                )}
                <h3 className="field-card-title">{field.nameHebrew || field.name}</h3>
              </div>
            ))}
          </div>
        )}

        <div className="field-selection-footer">
          <button
            className="btn-primary btn-lg"
            onClick={handleContinue}
            disabled={!selectedFieldId}
          >
            המשך
          </button>
          <button className="btn-secondary btn-lg" onClick={handleBack}>
            חזרה
          </button>
        </div>

        <div className="field-request-section">
          <p className="field-request-text">לא מצאת את התחום שלך?</p>
          <button className="btn-link" onClick={handleRequestField}>
            בקש להוסיף תחום
          </button>
        </div>
      </div>

      {showRequestModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">✉️</div>
            <h2 className="modal-title">בקשת הוספת תחום</h2>
            <p className="modal-text">בקשת הוספת תחום תתווסף בשלב הבא</p>
            <button className="btn-primary" onClick={handleCloseModal}>
              הבנתי
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
