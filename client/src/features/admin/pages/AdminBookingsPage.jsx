import { useState, useEffect } from 'react';
import { api } from '../../../api';

/**
 * AdminBookingsPage - Admin-only booking management
 * View and manage all bookings across the marketplace
 */
export default function AdminBookingsPage({ setView }) {
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');

  // Action modals
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadBookings();
  }, [pagination.page, statusFilter, startDate, endDate, search]);

  async function loadBookings() {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit
      });

      if (statusFilter) params.append('status', statusFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (search) params.append('search', search);

      const data = await api(`/api/admin/bookings?${params.toString()}`);
      setBookings(data.bookings);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Failed to load bookings:', err);
      setError(err.message || 'שגיאה בטעינת הזמנות');
    } finally {
      setLoading(false);
    }
  }

  async function updateBookingStatus(bookingId, newStatus) {
    try {
      setActionLoading(true);
      await api(`/bookings/${bookingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      showMessage('הסטטוס עודכן בהצלחה');
      setShowStatusModal(false);
      setSelectedBooking(null);
      await loadBookings();
    } catch (err) {
      setError(err.message || 'שגיאה בעדכון סטטוס');
    } finally {
      setActionLoading(false);
    }
  }

  async function cancelBooking(bookingId) {
    try {
      setActionLoading(true);
      await api(`/bookings/${bookingId}/cancel`, {
        method: 'PATCH'
      });
      showMessage('ההזמנה בוטלה בהצלחה');
      setShowCancelModal(false);
      setSelectedBooking(null);
      await loadBookings();
    } catch (err) {
      setError(err.message || 'שגיאה בביטול הזמנה');
    } finally {
      setActionLoading(false);
    }
  }

  function showMessage(msg) {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  }

  function getStatusBadge(status) {
    const statusConfig = {
      PENDING: { bg: 'var(--warning-50)', color: 'var(--warning-700)', label: 'ממתין' },
      CONFIRMED: { bg: 'var(--success-50)', color: 'var(--success-700)', label: 'מאושר' },
      COMPLETED: { bg: 'var(--primary-50)', color: 'var(--primary-700)', label: 'הושלם' },
      CANCELLED_BY_CUSTOMER: { bg: 'var(--gray-100)', color: 'var(--gray-700)', label: 'בוטל ע"י לקוח' },
      CANCELLED_BY_BUSINESS: { bg: 'var(--gray-100)', color: 'var(--gray-700)', label: 'בוטל ע"י עסק' },
      NO_SHOW: { bg: 'var(--danger-50)', color: 'var(--danger-700)', label: 'לא הגיע' },
      REJECTED: { bg: 'var(--danger-50)', color: 'var(--danger-700)', label: 'נדחה' },
      APPROVED: { bg: 'var(--success-50)', color: 'var(--success-700)', label: 'מאושר' },
      CANCELLED: { bg: 'var(--gray-100)', color: 'var(--gray-700)', label: 'בוטל' }
    };

    const config = statusConfig[status] || { bg: 'var(--gray-100)', color: 'var(--gray-700)', label: status };

    return (
      <span style={{
        padding: 'var(--space-1) var(--space-3)',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--font-medium)',
        backgroundColor: config.bg,
        color: config.color
      }}>
        {config.label}
      </span>
    );
  }

  function formatDateTime(date, time) {
    if (!date) return 'תאריך לא זמין';
    return time ? `${date} ${time}` : date;
  }

  function resetFilters() {
    setStatusFilter('');
    setStartDate('');
    setEndDate('');
    setSearch('');
    setPagination({ ...pagination, page: 1 });
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">ניהול הזמנות</h1>
        <p className="page-description">צפייה וניהול כל ההזמנות במערכת</p>
      </div>

      {/* Messages */}
      {message && (
        <div style={{
          padding: 'var(--space-4)',
          marginBottom: 'var(--space-4)',
          backgroundColor: 'var(--success-50)',
          color: 'var(--success-700)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--success-200)'
        }}>
          ✓ {message}
        </div>
      )}

      {error && (
        <div style={{
          padding: 'var(--space-4)',
          marginBottom: 'var(--space-4)',
          backgroundColor: 'var(--danger-50)',
          color: 'var(--danger-700)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--danger-200)'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card-header">
          <h3 className="card-title">סינון הזמנות</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', padding: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label">סטטוס</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination({ ...pagination, page: 1 });
              }}
              style={{ width: '100%' }}
            >
              <option value="">הכל</option>
              <option value="PENDING">ממתין</option>
              <option value="CONFIRMED">מאושר</option>
              <option value="COMPLETED">הושלם</option>
              <option value="CANCELLED_BY_CUSTOMER">בוטל ע"י לקוח</option>
              <option value="CANCELLED_BY_BUSINESS">בוטל ע"י עסק</option>
              <option value="NO_SHOW">לא הגיע</option>
              <option value="REJECTED">נדחה</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">מתאריך</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPagination({ ...pagination, page: 1 });
              }}
              style={{ width: '100%' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">עד תאריך</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPagination({ ...pagination, page: 1 });
              }}
              style={{ width: '100%' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">חיפוש לקוח</label>
            <input
              type="text"
              placeholder="שם או טלפון"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination({ ...pagination, page: 1 });
              }}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div style={{ padding: '0 var(--space-4) var(--space-4)' }}>
          <button className="btn-secondary" onClick={resetFilters}>
            🔄 נקה סינונים
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)' }}>⏳</div>
          <div style={{ fontSize: 'var(--text-lg)', color: 'var(--text-secondary)' }}>טוען הזמנות...</div>
        </div>
      )}

      {/* Empty State */}
      {!loading && bookings.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">אין הזמנות להצגה</div>
          <div className="empty-state-description">
            {statusFilter || startDate || endDate || search
              ? 'לא נמצאו הזמנות לפי הסינון שבחרת. נסה לשנות את הפילטרים'
              : 'עדיין אין הזמנות במערכת. הזמנות חדשות יופיעו כאן'
            }
          </div>
          {(statusFilter || startDate || endDate || search) && (
            <button className="btn-secondary" onClick={resetFilters} style={{ marginTop: 'var(--space-3)' }}>
              🔄 נקה סינונים
            </button>
          )}
        </div>
      )}

      {/* Bookings Table */}
      {!loading && bookings.length > 0 && (
        <>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">הזמנות ({pagination.total})</h3>
              <p className="card-description">
                מציג {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} מתוך {pagination.total}
              </p>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>מזהה</th>
                    <th>תאריך ושעה</th>
                    <th>לקוח</th>
                    <th>עסק</th>
                    <th>שירות</th>
                    <th>מחיר</th>
                    <th>סטטוס</th>
                    <th>פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: 'var(--text-sm)' }}>#{booking.id}</td>
                      <td>
                        <div style={{ fontWeight: 'var(--font-semibold)' }}>
                          {formatDateTime(booking.slot?.date, booking.startTime)}
                        </div>
                        {booking.slot && (
                          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                            {booking.slot.startTime} - {booking.slot.endTime}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 'var(--font-semibold)' }}>
                          {booking.customerName || 'לקוח לא זמין'}
                        </div>
                        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                          📞 {booking.customerPhone || 'טלפון לא זמין'}
                        </div>
                        {booking.customer && (
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                            {booking.customer.email || ''}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 'var(--font-semibold)' }}>
                          {booking.business?.name || 'עסק לא זמין'}
                        </div>
                        {booking.business && (
                          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                            📍 {booking.business.cityNameHebrew || booking.business.city || ''}
                          </div>
                        )}
                      </td>
                      <td>
                        <div>{booking.businessService?.name || 'שירות לא זמין'}</div>
                        {booking.businessService && (
                          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                            ⏱️ {booking.businessService.durationMinutes} דקות
                          </div>
                        )}
                      </td>
                      <td style={{ fontWeight: 'var(--font-semibold)' }}>
                        ₪{booking.price || 0}
                      </td>
                      <td>
                        {getStatusBadge(booking.status)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <button
                            className="btn-sm btn-secondary"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowStatusModal(true);
                            }}
                            disabled={['COMPLETED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_BUSINESS', 'NO_SHOW'].includes(booking.status)}
                          >
                            📝 סטטוס
                          </button>
                          <button
                            className="btn-sm btn-danger"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowCancelModal(true);
                            }}
                            disabled={['COMPLETED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_BUSINESS', 'NO_SHOW'].includes(booking.status)}
                          >
                            🗑️ ביטול
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-6)' }}>
              <button
                className="btn-secondary"
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
              >
                ← הקודם
              </button>
              <span style={{ padding: 'var(--space-2) var(--space-4)', display: 'flex', alignItems: 'center' }}>
                עמוד {pagination.page} מתוך {pagination.totalPages}
              </span>
              <button
                className="btn-secondary"
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.totalPages}
              >
                הבא →
              </button>
            </div>
          )}
        </>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedBooking && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-6)',
            maxWidth: '400px',
            width: '90%',
            boxShadow: 'var(--shadow-2xl)'
          }}>
            <h3 style={{ marginBottom: 'var(--space-4)' }}>עדכון סטטוס הזמנה</h3>
            <p style={{ marginBottom: 'var(--space-4)', color: 'var(--text-secondary)' }}>
              הזמנה #{selectedBooking.id} - {selectedBooking.customerName}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
              <button
                className="btn-secondary"
                onClick={() => updateBookingStatus(selectedBooking.id, 'CONFIRMED')}
                disabled={actionLoading}
                style={{ justifyContent: 'flex-start' }}
              >
                ✓ מאושר
              </button>
              <button
                className="btn-secondary"
                onClick={() => updateBookingStatus(selectedBooking.id, 'COMPLETED')}
                disabled={actionLoading}
                style={{ justifyContent: 'flex-start' }}
              >
                ✓ הושלם
              </button>
              <button
                className="btn-secondary"
                onClick={() => updateBookingStatus(selectedBooking.id, 'NO_SHOW')}
                disabled={actionLoading}
                style={{ justifyContent: 'flex-start' }}
              >
                ✗ לא הגיע
              </button>
              <button
                className="btn-secondary"
                onClick={() => updateBookingStatus(selectedBooking.id, 'REJECTED')}
                disabled={actionLoading}
                style={{ justifyContent: 'flex-start' }}
              >
                ✗ נדחה
              </button>
            </div>

            <button
              className="btn-secondary"
              onClick={() => {
                setShowStatusModal(false);
                setSelectedBooking(null);
              }}
              disabled={actionLoading}
              style={{ width: '100%' }}
            >
              ביטול
            </button>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && selectedBooking && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-6)',
            maxWidth: '400px',
            width: '90%',
            boxShadow: 'var(--shadow-2xl)'
          }}>
            <h3 style={{ marginBottom: 'var(--space-4)' }}>ביטול הזמנה</h3>
            <p style={{ marginBottom: 'var(--space-4)', color: 'var(--text-secondary)' }}>
              האם אתה בטוח שברצונך לבטל את הזמנה #{selectedBooking.id}?
            </p>
            <p style={{ marginBottom: 'var(--space-4)', fontWeight: 'var(--font-semibold)' }}>
              לקוח: {selectedBooking.customerName}<br />
              תאריך: {formatDateTime(selectedBooking.slot?.date, selectedBooking.startTime)}
            </p>

            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button
                className="btn-danger"
                onClick={() => cancelBooking(selectedBooking.id)}
                disabled={actionLoading}
                style={{ flex: 1 }}
              >
                {actionLoading ? 'מבטל...' : 'כן, בטל הזמנה'}
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedBooking(null);
                }}
                disabled={actionLoading}
                style={{ flex: 1 }}
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
