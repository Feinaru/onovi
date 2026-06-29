import React from 'react';
import { api } from '../../../api';
import BookingCard from '../components/BookingCard';

/**
 * BookingsTab - View and manage bookings
 */
function BookingsTab({ bookings, showMessage, reload }) {
  async function updateBookingStatus(id, status) {
    try {
      await api(`/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      showMessage('הסטטוס עודכן');
      await reload();
    } catch (err) {
      showMessage(err.message);
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">הזמנות ({bookings.length})</h3>
        <p className="card-description">ניהול כל ההזמנות מלקוחות</p>
      </div>
      {bookings.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">אין הזמנות עדיין</div>
          <div className="empty-state-description">
            כשלקוחות יזמינו תורים, הם יופיעו כאן
          </div>
        </div>
      )}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>לקוח</th>
              <th>שירות</th>
              <th>תאריך ושעה</th>
              <th>מחיר</th>
              <th>סטטוס</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(b => (
              <BookingCard
                key={b.id}
                booking={b}
                onStatusChange={updateBookingStatus}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default BookingsTab;
