import React from 'react';
import AddressSearchFilter from '../../../components/AddressSearchFilter';

/**
 * SearchFilters - Main and advanced search filters
 */
function SearchFilters({ categories, filters, setFilters, onSearch, hasActiveFilters, onResetFilters }) {
  return (
    <div className="customer-search-section">
      <div className="search-card">
        {/* Main Filters */}
        <div className="search-main-filters">
          <div className="form-group-inline">
            <label className="form-label-inline">קטגוריה</label>
            <select
              value={filters.categoryId}
              onChange={e => setFilters({ ...filters, categoryId: e.target.value })}
              className="search-input"
            >
              <option value="">כל הקטגוריות</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <AddressSearchFilter
            value={filters.searchLocation}
            onChange={(addressData) => {
              setFilters({
                ...filters,
                city: addressData.city || '',
                street: addressData.street || '',
                houseNumber: addressData.houseNumber || '',
                searchLocation: addressData
              });
            }}
          />

          <div className="form-group-inline">
            <label className="form-label-inline">תאריך</label>
            <input
              type="date"
              value={filters.date}
              onChange={e => setFilters({ ...filters, date: e.target.value })}
              className="search-input"
            />
          </div>

          <button className="btn-primary btn-search" onClick={onSearch}>
            <span>🔍</span>
            <span>חפש</span>
          </button>
        </div>

        {/* Advanced Filters */}
        <div className="search-advanced-filters">
          <div className="filter-group">
            <label className="filter-label">זמן ביום</label>
            <div className="filter-chips">
              <button
                className={`filter-chip ${filters.timeOfDay === 'בוקר' ? 'active' : ''}`}
                onClick={() => setFilters({ ...filters, timeOfDay: filters.timeOfDay === 'בוקר' ? '' : 'בוקר' })}
              >
                ☀️ בוקר
              </button>
              <button
                className={`filter-chip ${filters.timeOfDay === 'צהריים' ? 'active' : ''}`}
                onClick={() => setFilters({ ...filters, timeOfDay: filters.timeOfDay === 'צהריים' ? '' : 'צהריים' })}
              >
                🌤️ צהריים
              </button>
              <button
                className={`filter-chip ${filters.timeOfDay === 'ערב' ? 'active' : ''}`}
                onClick={() => setFilters({ ...filters, timeOfDay: filters.timeOfDay === 'ערב' ? '' : 'ערב' })}
              >
                🌙 ערב
              </button>
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">טווח מחירים</label>
            <div className="filter-price-range">
              <input
                type="number"
                placeholder="מינימום"
                value={filters.minPrice}
                onChange={e => setFilters({ ...filters, minPrice: e.target.value })}
                className="price-input"
              />
              <span className="price-separator">-</span>
              <input
                type="number"
                placeholder="מקסימום"
                value={filters.maxPrice}
                onChange={e => setFilters({ ...filters, maxPrice: e.target.value })}
                className="price-input"
              />
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-toggle">
              <input
                type="checkbox"
                checked={filters.onlyDiscounted}
                onChange={e => setFilters({ ...filters, onlyDiscounted: e.target.checked })}
              />
              <span className="toggle-text">רק תורים מוזלים 🔥</span>
            </label>
          </div>

          {hasActiveFilters && (
            <button className="btn-text" onClick={onResetFilters}>
              נקה פילטרים
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default SearchFilters;
