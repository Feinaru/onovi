import React from 'react';
import MultiSelectFilter from './MultiSelectFilter';

/**
 * SearchFilters - Search v2 filters with taxonomy, date range, time buckets
 */
function SearchFilters({
  fields,
  professions,
  serviceTemplates,
  filters,
  setFilters,
  hasActiveFilters,
  onResetFilters,
  handleFieldsChange,
  handleProfessionsChange,
  handleServicesChange
}) {
  const handleTimeBucketToggle = (bucket) => {
    const newBuckets = filters.timeBuckets.includes(bucket)
      ? filters.timeBuckets.filter(b => b !== bucket)
      : [...filters.timeBuckets, bucket];
    setFilters({ ...filters, timeBuckets: newBuckets });
  };

  return (
    <div className="customer-search-section">
      <div className="search-card">
        {/* Taxonomy Filters */}
        <div style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          marginBottom: '16px'
        }}>
          <MultiSelectFilter
            label="תחום"
            options={fields}
            selectedIds={filters.fieldIds}
            onChange={handleFieldsChange}
          />

          <MultiSelectFilter
            label="מקצוע"
            options={professions}
            selectedIds={filters.professionIds}
            onChange={handleProfessionsChange}
            disabled={filters.fieldIds.length === 0}
          />

          <MultiSelectFilter
            label="שירות"
            options={serviceTemplates}
            selectedIds={filters.serviceTemplateIds}
            onChange={handleServicesChange}
            disabled={filters.professionIds.length === 0}
          />
        </div>

        {/* Date Range */}
        <div style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          marginBottom: '16px'
        }}>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#4b5563', display: 'block', marginBottom: '4px' }}>
              מתאריך
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={e => setFilters({ ...filters, dateFrom: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#4b5563', display: 'block', marginBottom: '4px' }}>
              עד תאריך
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={e => setFilters({ ...filters, dateTo: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        {/* Time Buckets */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#4b5563', display: 'block', marginBottom: '8px' }}>
            זמן ביום
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleTimeBucketToggle('morning')}
              style={{
                padding: '8px 16px',
                border: filters.timeBuckets.includes('morning') ? '2px solid #3b82f6' : '1px solid #d1d5db',
                borderRadius: '20px',
                background: filters.timeBuckets.includes('morning') ? '#eff6ff' : 'white',
                color: filters.timeBuckets.includes('morning') ? '#3b82f6' : '#6b7280',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: filters.timeBuckets.includes('morning') ? '600' : '400'
              }}
            >
              ☀️ בוקר
            </button>
            <button
              onClick={() => handleTimeBucketToggle('afternoon')}
              style={{
                padding: '8px 16px',
                border: filters.timeBuckets.includes('afternoon') ? '2px solid #3b82f6' : '1px solid #d1d5db',
                borderRadius: '20px',
                background: filters.timeBuckets.includes('afternoon') ? '#eff6ff' : 'white',
                color: filters.timeBuckets.includes('afternoon') ? '#3b82f6' : '#6b7280',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: filters.timeBuckets.includes('afternoon') ? '600' : '400'
              }}
            >
              🌤️ צהריים
            </button>
            <button
              onClick={() => handleTimeBucketToggle('evening')}
              style={{
                padding: '8px 16px',
                border: filters.timeBuckets.includes('evening') ? '2px solid #3b82f6' : '1px solid #d1d5db',
                borderRadius: '20px',
                background: filters.timeBuckets.includes('evening') ? '#eff6ff' : 'white',
                color: filters.timeBuckets.includes('evening') ? '#3b82f6' : '#6b7280',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: filters.timeBuckets.includes('evening') ? '600' : '400'
              }}
            >
              🌙 ערב
            </button>
            <button
              onClick={() => handleTimeBucketToggle('night')}
              style={{
                padding: '8px 16px',
                border: filters.timeBuckets.includes('night') ? '2px solid #3b82f6' : '1px solid #d1d5db',
                borderRadius: '20px',
                background: filters.timeBuckets.includes('night') ? '#eff6ff' : 'white',
                color: filters.timeBuckets.includes('night') ? '#3b82f6' : '#6b7280',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: filters.timeBuckets.includes('night') ? '600' : '400'
              }}
            >
              🌃 לילה
            </button>
          </div>
        </div>

        {/* Specific Time */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '8px' }}>
            <input
              type="checkbox"
              checked={filters.useSpecificTime}
              onChange={e => setFilters({ ...filters, useSpecificTime: e.target.checked })}
              style={{ marginLeft: '8px' }}
            />
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#4b5563' }}>
              זמן ספציפי
            </span>
          </label>

          {filters.useSpecificTime && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                  משעה
                </label>
                <input
                  type="time"
                  value={filters.timeFrom}
                  onChange={e => setFilters({ ...filters, timeFrom: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '13px'
                  }}
                />
              </div>
              <span style={{ color: '#9ca3af', marginTop: '20px' }}>—</span>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                  עד שעה
                </label>
                <input
                  type="time"
                  value={filters.timeTo}
                  onChange={e => setFilters({ ...filters, timeTo: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '13px'
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Sort */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#4b5563', display: 'block', marginBottom: '4px' }}>
            מיון לפי
          </label>
          <select
            value={filters.sort}
            onChange={e => setFilters({ ...filters, sort: e.target.value })}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              background: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="recommended">מומלץ</option>
            <option value="soonest">זמן פנוי הקרוב ביותר</option>
            <option value="price-asc">מחיר: נמוך לגבוה</option>
            <option value="price-desc">מחיר: גבוה לנמוך</option>
          </select>
        </div>

        {/* Reset Button */}
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              background: 'white',
              color: '#6b7280',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            נקה פילטרים
          </button>
        )}
      </div>
    </div>
  );
}

export default SearchFilters;
