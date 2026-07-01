import React, { useState, useEffect } from 'react';
import { api } from '../../../../../api';
import './UserActivityTab.css';

/**
 * UserActivityTab - Shows user's bookings (customer) or businesses (business owner)
 */
function UserActivityTab({ user }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivity() {
      setLoading(true);
      try {
        if (user.role === 'CUSTOMER') {
          const bookings = await api(`/bookings?userId=${user.id}`);
          setData(bookings);
        } else if (user.role === 'BUSINESS') {
          const businesses = await api(`/businesses?ownerId=${user.id}`);
          setData(businesses);
        }
      } catch (err) {
        console.error('Failed to fetch activity:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchActivity();
  }, [user.id, user.role]);

  if (loading) {
    return <div className="activity-tab-loading">טוען פעילות...</div>;
  }

  if (user.role === 'CUSTOMER') {
    return (
      <div className="user-activity-tab">
        <h3 className="activity-tab-title">הזמנות ({data.length})</h3>
        {data.length === 0 ? (
          <div className="activity-tab-empty">
            <div className="activity-tab-empty-icon">📅</div>
            <p>לא בוצעו הזמנות עדיין</p>
          </div>
        ) : (
          <div className="activity-list">
            {data.map(booking => (
              <div key={booking.id} className="activity-item">
                <div className="activity-item-header">
                  <span className="activity-item-title">{booking.service?.name || 'שירות'}</span>
                  <span className="activity-item-status">{booking.status}</span>
                </div>
                <div className="activity-item-details">
                  <span>תאריך: {booking.date}</span>
                  <span>שעה: {booking.startTime}</span>
                  <span>מחיר: ₪{booking.finalPrice}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (user.role === 'BUSINESS') {
    return (
      <div className="user-activity-tab">
        <h3 className="activity-tab-title">עסקים ({data.length})</h3>
        {data.length === 0 ? (
          <div className="activity-tab-empty">
            <div className="activity-tab-empty-icon">🏪</div>
            <p>לא נוצרו עסקים עדיין</p>
          </div>
        ) : (
          <div className="activity-list">
            {data.map(business => (
              <div key={business.id} className="activity-item">
                <div className="activity-item-header">
                  <span className="activity-item-title">{business.name}</span>
                  <span className="activity-item-status">{business.status}</span>
                </div>
                <div className="activity-item-details">
                  <span>{business.category?.name || 'קטגוריה'}</span>
                  <span>{business.city}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="user-activity-tab">
      <div className="activity-tab-empty">
        <p>אין פעילות להצגה</p>
      </div>
    </div>
  );
}

export default UserActivityTab;
