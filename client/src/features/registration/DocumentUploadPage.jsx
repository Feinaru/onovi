import { useState, useEffect } from 'react';
import DocumentCard from './DocumentCard';
import './DocumentUploadPage.css';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export default function DocumentUploadPage({
  serviceGroups,
  registrationData,
  uploadedDocuments,
  onDocumentsChange,
  setView
}) {
  const [requiredDocuments, setRequiredDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRequiredDocuments();
  }, [serviceGroups]);

  async function loadRequiredDocuments() {
    if (!serviceGroups || serviceGroups.length === 0) {
      setError('לא נבחרו קבוצות שירותים');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Collect all service template IDs from all service groups
      const serviceTemplateIds = [];
      serviceGroups.forEach(group => {
        group.services.forEach(service => {
          if (!serviceTemplateIds.includes(service.id)) {
            serviceTemplateIds.push(service.id);
          }
        });
      });

      const response = await fetch(`${API_URL}/api/registration/required-documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ serviceTemplateIds })
      });

      if (!response.ok) {
        throw new Error('Failed to load required documents');
      }

      const data = await response.json();
      setRequiredDocuments(data.data || []);
    } catch (err) {
      console.error('Error loading required documents:', err);
      setError('שגיאה בטעינת המסמכים הנדרשים. אנא נסו שוב.');
    } finally {
      setLoading(false);
    }
  }

  function handleDocumentUpload(documentTypeId, uploadData) {
    const updated = {
      ...uploadedDocuments,
      [documentTypeId]: uploadData
    };
    onDocumentsChange(updated);
  }

  function handleContinue() {
    setView('register-consent');
  }

  function handleBack() {
    setView('register-business-details');
  }

  if (loading) {
    return (
      <div className="document-upload">
        <div className="document-upload-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>טוען מסמכים נדרשים...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="document-upload">
        <div className="document-upload-container">
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h2>אופס! משהו השתבש</h2>
            <p>{error}</p>
            <div className="error-actions">
              <button className="btn-primary" onClick={loadRequiredDocuments}>
                נסה שוב
              </button>
              <button className="btn-secondary" onClick={handleBack}>
                חזרה
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (requiredDocuments.length === 0) {
    return (
      <div className="document-upload">
        <div className="document-upload-container">
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <h2>אין מסמכים נדרשים</h2>
            <p>השירותים שנבחרו אינם מחייבים העלאת מסמכים.</p>
            <div className="empty-actions">
              <button className="btn-primary" onClick={handleContinue}>
                המשך
              </button>
              <button className="btn-secondary" onClick={handleBack}>
                חזרה
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Count uploaded documents (regardless of approval status)
  const uploadedCount = requiredDocuments.filter(doc =>
    uploadedDocuments[doc.documentType.id]
  ).length;
  const totalCount = requiredDocuments.length;
  const allUploaded = uploadedCount === totalCount;

  return (
    <div className="document-upload">
      <div className="document-upload-container">
        <div className="document-upload-header">
          <h1 className="document-upload-title">העלאת מסמכים</h1>
          <p className="document-upload-subtitle">
            אנא העלו את המסמכים הנדרשים עבור השירותים שבחרתם
          </p>
        </div>

        <div className="documents-list">
          {requiredDocuments.map(doc => (
            <DocumentCard
              key={doc.documentType.id}
              document={doc}
              serviceGroups={serviceGroups}
              registrationData={registrationData}
              uploadedDocument={uploadedDocuments[doc.documentType.id]}
              onUpload={handleDocumentUpload}
            />
          ))}
        </div>

        <div className="document-upload-footer">
          <div className="upload-summary">
            <span className="summary-icon">📊</span>
            <span className="summary-text">
              {uploadedCount} מתוך {totalCount} מסמכים הועלו
            </span>
          </div>

          <div className="footer-actions">
            <button
              className="btn-primary btn-lg"
              onClick={handleContinue}
              disabled={!allUploaded}
            >
              המשך
            </button>
            <button className="btn-secondary btn-lg" onClick={handleBack}>
              חזרה
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
