import React from 'react';
import './UserFilters.css';

/**
 * UserFilters - Search and filter controls
 */
function UserFilters({ filters, tags, onChange }) {
  return (
    <div className="user-filters">
      <div className="user-filters-row">
        <input
          type="text"
          placeholder="חיפוש לפי שם, טלפון או אימייל..."
          className="user-filters-search"
          value={filters.search}
          onChange={e => onChange('search', e.target.value)}
        />
      </div>

      <div className="user-filters-row">
        <select
          className="user-filters-select"
          value={filters.role}
          onChange={e => onChange('role', e.target.value)}
        >
          <option value="">כל סוגי המשתמשים</option>
          <option value="CUSTOMER">לקוח</option>
          <option value="BUSINESS">בעל עסק</option>
          <option value="ADMIN">מנהל</option>
        </select>

        <select
          className="user-filters-select"
          value={filters.status}
          onChange={e => onChange('status', e.target.value)}
        >
          <option value="">כל הסטטוסים</option>
          <option value="ACTIVE">פעיל</option>
          <option value="PENDING">ממתין לאישור</option>
          <option value="HIDDEN">מוסתר</option>
          <option value="SUSPENDED">מושעה</option>
          <option value="BLOCKED">חסום</option>
        </select>

        <select
          className="user-filters-select"
          value={filters.sortBy}
          onChange={e => onChange('sortBy', e.target.value)}
        >
          <option value="createdAt">תאריך הרשמה</option>
          <option value="lastLoginAt">כניסה אחרונה</option>
          <option value="fullName">שם</option>
        </select>

        <select
          className="user-filters-select"
          value={filters.order}
          onChange={e => onChange('order', e.target.value)}
        >
          <option value="desc">יורד</option>
          <option value="asc">עולה</option>
        </select>
      </div>

      {tags.length > 0 && (
        <div className="user-filters-tags">
          <span className="user-filters-tags-label">סינון לפי תגיות:</span>
          {tags.map(tag => (
            <label key={tag.id} className="user-filters-tag-checkbox">
              <input
                type="checkbox"
                checked={filters.tags.includes(tag.id)}
                onChange={e => {
                  const newTags = e.target.checked
                    ? [...filters.tags, tag.id]
                    : filters.tags.filter(t => t !== tag.id);
                  onChange('tags', newTags);
                }}
              />
              <span
                className="user-filters-tag-label"
                style={{ borderColor: tag.color }}
              >
                {tag.name}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default UserFilters;
