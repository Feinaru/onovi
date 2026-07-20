import { useState } from 'react';
import './DocumentCard.css';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/**
 * Document Card Component
 *
 * Displays document type with upload status and related service groups
 * Statuses: NOT_UPLOADED, UNDER_REVIEW, APPROVED, REJECTED
 */
export default function DocumentCard({
  document,
  serviceGroups,
  registrationData,
  uploadedDocument,
  onUpload
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const { documentType, instruction, requiredByServices } = document;

  // Determine status
  const status = uploadedDocument?.status || 'NOT_UPLOADED';
  const rejectionNote = uploadedDocument?.adminNote || null;

  // Get status display
  function getStatusDisplay() {
    switch (status) {
      case 'NOT_UPLOADED':
        return { icon: '⬜', text: 'לא הועלה', className: 'status-not-uploaded' };
      case 'UNDER_REVIEW':
        return { icon: '🟡', text: 'בבדיקה', className: 'status-under-review' };
      case 'APPROVED':
        return { icon: '🟢', text: 'אושר', className: 'status-approved' };
      case 'REJECTED':
        return { icon: '🔴', text: 'נדחה', className: 'status-rejected' };
      default:
        return { icon: '⬜', text: 'לא הועלה', className: 'status-not-uploaded' };
    }
  }

  // Map service IDs to service group names
  function getRelatedServiceGroups() {
    const related = [];

    requiredByServices.forEach(service => {
      const group = serviceGroups.find(g =>
        g.services.some(s => s.id === service.serviceTemplateId)
      );

      if (group && !related.some(r => r.fieldName === group.fieldName && r.professionName === group.professionName)) {
        related.push({
          fieldName: group.fieldName,
          professionName: group.professionName
        });
      }
    });

    return related;
  }

  async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!registrationData || !registrationData.token) {
      setError('יש להשלים את הרישום לפני העלאת מסמכים');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Upload document using real backend API
      const response = await fetch(`${API_URL}/api/service-provider/documents/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${registrationData.token}`
        },
        body: JSON.stringify({
          documentTypeId: documentType.id,
          fileName: file.name,
          fileUrl: `https://storage.example.com/${Date.now()}-${file.name}`, // Placeholder URL
          fileSizeKB: Math.round(file.size / 1024)
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload document');
      }

      // Update parent state with uploaded document
      onUpload(documentType.id, result.data);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'שגיאה בהעלאת הקובץ. אנא נסה שוב.');
    } finally {
      setUploading(false);
    }
  }

  const statusDisplay = getStatusDisplay();
  const relatedGroups = getRelatedServiceGroups();
  const acceptedFormats = JSON.parse(documentType.acceptedFormats || '[]');

  return (
    <div className="document-card">
      <div className="document-card-header">
        <div className="document-card-title-section">
          <h3 className="document-card-title">
            {documentType.nameHebrew || documentType.name}
          </h3>
          {documentType.description && (
            <p className="document-card-description">{documentType.description}</p>
          )}
        </div>
        <div className={`document-card-status ${statusDisplay.className}`}>
          <span className="status-icon">{statusDisplay.icon}</span>
          <span className="status-text">{statusDisplay.text}</span>
        </div>
      </div>

      {instruction && (
        <div className="document-card-instruction">
          <span className="instruction-icon">ℹ️</span>
          <span className="instruction-text">{instruction}</span>
        </div>
      )}

      {relatedGroups.length > 0 && (
        <div className="document-card-groups">
          <div className="groups-label">נדרש עבור:</div>
          <ul className="groups-list">
            {relatedGroups.map((group, index) => (
              <li key={index} className="group-item">
                • {group.fieldName} → {group.professionName}
              </li>
            ))}
          </ul>
        </div>
      )}

      {status === 'REJECTED' && rejectionNote && (
        <div className="document-card-rejection">
          <div className="rejection-label">סיבת דחייה:</div>
          <div className="rejection-note">{rejectionNote}</div>
        </div>
      )}

      <div className="document-card-footer">
        <label className="document-upload-btn">
          <input
            type="file"
            accept={acceptedFormats.join(',')}
            onChange={handleFileSelect}
            disabled={uploading}
            style={{ display: 'none' }}
          />
          {uploading ? (
            <span className="btn-text">מעלה...</span>
          ) : status === 'REJECTED' || status === 'NOT_UPLOADED' ? (
            <span className="btn-text">{status === 'REJECTED' ? 'העלה שוב' : 'העלה מסמך'}</span>
          ) : (
            <span className="btn-text">החלף מסמך</span>
          )}
        </label>

        {acceptedFormats.length > 0 && (
          <span className="document-formats-hint">
            פורמטים: {acceptedFormats.join(', ')} | מקסימום {documentType.maxSizeKB}KB
          </span>
        )}
      </div>

      {error && (
        <div className="document-card-error">{error}</div>
      )}
    </div>
  );
}
