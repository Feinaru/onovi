import React from 'react';
import './ReadinessIndicator.css';

/**
 * ReadinessIndicator - Visual readiness score with checklist
 */
function ReadinessIndicator({ readiness }) {
  const { level, label, percentage, completedCount, totalChecks, checks } = readiness;

  const levelConfig = {
    green: { icon: '🟢', color: '#10b981' },
    yellow: { icon: '🟡', color: '#eab308' },
    orange: { icon: '🟠', color: '#f59e0b' },
    red: { icon: '🔴', color: '#dc2626' }
  };

  const config = levelConfig[level] || levelConfig.red;

  return (
    <div className="readiness-indicator">
      <div className="readiness-header">
        <div className="readiness-level">
          <span className="readiness-icon">{config.icon}</span>
          <span className="readiness-label" style={{ color: config.color }}>
            {label}
          </span>
        </div>
        <div className="readiness-percentage">
          {percentage}%
        </div>
      </div>

      <div className="readiness-progress-bar">
        <div
          className="readiness-progress-fill"
          style={{ width: `${percentage}%`, backgroundColor: config.color }}
        />
      </div>

      <div className="readiness-summary">
        {completedCount} מתוך {totalChecks} בדיקות הושלמו
      </div>

      {checks && checks.length > 0 && (
        <div className="readiness-checks">
          {checks.map((check, index) => (
            <div key={index} className="readiness-check-item">
              <span className={`readiness-check-icon ${check.completed ? 'completed' : 'incomplete'}`}>
                {check.completed ? '✓' : '○'}
              </span>
              <span className="readiness-check-label">
                {check.label}
                {check.required && <span className="readiness-check-required"> *</span>}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReadinessIndicator;
