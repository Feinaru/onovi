import React, { useState } from 'react';

/**
 * useTableSort - lightweight client-side sorting for catalog tables.
 * `accessors` maps a sort key to a function returning the comparable value.
 * Numbers sort numerically; everything else sorts by Hebrew-aware localeCompare.
 */
export function useTableSort(defaultKey, accessors) {
  const [sort, setSort] = useState({ key: defaultKey, dir: 'asc' });

  function toggle(key) {
    setSort((s) =>
      s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
    );
  }

  function sortRows(rows) {
    const accessor = accessors[sort.key];
    if (!accessor) return rows;
    const sorted = [...rows].sort((a, b) => {
      const va = accessor(a);
      const vb = accessor(b);
      if (typeof va === 'number' && typeof vb === 'number') return va - vb;
      return String(va ?? '').localeCompare(String(vb ?? ''), 'he');
    });
    return sort.dir === 'asc' ? sorted : sorted.reverse();
  }

  return { sort, toggle, sortRows };
}

/**
 * SortHeader - a clickable <th> showing the active sort direction.
 */
export function SortHeader({ label, sortKey, sort, onToggle }) {
  const active = sort.key === sortKey;
  const arrow = active ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : '';
  return (
    <th
      style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
      onClick={() => onToggle(sortKey)}
      aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      {label}{arrow}
    </th>
  );
}

/**
 * Status pill for catalog items. Reuses the existing `badge` classes so the
 * catalog matches the rest of the admin panel (no new badge system).
 */
export function StatusPill({ status }) {
  if (status === 'ARCHIVED') {
    return <span className="badge badge-gray">בארכיון</span>;
  }
  return <span className="badge badge-success">פעיל</span>;
}

/** Format an optional price (whole shekels) or a dash. */
export function formatPrice(price) {
  if (price === null || price === undefined || price === '') return '—';
  return `₪${price}`;
}

/** Format duration in minutes or a dash. */
export function formatDuration(minutes) {
  if (!minutes) return '—';
  return `${minutes} דקות`;
}
