import React from 'react';
import BusinessSearchCard from './BusinessSearchCard';

/**
 * SearchResults - Displays business search results with empty states (Search v2)
 */
function SearchResults({ businesses, loading, hasActiveFilters, onResetFilters, user, setView }) {
  if (loading) {
    return (
      <div className="customer-results-section">
        <div className="empty-state-v2">
          <div className="empty-state-icon-v2">⏳</div>
          <h3 className="empty-state-title-v2">טוען תוצאות...</h3>
        </div>
      </div>
    );
  }

  if (businesses.length > 0) {
    const totalServices = businesses.reduce((sum, b) => sum + b.services.length, 0);

    return (
      <div className="customer-results-section">
        <div className="results-header">
          <h2 className="results-title">
            נמצאו {businesses.length} עסקים עם {totalServices} שירותים זמינים
          </h2>
        </div>

        <div style={{ marginTop: '16px' }}>
          {businesses.map((businessCard, idx) => (
            <BusinessSearchCard
              key={businessCard.business.id || idx}
              businessCard={businessCard}
              setView={setView}
              user={user}
            />
          ))}
        </div>
      </div>
    );
  }

  // Empty States
  return (
    <div className="customer-results-section">
      {hasActiveFilters ? (
        <div className="empty-state-v2">
          <div className="empty-state-icon-v2">🔍</div>
          <h3 className="empty-state-title-v2">לא נמצאו תורים זמינים</h3>
          <p className="empty-state-description-v2">
            נסה להרחיב את טווח התאריכים, לבחור שירות אחר או להגדיל את הרדיוס.
          </p>
          <button className="btn-primary" onClick={onResetFilters}>
            נקה פילטרים
          </button>
        </div>
      ) : (
        <div className="empty-state-v2">
          <div className="empty-state-icon-v2">📅</div>
          <h3 className="empty-state-title-v2">מציגים תורים זמינים בשבועיים הקרובים</h3>
          <p className="empty-state-description-v2">
            השתמש בפילטרים למעלה כדי לחפש תורים פנויים לפי תחום, שירות, תאריך או מיקום
          </p>
          {!user && (
            <button className="btn-primary" onClick={() => setView('auth')}>
              התחבר למערכת
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchResults;
