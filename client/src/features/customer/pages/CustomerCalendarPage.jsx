import React from 'react';
import { useMyBookings } from '../hooks/useMyBookings';
import CustomerCalendarView from './CustomerCalendarView';
import LoadingState from '../../../shared/ui/LoadingState';

/**
 * CustomerCalendarPage - Wrapper page for customer calendar view
 * Fetches bookings and provides loading/error states
 */
export default function CustomerCalendarPage({ setView }) {
  const {
    bookings,
    loading,
    error,
    refetch
  } = useMyBookings();

  return (
    <div style={{ padding: 'var(--space-4)', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <h1 style={{
          fontSize: 'var(--text-3xl)',
          fontWeight: 'var(--font-bold)',
          marginBottom: 'var(--space-2)'
        }}>
          יומן
        </h1>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: 'var(--text-base)'
        }}>
          כל התורים שלך בתצוגת יומן חודשית
        </p>
      </div>

      {/* Loading state */}
      {loading && <LoadingState title="טוען יומן..." />}

      {/* Error state */}
      {error && !loading && (
        <div style={{
          textAlign: 'center',
          padding: 'var(--space-8)'
        }}>
          <div style={{
            fontSize: 'var(--text-4xl)',
            marginBottom: 'var(--space-2)'
          }}>
            ⚠️
          </div>
          <div style={{
            color: 'var(--danger-color)',
            marginBottom: 'var(--space-4)',
            fontSize: 'var(--text-lg)'
          }}>
            {error}
          </div>
          <button
            onClick={refetch}
            className="btn-primary"
          >
            נסה שוב
          </button>
        </div>
      )}

      {/* Calendar View */}
      {!loading && !error && (
        <CustomerCalendarView
          bookings={bookings}
          setView={setView}
        />
      )}
    </div>
  );
}
