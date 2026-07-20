import { useState, useEffect, useRef } from 'react';
import './ConsentScreen.css';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/**
 * Consent Screen Component
 *
 * Displays legal documents (Terms, Privacy, Marketing) with scroll-to-enable checkboxes
 * Only mandatory documents (Terms, Privacy) block Continue button
 */
export default function ConsentScreen({
  serviceGroups,
  registrationData,
  setView
}) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Track which documents have been scrolled to bottom
  const [scrolledDocuments, setScrolledDocuments] = useState({});

  // Track which documents have been accepted
  const [acceptedDocuments, setAcceptedDocuments] = useState({});

  useEffect(() => {
    fetchLegalDocuments();
  }, []);

  async function fetchLegalDocuments() {
    if (!registrationData || !registrationData.token) {
      setError('נדרש אימות. אנא חזור לשלב הקודם.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/service-provider/legal/documents`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${registrationData.token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load legal documents');
      }

      setDocuments(result.data || []);
    } catch (err) {
      console.error('Fetch legal documents error:', err);
      setError(err.message || 'שגיאה בטעינת המסמכים. אנא נסו שוב.');
    } finally {
      setLoading(false);
    }
  }

  function handleScroll(docId, event) {
    const element = event.target;
    const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 10;

    if (isAtBottom && !scrolledDocuments[docId]) {
      setScrolledDocuments(prev => ({
        ...prev,
        [docId]: true
      }));
    }
  }

  function handleCheckboxChange(docId, checked) {
    setAcceptedDocuments(prev => ({
      ...prev,
      [docId]: checked
    }));
  }

  async function handleContinue() {
    setSubmitting(true);
    setSubmitError(null);

    try {
      // Build consents array
      const consents = Object.entries(acceptedDocuments)
        .filter(([_, accepted]) => accepted)
        .map(([docId, _]) => {
          const doc = documents.find(d => d.id === parseInt(docId));
          return {
            consentTypeId: parseInt(docId),
            wasScrolled: scrolledDocuments[docId] || false
          };
        });

      // Build services snapshot
      const servicesSnapshot = serviceGroups.map(group => ({
        fieldId: group.fieldId,
        fieldName: group.fieldName,
        professionId: group.professionId,
        professionName: group.professionName,
        serviceIds: group.services.map(s => s.id),
        serviceNames: group.services.map(s => s.name)
      }));

      // Submit consent acceptance
      const response = await fetch(`${API_URL}/api/service-provider/legal/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${registrationData.token}`
        },
        body: JSON.stringify({
          consents,
          servicesSnapshot
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit consents');
      }

      // Navigate to completion screen
      setView('register-complete');
    } catch (err) {
      console.error('Submit consents error:', err);
      setSubmitError(err.message || 'שגיאה בשמירת ההסכמות. אנא נסו שוב.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleBack() {
    setView('register-document-upload');
  }

  // Check if all mandatory documents are accepted
  const mandatoryDocuments = documents.filter(d => d.isMandatory);
  const allMandatoryAccepted = mandatoryDocuments.every(d => acceptedDocuments[d.id]);

  if (loading) {
    return (
      <div className="consent-screen">
        <div className="consent-loading">טוען מסמכים משפטיים...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="consent-screen">
        <div className="consent-error">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button className="btn-secondary" onClick={() => setView('register-document-upload')}>
            חזרה
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="consent-screen">
      <div className="consent-container">
        <div className="consent-header">
          <h1 className="consent-title">הסכמות משפטיות</h1>
          <p className="consent-subtitle">
            אנא קרא את המסמכים הבאים ואשר את הסכמתך כדי להמשיך.
          </p>
        </div>

        <div className="consent-documents">
          {documents.map(doc => (
            <LegalDocumentCard
              key={doc.id}
              document={doc}
              isScrolled={scrolledDocuments[doc.id] || false}
              isAccepted={acceptedDocuments[doc.id] || false}
              onScroll={(e) => handleScroll(doc.id, e)}
              onCheckboxChange={(checked) => handleCheckboxChange(doc.id, checked)}
            />
          ))}
        </div>

        {submitError && (
          <div className="consent-submit-error">
            <span className="error-icon">⚠️</span>
            <span>{submitError}</span>
          </div>
        )}

        <div className="consent-footer">
          <button
            type="button"
            className="btn-primary btn-lg"
            onClick={handleContinue}
            disabled={!allMandatoryAccepted || submitting}
          >
            {submitting ? 'שולח...' : 'המשך'}
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
      </div>
    </div>
  );
}

/**
 * Legal Document Card Component
 *
 * Displays individual legal document with scrollable content and checkbox
 */
function LegalDocumentCard({
  document,
  isScrolled,
  isAccepted,
  onScroll,
  onCheckboxChange
}) {
  const contentRef = useRef(null);
  const [showScrollHint, setShowScrollHint] = useState(true);

  useEffect(() => {
    // Check if content is scrollable
    if (contentRef.current) {
      const isScrollable = contentRef.current.scrollHeight > contentRef.current.clientHeight;
      setShowScrollHint(isScrollable && !isScrolled && document.isMandatory);
    }
  }, [isScrolled, document.isMandatory]);

  const canCheck = !document.isMandatory || isScrolled;

  return (
    <div className="legal-document-card">
      <div className="legal-document-header">
        <h3 className="legal-document-title">{document.titleHe}</h3>
        {document.isMandatory ? (
          <span className="legal-badge legal-badge-required">חובה</span>
        ) : (
          <span className="legal-badge legal-badge-optional">אופציונלי</span>
        )}
      </div>

      <div
        ref={contentRef}
        className="legal-document-content"
        onScroll={onScroll}
      >
        <div
          className="legal-document-text"
          dangerouslySetInnerHTML={{ __html: document.contentHe }}
        />
      </div>

      {showScrollHint && (
        <div className="legal-scroll-hint">
          <span className="hint-icon">👇</span>
          <span className="hint-text">יש לגלול עד סוף המסמך כדי לאשר</span>
        </div>
      )}

      <div className="legal-document-footer">
        <label className="legal-checkbox-label">
          <input
            type="checkbox"
            className="legal-checkbox"
            checked={isAccepted}
            disabled={!canCheck}
            onChange={(e) => onCheckboxChange(e.target.checked)}
          />
          <span className="legal-checkbox-text">
            אני מאשר/ת את {document.titleHe}
          </span>
        </label>
      </div>
    </div>
  );
}
