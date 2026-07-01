import React, { useState } from 'react';
import './KPIBar.css';

/**
 * KPIBar - Today's performance metrics
 */
function KPIBar({ metrics }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!metrics) return null;

  const getFillRateColor = (rate) => {
    if (rate >= 75) return '#10b981'; // Green
    if (rate >= 50) return '#eab308'; // Yellow
    return '#ef4444'; // Red
  };

  return (
    <div className="kpi-bar">
      <div className="kpi-bar-summary" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="kpi-bar-title">
          <span>📊 Today's Performance</span>
          <button className="kpi-bar-toggle">
            {isExpanded ? '▼ Hide' : '▶ Show'}
          </button>
        </div>

        <div className="kpi-bar-metrics">
          <div className="kpi-metric">
            <div className="kpi-metric-label">✅ Secured</div>
            <div className="kpi-metric-value" style={{ color: '#10b981' }}>
              ₪{metrics.securedRevenue}
            </div>
          </div>

          <div className="kpi-metric">
            <div className="kpi-metric-label">💰 Potential</div>
            <div className="kpi-metric-value" style={{ color: '#3b82f6' }}>
              ₪{metrics.potentialRevenue}
            </div>
          </div>

          <div className="kpi-metric">
            <div className="kpi-metric-label">📅 Published</div>
            <div className="kpi-metric-value">
              {metrics.publishedGaps} gaps
            </div>
          </div>

          <div className="kpi-metric">
            <div className="kpi-metric-label">📈 Fill Rate</div>
            <div className="kpi-metric-value" style={{ color: getFillRateColor(metrics.fillRate) }}>
              {metrics.fillRate}%
            </div>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="kpi-bar-details">
          <div className="kpi-detail-section">
            <h4>✅ Secured Revenue: ₪{metrics.securedRevenue}</h4>
            <p>{metrics.confirmedBookings} confirmed bookings</p>
            <p>Average: ₪{metrics.avgBookingValue} per booking</p>
          </div>

          <div className="kpi-detail-section">
            <h4>💰 Potential Revenue: ₪{metrics.potentialRevenue}</h4>
            <p>{metrics.totalCapacity - metrics.bookedCapacity} remaining spots available</p>
            <p>If all spots fill: ₪{metrics.securedRevenue + metrics.potentialRevenue} total</p>
          </div>

          <div className="kpi-detail-section">
            <h4>📅 Published Gaps: {metrics.publishedGaps} slots</h4>
            <p>Fill Rate: {metrics.fillRate}% ({metrics.bookedCapacity} of {metrics.totalCapacity} spots booked)</p>
            <p>Utilization: {metrics.utilization}%</p>
          </div>

          {metrics.bestService && (
            <div className="kpi-detail-section">
              <h4>🔥 Best performing service: {metrics.bestService}</h4>
              <p>{metrics.bestServiceBookings} bookings</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default KPIBar;
