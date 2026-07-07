import { useState, useEffect } from 'react';
import { api } from '../../../api';
import BookingCard from '../../business/components/BookingCard';

/**
 * BookingsPage - Standalone bookings management for Service Provider Workspace
 * Manages its own state and fetches bookings for user's businesses
 */
export default function BookingsPage({ user }) {
  const [bookings, setBookings] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, confirmed, completed

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    try {
      setLoading(true);

      // Fetch provider's bookings (backend filters by authenticated user's business)
      const bookingsRes = await api('/api/service-provider/bookings');

      // Handle new response shape: { success, data }
      const bookingsData = bookingsRes.success && Array.isArray(bookingsRes.data)
        ? bookingsRes.data
        : [];

      setBookings(bookingsData);
    } catch (err) {
      console.error('Failed to load bookings:', err);
      showMessage('שגיאה בטעינת הזמנות');
    } finally {
      setLoading(false);
    }
  }

  function showMessage(msg) {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  }

  async function updateBookingStatus(id, status) {
    try {
      const result = await api(`/api/service-provider/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });

      if (result.success) {
        showMessage('הסטטוס עודכן');
        await loadBookings();
      } else {
        showMessage(result.error || 'שגיאה בעדכון סטטוס');
      }
    } catch (err) {
      showMessage(err.message || 'שגיאה בעדכון סטטוס');
    }
  }

  async function cancelBooking(id) {
    if (!confirm('האם לבטל הזמנה זו?')) return;

    try {
      const result = await api(`/api/service-provider/bookings/${id}/cancel`, {
        method: 'PATCH'
      });

      if (result.success) {
        showMessage('ההזמנה בוטלה');
        await loadBookings();
      } else {
        showMessage(result.error || 'שגיאה בביטול הזמנה');
      }
    } catch (err) {
      showMessage(err.message || 'שגיאה בביטול הזמנה');
    }
  }

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>טוען...</div>;
  }

  // Filter bookings based on status filter
  const filteredBookings = bookings.filter(b => {
    if (filter === 'all') return true;
    if (filter === 'pending') return b.status === 'PENDING';
    if (filter === 'confirmed') return b.status === 'CONFIRMED';
    if (filter === 'completed') return b.status === 'COMPLETED' || b.status === 'NO_SHOW';
    return true;
  });

  return (
    <div>
      {/* Message Toast */}
      {message && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 1000
        }}>
          {message}
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('all')}
        >
          הכל ({bookings.length})
        </button>
        <button
          className={`btn ${filter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('pending')}
        >
          ממתינות ({bookings.filter(b => b.status === 'PENDING').length})
        </button>
        <button
          className={`btn ${filter === 'confirmed' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('confirmed')}
        >
          מאושרות ({bookings.filter(b => b.status === 'CONFIRMED').length})
        </button>
        <button
          className={`btn ${filter === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('completed')}
        >
          הושלמו ({bookings.filter(b => b.status === 'COMPLETED' || b.status === 'NO_SHOW').length})
        </button>
      </div>

      {/* Bookings List */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">הזמנות ({filteredBookings.length})</h3>
          <p className="card-description">ניהול כל ההזמנות מלקוחות</p>
        </div>

        {filteredBookings.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3 className="empty-state-title">אין הזמנות</h3>
            <p className="empty-state-description">
              {filter === 'all'
                ? 'עדיין אין הזמנות. לקוחות יוכלו להזמין לאחר שתפרסם תורים'
                : `אין הזמנות בסטטוס ${filter === 'pending' ? 'ממתינות' : filter === 'confirmed' ? 'מאושרות' : 'הושלמו'}`
              }
            </p>
          </div>
        )}

        {filteredBookings.length > 0 && (
          <div style={{ padding: '16px', display: 'grid', gap: '16px' }}>
            {filteredBookings.map(booking => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onUpdateStatus={updateBookingStatus}
                onCancel={cancelBooking}
                showMessage={showMessage}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
