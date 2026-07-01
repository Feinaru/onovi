import React from 'react';
import './UserStats.css';

/**
 * UserStats - Summary cards showing key metrics
 */
function UserStats({ stats }) {
  const cards = [
    {
      label: 'סה"כ משתמשים',
      value: stats.total,
      icon: '👥',
      color: 'blue'
    },
    {
      label: 'לקוחות',
      value: stats.customers,
      icon: '👤',
      color: 'green'
    },
    {
      label: 'בעלי עסקים',
      value: stats.businesses,
      icon: '🏪',
      color: 'purple'
    },
    {
      label: 'מושעים',
      value: stats.suspended,
      icon: '⏸️',
      color: 'orange'
    },
    {
      label: 'ממתינים לאישור',
      value: stats.pending,
      icon: '⏳',
      color: 'yellow'
    }
  ];

  return (
    <div className="user-stats">
      {cards.map(card => (
        <div key={card.label} className={`stat-card stat-card--${card.color}`}>
          <div className="stat-card-icon">{card.icon}</div>
          <div className="stat-card-content">
            <div className="stat-card-value">{card.value}</div>
            <div className="stat-card-label">{card.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default UserStats;
