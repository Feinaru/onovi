import { useState, useEffect } from 'react';
import { api } from '../../../api';

/**
 * ReportsPage - Provider reports dashboard v1
 * Displays revenue, booking counts, utilization, and service performance
 */
export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reports, setReports] = useState(null);
  const [period, setPeriod] = useState('week'); // 'week' | 'month' | 'custom'
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  useEffect(() => {
    fetchReports();
  }, [period]);

  async function fetchReports() {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ period });
      if (period === 'custom' && customFrom && customTo) {
        params.set('from', customFrom);
        params.set('to', customTo);
      }

      const result = await api(`/api/service-provider/reports/summary?${params}`);

      if (result.success) {
        setReports(result.data);
      } else {
        setError(result.error || 'שגיאה בטעינת דוחות');
      }
    } catch (err) {
      console.error('Failed to fetch reports:', err);
      setError('שגיאה בטעינת דוחות');
    } finally {
      setLoading(false);
    }
  }

  function handleCustomDateApply() {
    if (!customFrom || !customTo) {
      setError('נא למלא תאריך התחלה וסיום');
      return;
    }
    fetchReports();
  }

  function formatCurrency(amount) {
    return `₪${amount.toLocaleString('he-IL')}`;
  }

  function formatPercentage(value) {
    return `${value}%`;
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>📊</div>
        <div style={{ color: 'var(--text-secondary)' }}>טוען דוחות...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-body">
          <div style={{ textAlign: 'center', color: 'var(--text-danger)' }}>
            ⚠️ {error}
          </div>
          <button
            className="btn-primary"
            onClick={fetchReports}
            style={{ marginTop: 'var(--space-4)', display: 'block', marginInline: 'auto' }}
          >
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

  if (!reports) {
    return null;
  }

  const { revenue, bookings, availability, services, period: periodInfo } = reports;

  return (
    <div>
      {/* Period Selector */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button
                className={period === 'week' ? 'btn-primary' : 'btn-secondary'}
                onClick={() => setPeriod('week')}
              >
                שבוע נוכחי
              </button>
              <button
                className={period === 'month' ? 'btn-primary' : 'btn-secondary'}
                onClick={() => setPeriod('month')}
              >
                חודש נוכחי
              </button>
              <button
                className={period === 'custom' ? 'btn-primary' : 'btn-secondary'}
                onClick={() => setPeriod('custom')}
              >
                טווח מותאם
              </button>
            </div>

            {period === 'custom' && (
              <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="form-control"
                  style={{ width: '150px' }}
                />
                <span>עד</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="form-control"
                  style={{ width: '150px' }}
                />
                <button
                  className="btn-primary"
                  onClick={handleCustomDateApply}
                >
                  החל
                </button>
              </div>
            )}

            <div style={{ marginRight: 'auto', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              {periodInfo.from} עד {periodInfo.to}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-6)'
      }}>
        {/* Realized Revenue */}
        <div className="card">
          <div className="card-body">
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
              הכנסה ממומשת
            </div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--success-color)' }}>
              {formatCurrency(revenue.realized)}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
              תורים שהושלמו
            </div>
          </div>
        </div>

        {/* Expected Revenue */}
        <div className="card">
          <div className="card-body">
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
              הכנסה צפויה
            </div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--primary-color)' }}>
              {formatCurrency(revenue.expected)}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
              כולל תורים פעילים
            </div>
          </div>
        </div>

        {/* Total Bookings */}
        <div className="card">
          <div className="card-body">
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
              סך הזמנות
            </div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)' }}>
              {bookings.total}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
              פעילות: {bookings.active} | הושלמו: {bookings.completed}
            </div>
          </div>
        </div>

        {/* Utilization Rate */}
        <div className="card">
          <div className="card-body">
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
              אחוז ניצול זמינות
            </div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--info-color)' }}>
              {formatPercentage(availability.utilizationRate)}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
              {availability.slotsWithBookings} מתוך {availability.totalSlots} זמינויות
            </div>
          </div>
        </div>
      </div>

      {/* Booking Status Breakdown */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card-header">
          <h3 className="card-title">פירוט הזמנות לפי סטטוס</h3>
        </div>
        <div className="card-body">
          <table className="table">
            <thead>
              <tr>
                <th>סטטוס</th>
                <th style={{ textAlign: 'left' }}>כמות</th>
              </tr>
            </thead>
            <tbody>
              {bookings.statusBreakdown.PENDING > 0 && (
                <tr>
                  <td>ממתין לאישור</td>
                  <td style={{ textAlign: 'left', fontWeight: 'var(--font-semibold)' }}>
                    {bookings.statusBreakdown.PENDING}
                  </td>
                </tr>
              )}
              {bookings.statusBreakdown.CONFIRMED > 0 && (
                <tr>
                  <td>מאושר</td>
                  <td style={{ textAlign: 'left', fontWeight: 'var(--font-semibold)' }}>
                    {bookings.statusBreakdown.CONFIRMED}
                  </td>
                </tr>
              )}
              {bookings.statusBreakdown.APPROVED > 0 && (
                <tr>
                  <td>מאושר (ישן)</td>
                  <td style={{ textAlign: 'left', fontWeight: 'var(--font-semibold)' }}>
                    {bookings.statusBreakdown.APPROVED}
                  </td>
                </tr>
              )}
              {bookings.statusBreakdown.COMPLETED > 0 && (
                <tr>
                  <td>הושלם</td>
                  <td style={{ textAlign: 'left', fontWeight: 'var(--font-semibold)', color: 'var(--success-color)' }}>
                    {bookings.statusBreakdown.COMPLETED}
                  </td>
                </tr>
              )}
              {bookings.statusBreakdown.CANCELLED_BY_CUSTOMER > 0 && (
                <tr>
                  <td>בוטל על ידי הלקוח</td>
                  <td style={{ textAlign: 'left', fontWeight: 'var(--font-semibold)' }}>
                    {bookings.statusBreakdown.CANCELLED_BY_CUSTOMER}
                  </td>
                </tr>
              )}
              {bookings.statusBreakdown.CANCELLED_BY_BUSINESS > 0 && (
                <tr>
                  <td>בוטל על ידי העסק</td>
                  <td style={{ textAlign: 'left', fontWeight: 'var(--font-semibold)' }}>
                    {bookings.statusBreakdown.CANCELLED_BY_BUSINESS}
                  </td>
                </tr>
              )}
              {bookings.statusBreakdown.CANCELLED > 0 && (
                <tr>
                  <td>בוטל</td>
                  <td style={{ textAlign: 'left', fontWeight: 'var(--font-semibold)' }}>
                    {bookings.statusBreakdown.CANCELLED}
                  </td>
                </tr>
              )}
              {bookings.statusBreakdown.REJECTED > 0 && (
                <tr>
                  <td>נדחה</td>
                  <td style={{ textAlign: 'left', fontWeight: 'var(--font-semibold)' }}>
                    {bookings.statusBreakdown.REJECTED}
                  </td>
                </tr>
              )}
              {bookings.statusBreakdown.NO_SHOW > 0 && (
                <tr>
                  <td>לא הגיע</td>
                  <td style={{ textAlign: 'left', fontWeight: 'var(--font-semibold)' }}>
                    {bookings.statusBreakdown.NO_SHOW}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Services */}
      {services.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">שירותים מובילים</h3>
          </div>
          <div className="card-body">
            <table className="table">
              <thead>
                <tr>
                  <th>שירות</th>
                  <th style={{ textAlign: 'left' }}>הזמנות</th>
                  <th style={{ textAlign: 'left' }}>הושלמו</th>
                  <th style={{ textAlign: 'left' }}>הכנסה</th>
                </tr>
              </thead>
              <tbody>
                {services.map(service => (
                  <tr key={service.id}>
                    <td>{service.name}</td>
                    <td style={{ textAlign: 'left', fontWeight: 'var(--font-semibold)' }}>
                      {service.bookingCount}
                    </td>
                    <td style={{ textAlign: 'left' }}>
                      {service.completedCount}
                    </td>
                    <td style={{ textAlign: 'left', fontWeight: 'var(--font-semibold)', color: 'var(--success-color)' }}>
                      {formatCurrency(service.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {bookings.total === 0 && (
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>📊</div>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>
              אין נתונים לתקופה זו
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              בחר תקופה אחרת או המתן להזמנות חדשות
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
