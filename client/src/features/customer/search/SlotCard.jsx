import React from 'react';

/**
 * SlotCard - Individual slot display card
 */
function SlotCard({ slot, onSelect }) {
  const calculateDiscount = (regular, deal) => {
    if (!deal) return 0;
    return Math.round(((regular - deal) / regular) * 100);
  };

  const calculateSavings = (regular, deal) => {
    if (!deal) return 0;
    return regular - deal;
  };

  const getUrgencyBadge = (dateStr) => {
    const slotDate = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    nextWeek.setHours(0, 0, 0, 0);
    slotDate.setHours(0, 0, 0, 0);

    if (slotDate.getTime() === today.getTime()) return { text: 'היום', color: 'danger' };
    if (slotDate.getTime() === tomorrow.getTime()) return { text: 'מחר', color: 'warning' };
    if (slotDate <= nextWeek) return { text: 'השבוע', color: 'accent' };
    return null;
  };

  const discount = calculateDiscount(slot.regularPrice, slot.dealPrice);
  const savings = calculateSavings(slot.regularPrice, slot.dealPrice);
  const hasDeal = slot.dealPrice && slot.dealPrice < slot.regularPrice;
  const urgency = getUrgencyBadge(slot.date);

  return (
    <div className="slot-card-v2">
      {/* Badges */}
      <div className="slot-badges">
        {hasDeal && (
          <div className="slot-badge slot-badge-discount">
            🔥 {discount}% הנחה
          </div>
        )}
        {urgency && (
          <div className={`slot-badge slot-badge-${urgency.color}`}>
            ⚡ {urgency.text}
          </div>
        )}
      </div>

      {/* Business Info */}
      <div className="slot-business-info">
        <h3 className="slot-business-name">{slot.business.name}</h3>
        <div className="slot-location">
          📍 {slot.business.city}
        </div>
      </div>

      {/* Service Name */}
      <div className="slot-service-name">
        {slot.service.name}
      </div>

      {/* Details */}
      <div className="slot-details-grid">
        <div className="slot-detail">
          <span className="detail-icon">📅</span>
          <span className="detail-text">{slot.date}</span>
        </div>
        <div className="slot-detail">
          <span className="detail-icon">⏰</span>
          <span className="detail-text">{slot.startTime}</span>
        </div>
        <div className="slot-detail">
          <span className="detail-icon">⏱️</span>
          <span className="detail-text">{slot.service.durationMinutes} דקות</span>
        </div>
      </div>

      {/* Pricing */}
      <div className="slot-pricing">
        <div className="slot-price-main">
          ₪{slot.dealPrice || slot.regularPrice}
        </div>
        {hasDeal && (
          <div className="slot-price-details">
            <span className="slot-price-original">₪{slot.regularPrice}</span>
            <span className="slot-savings">חוסכים ₪{savings}</span>
          </div>
        )}
      </div>

      {/* CTA */}
      <button className="slot-cta-btn" onClick={() => onSelect(slot)}>
        הזמן עכשיו
      </button>
    </div>
  );
}

export default SlotCard;
