import './ServiceGroupCard.css';

/**
 * ServiceGroupCard
 *
 * Reusable component for displaying a Service Group summary.
 *
 * A Service Group is a business concept (not a database entity) that contains:
 * - One Field
 * - One Profession
 * - One or more Services
 *
 * This component can be used in:
 * - Registration flow (with edit/remove actions)
 * - Service provider dashboard (with different edit capabilities)
 */
export default function ServiceGroupCard({
  serviceGroup,
  onEdit,
  onRemove,
  showActions = true,
  compact = false
}) {
  const { fieldName, professionName, services } = serviceGroup;

  return (
    <div className={`service-group-card ${compact ? 'service-group-card-compact' : ''}`}>
      <div className="service-group-card-content">
        <div className="service-group-field">{fieldName}</div>
        <div className="service-group-profession">{professionName}</div>
        {services && services.length > 0 && (
          <div className="service-group-services">
            {services.map((service, index) => (
              <span key={service.id} className="service-name">
                {service.nameHebrew || service.name}
                {index < services.length - 1 && ', '}
              </span>
            ))}
          </div>
        )}
      </div>

      {showActions && (
        <div className="service-group-card-actions">
          {onEdit && (
            <button
              className="btn-link service-group-action-btn"
              onClick={() => onEdit(serviceGroup)}
              aria-label="ערוך קבוצת שירותים"
            >
              ערוך
            </button>
          )}
          {onRemove && (
            <button
              className="btn-link service-group-action-btn service-group-remove-btn"
              onClick={() => onRemove(serviceGroup)}
              aria-label="הסר קבוצת שירותים"
            >
              הסר
            </button>
          )}
        </div>
      )}
    </div>
  );
}
