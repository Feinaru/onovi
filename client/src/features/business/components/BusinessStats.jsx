import React from 'react';

/**
 * BusinessStats - Dashboard KPI cards
 */
function BusinessStats({ services, slots, bookings }) {
  const openSlots = slots.filter(s => s.status === 'OPEN');
  const pendingBookings = bookings.filter(b => b.status === 'PENDING');
  const completedBookings = bookings.filter(b => b.status === 'COMPLETED');

  return (
    <div className="grid grid-3 mb-8">
      <div className="kpi-card">
        <div className="kpi-header">
          <div className="kpi-icon kpi-icon-primary">🛎️</div>
          <div className="kpi-label">סה״כ שירותים</div>
        </div>
        <div className="kpi-value">{services.length}</div>
      </div>

      <div className="kpi-card">
        <div className="kpi-header">
          <div className="kpi-icon kpi-icon-accent">📅</div>
          <div className="kpi-label">תורים פתוחים</div>
        </div>
        <div className="kpi-value">{openSlots.length}</div>
        <div className="kpi-trend">מתוך {slots.length} סה״כ</div>
      </div>

      <div className="kpi-card">
        <div className="kpi-header">
          <div className="kpi-icon kpi-icon-warning">⏳</div>
          <div className="kpi-label">הזמנות ממתינות</div>
        </div>
        <div className="kpi-value">{pendingBookings.length}</div>
        <div className="kpi-trend">דורש טיפול</div>
      </div>

      <div className="kpi-card">
        <div className="kpi-header">
          <div className="kpi-icon kpi-icon-primary">📋</div>
          <div className="kpi-label">סה״כ הזמנות</div>
        </div>
        <div className="kpi-value">{bookings.length}</div>
      </div>

      <div className="kpi-card">
        <div className="kpi-header">
          <div className="kpi-icon kpi-icon-success">✅</div>
          <div className="kpi-label">הושלמו</div>
        </div>
        <div className="kpi-value">{completedBookings.length}</div>
        <div className="kpi-trend kpi-trend-up">
          {bookings.length > 0 ? Math.round((completedBookings.length / bookings.length) * 100) : 0}% מכלל ההזמנות
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-header">
          <div className="kpi-icon kpi-icon-accent">📊</div>
          <div className="kpi-label">ממוצע לעסק</div>
        </div>
        <div className="kpi-value">
          {services.length > 0 ? Math.round(bookings.length / services.length) : 0}
        </div>
        <div className="kpi-trend">הזמנות</div>
      </div>
    </div>
  );
}

export default BusinessStats;
