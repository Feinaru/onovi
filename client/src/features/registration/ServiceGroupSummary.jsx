import { useState } from 'react';
import ServiceGroupCard from './ServiceGroupCard';
import './ServiceGroupSummary.css';

/**
 * ServiceGroupSummary
 *
 * Displays all created Service Groups and provides:
 * - Add another Service Group option
 * - Continue to next registration step
 * - Edit existing Service Groups
 * - Remove Service Groups
 */
export default function ServiceGroupSummary({
  serviceGroups,
  onAddAnother,
  onContinue,
  onEdit,
  onRemove
}) {
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [groupToRemove, setGroupToRemove] = useState(null);

  function handleRemoveClick(serviceGroup) {
    setGroupToRemove(serviceGroup);
    setShowRemoveModal(true);
  }

  function handleConfirmRemove() {
    if (groupToRemove && onRemove) {
      onRemove(groupToRemove);
    }
    setShowRemoveModal(false);
    setGroupToRemove(null);
  }

  function handleCancelRemove() {
    setShowRemoveModal(false);
    setGroupToRemove(null);
  }

  return (
    <div className="service-group-summary">
      <div className="service-group-summary-container">
        <div className="service-group-summary-header">
          <h1 className="service-group-summary-title">קבוצות השירותים שלך</h1>
          <p className="service-group-summary-subtitle">
            סקור את קבוצות השירותים שיצרת. תוכל להוסיף עוד קבוצות או להמשיך לשלב הבא.
          </p>
        </div>

        <div className="service-group-list">
          {serviceGroups.map((group, index) => (
            <ServiceGroupCard
              key={index}
              serviceGroup={group}
              onEdit={onEdit}
              onRemove={handleRemoveClick}
              showActions={true}
              compact={false}
            />
          ))}
        </div>

        <div className="service-group-summary-actions">
          <button
            className="btn-secondary btn-lg"
            onClick={onAddAnother}
            aria-label="הוסף קבוצת שירותים נוספת"
          >
            ➕ הוסף קבוצת שירותים נוספת
          </button>

          <button
            className="btn-primary btn-lg"
            onClick={onContinue}
            aria-label="המשך לשלב הבא"
          >
            המשך לשלב הבא
          </button>
        </div>
      </div>

      {/* Remove Confirmation Modal */}
      {showRemoveModal && (
        <div className="modal-overlay" onClick={handleCancelRemove}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon warning">⚠️</div>
            <h2 className="modal-title">הסר קבוצת שירותים</h2>
            <p className="modal-text">
              האם אתה בטוח שברצונך להסיר את קבוצת השירותים הזו?
            </p>
            {groupToRemove && (
              <div className="modal-group-preview">
                <div className="modal-group-field">{groupToRemove.fieldName}</div>
                <div className="modal-group-profession">{groupToRemove.professionName}</div>
                <div className="modal-group-services">
                  {groupToRemove.services?.map((service, index) => (
                    <span key={service.id}>
                      {service.nameHebrew || service.name}
                      {index < groupToRemove.services.length - 1 && ', '}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="modal-actions">
              <button className="btn-secondary" onClick={handleCancelRemove}>
                ביטול
              </button>
              <button className="btn-danger" onClick={handleConfirmRemove}>
                הסר
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
