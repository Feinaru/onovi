import { useState, useEffect } from 'react';
import './ProfessionSelectionPage.css';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export default function ProfessionSelectionPage({
  selectedFieldId,
  selectedFieldName,
  setView,
  onProfessionSelected,
  onProfessionNameSelected
}) {
  const [professions, setProfessions] = useState([]);
  const [filteredProfessions, setFilteredProfessions] = useState([]);
  const [selectedProfessionId, setSelectedProfessionId] = useState(null);
  const [selectedProfessionName, setSelectedProfessionName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);

  useEffect(() => {
    if (selectedFieldId) {
      loadProfessions();
    }
  }, [selectedFieldId]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProfessions(professions);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = professions.filter(profession =>
        profession.nameHebrew?.toLowerCase().includes(query) ||
        profession.name?.toLowerCase().includes(query)
      );
      setFilteredProfessions(filtered);
    }
  }, [searchQuery, professions]);

  async function loadProfessions() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/registration/fields/${selectedFieldId}/professions`);
      if (!response.ok) {
        throw new Error('Failed to load professions');
      }
      const data = await response.json();
      setProfessions(data);
      setFilteredProfessions(data);
    } catch (err) {
      console.error('Error loading professions:', err);
      setError('שגיאה בטעינת המקצועות. אנא נסו שוב.');
    } finally {
      setLoading(false);
    }
  }

  function handleProfessionSelect(professionId) {
    setSelectedProfessionId(professionId);
    const profession = professions.find(p => p.id === professionId);
    if (profession) {
      setSelectedProfessionName(profession.nameHebrew || profession.name);
    }
  }

  function handleContinue() {
    if (selectedProfessionId && onProfessionSelected) {
      onProfessionSelected(selectedProfessionId);
    }
    if (selectedProfessionName && onProfessionNameSelected) {
      onProfessionNameSelected(selectedProfessionName);
    }
    setView('register-service-selection');
  }

  function handleBack() {
    setView('register-field-selection');
  }

  function handleRequestProfession() {
    setShowRequestModal(true);
  }

  function handleCloseModal() {
    setShowRequestModal(false);
  }

  if (loading) {
    return (
      <div className="profession-selection">
        <div className="profession-selection-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>טוען מקצועות...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profession-selection">
        <div className="profession-selection-container">
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h2>אופס! משהו השתבש</h2>
            <p>{error}</p>
            <button className="btn-primary" onClick={loadProfessions}>
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

  if (professions.length === 0) {
    return (
      <div className="profession-selection">
        <div className="profession-selection-container">
          <div className="empty-state">
            <div className="selected-field-badge">{selectedFieldName || 'התחום שנבחר'}</div>
            <div className="empty-icon">📋</div>
            <h2>אין מקצועות זמינים</h2>
            <p>התחום שנבחר עדיין אינו כולל מקצועות.</p>
            <div className="empty-actions">
              <button className="btn-secondary" onClick={handleBack}>
                חזרה
              </button>
              <button className="btn-link-large" onClick={handleRequestProfession}>
                בקש להוסיף מקצוע
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profession-selection">
      <div className="profession-selection-container">
        <div className="selected-field-badge">{selectedFieldName || 'התחום שנבחר'}</div>

        <div className="profession-selection-header">
          <h1 className="profession-selection-title">בחרו את המקצוע שלכם</h1>
          <p className="profession-selection-subtitle">
            בחרו את המקצוע הספציפי שבו אתם מציעים שירותים
          </p>
        </div>

        <div className="profession-selection-search">
          <input
            type="text"
            className="search-input"
            placeholder="חיפוש מקצוע..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="חיפוש מקצוע"
          />
        </div>

        {filteredProfessions.length === 0 ? (
          <div className="no-results">
            <p>לא נמצאו תוצאות עבור "{searchQuery}"</p>
          </div>
        ) : (
          <div className="profession-grid">
            {filteredProfessions.map((profession) => (
              <div
                key={profession.id}
                className={`profession-card ${selectedProfessionId === profession.id ? 'profession-card-selected' : ''}`}
                onClick={() => handleProfessionSelect(profession.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleProfessionSelect(profession.id);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`בחר מקצוע ${profession.nameHebrew}`}
                aria-pressed={selectedProfessionId === profession.id}
              >
                <div className="profession-card-icon">💼</div>
                <h3 className="profession-card-title">{profession.nameHebrew || profession.name}</h3>
              </div>
            ))}
          </div>
        )}

        <div className="profession-selection-footer">
          <button
            className="btn-primary btn-lg"
            onClick={handleContinue}
            disabled={!selectedProfessionId}
          >
            המשך
          </button>
          <button className="btn-secondary btn-lg" onClick={handleBack}>
            חזרה
          </button>
        </div>

        <div className="profession-request-section">
          <p className="profession-request-text">לא מצאת את המקצוע שלך?</p>
          <button className="btn-link" onClick={handleRequestProfession}>
            בקש להוסיף מקצוע
          </button>
        </div>
      </div>

      {showRequestModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">✉️</div>
            <h2 className="modal-title">בקשת הוספת מקצוע</h2>
            <p className="modal-text">בקשת הוספת מקצוע תתווסף בשלב הבא</p>
            <button className="btn-primary" onClick={handleCloseModal}>
              הבנתי
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
