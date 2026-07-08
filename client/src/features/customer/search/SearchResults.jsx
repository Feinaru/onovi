import React from 'react';
import SlotCard from './SlotCard';

/**
 * SearchResults - Displays search results with empty states
 */
function SearchResults({ filteredSlots, allSlots, filters, onSlotSelect, onResetFilters, user, setView }) {
  if (filteredSlots.length > 0) {
    return (
      <div className="customer-results-section">
        <div className="results-header">
          <h2 className="results-title">
            נמצאו {filteredSlots.length} תורים זמינים
          </h2>
          {filters.onlyDiscounted && (
            <div className="results-badge">
              🔥 תורים מוזלים בלבד
            </div>
          )}
        </div>

        <div className="slots-grid">
          {filteredSlots.map(slot => (
            <SlotCard key={slot.id} slot={slot} onSelect={onSlotSelect} setView={setView} />
          ))}
        </div>
      </div>
    );
  }

  // Empty States
  return (
    <div className="customer-results-section">
      {filteredSlots.length === 0 && allSlots.length > 0 && !filters.onlyDiscounted && (
        <div className="empty-state-v2">
          <div className="empty-state-icon-v2">🔍</div>
          <h3 className="empty-state-title-v2">לא נמצאו תורים מתאימים</h3>
          <p className="empty-state-description-v2">
            נסה לשנות את הפילטרים או לחפש בתאריך אחר
          </p>
          <button className="btn-primary" onClick={onResetFilters}>
            נקה פילטרים
          </button>
        </div>
      )}

      {allSlots.length === 0 && !filters.categoryId && (
        <div className="empty-state-v2">
          <div className="empty-state-icon-v2">🔍</div>
          <h3 className="empty-state-title-v2">חפש תורים זמינים</h3>
          <p className="empty-state-description-v2">
            בחר קטגוריה, עיר או תאריך כדי למצוא תורים פנויים
          </p>
        </div>
      )}

      {allSlots.length === 0 && filters.categoryId && (
        <div className="empty-state-v2">
          <div className="empty-state-icon-v2">😔</div>
          <h3 className="empty-state-title-v2">אין תורים זמינים כרגע</h3>
          <p className="empty-state-description-v2">
            נסה לחפש בתאריך אחר או באזור אחר
          </p>
          {!user && (
            <button className="btn-primary" onClick={() => setView('auth')}>
              התחבר כדי לקבל התראות על תורים חדשים
            </button>
          )}
        </div>
      )}

      {filteredSlots.length === 0 && allSlots.length > 0 && filters.onlyDiscounted && (
        <div className="empty-state-v2">
          <div className="empty-state-icon-v2">💸</div>
          <h3 className="empty-state-title-v2">אין תורים מוזלים כרגע</h3>
          <p className="empty-state-description-v2">
            כל התורים הזמינים במחיר רגיל. נסה לבטל את הפילטר "רק תורים מוזלים"
          </p>
          <button className="btn-secondary" onClick={() => onResetFilters()}>
            הצג את כל התורים
          </button>
        </div>
      )}
    </div>
  );
}

export default SearchResults;
