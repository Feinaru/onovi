import React from 'react';
import { useMyBookings } from '../hooks/useMyBookings';
import MyBookingCard from '../components/MyBookingCard';

/**
 * MyBookingsPage - Customer's booking management page
 */
export default function MyBookingsPage({ setView }) {
  const {
    filteredBookings,
    activeFilter,
    setActiveFilter,
    counts,
    loading,
    error,
    refetch,
    cancelBooking,
    canCancelBooking
  } = useMyBookings();

  const [showCancelConfirm, setShowCancelConfirm] = React.useState(false);
  const [bookingToCancel, setBookingToCancel] = React.useState(null);
  const [cancelMessage, setCancelMessage] = React.useState('');
  const [cancelError, setCancelError] = React.useState(false);

  /**
   * Handle cancel button click - show confirmation
   */
  const handleCancelClick = (booking) => {
    setBookingToCancel(booking);
    setShowCancelConfirm(true);
    setCancelMessage('');
    setCancelError(false);
  };

  /**
   * Handle cancel confirmation - actually cancel the booking
   */
  const handleCancelConfirm = async () => {
    if (!bookingToCancel) return;

    const result = await cancelBooking(bookingToCancel.id);

    if (result.success) {
      setCancelMessage(result.message);
      setCancelError(false);
      // Auto-close after 2 seconds
      setTimeout(() => {
        setShowCancelConfirm(false);
        setBookingToCancel(null);
        setCancelMessage('');
      }, 2000);
    } else {
      setCancelMessage(result.message);
      setCancelError(true);
    }
  };

  /**
   * Handle cancel dialog close
   */
  const handleCancelClose = () => {
    setShowCancelConfirm(false);
    setBookingToCancel(null);
    setCancelMessage('');
    setCancelError(false);
  };

  /**
   * Filter tabs configuration
   */
  const tabs = [
    { id: 'upcoming', label: 'קרובים', count: counts.upcoming },
    { id: 'past', label: 'עברו', count: counts.past },
    { id: 'cancelled', label: 'בוטלו', count: counts.cancelled }
  ];

  /**
   * Empty state messages
   */
  const emptyStates = {
    upcoming: {
      icon: '📅',
      title: 'אין לך תורים קרובים',
      description: 'כשתזמין תור חדש, הוא יופיע כאן'
    },
    past: {
      icon: '📋',
      title: 'אין לך תורים קודמים',
      description: 'התורים שעברו יופיעו כאן'
    },
    cancelled: {
      icon: '🚫',
      title: 'אין לך תורים שבוטלו',
      description: 'תורים מבוטלים יופיעו כאן'
    }
  };

  return (
    <div style={{ padding: 'var(--space-4)', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <h1 style={{
          fontSize: 'var(--text-3xl)',
          fontWeight: 'var(--font-bold)',
          marginBottom: 'var(--space-2)'
        }}>
          התורים שלי
        </h1>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: 'var(--text-base)'
        }}>
          כאן תוכל לראות את כל התורים שלך - קרובים, עברו ומבוטלים
        </p>
      </div>

      {/* Back to search button */}
      {setView && (
        <button
          onClick={() => setView('customer')}
          className="btn-secondary"
          style={{ marginBottom: 'var(--space-4)' }}
        >
          ← חזרה לחיפוש תורים
        </button>
      )}

      {/* Filter tabs */}
      <div style={{
        display: 'flex',
        gap: 'var(--space-2)',
        marginBottom: 'var(--space-4)',
        borderBottom: '2px solid var(--border-color)',
        flexWrap: 'wrap'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            style={{
              padding: 'var(--space-3) var(--space-4)',
              background: activeFilter === tab.id ? 'var(--primary-color)' : 'transparent',
              color: activeFilter === tab.id ? 'white' : 'var(--text-primary)',
              border: 'none',
              borderBottom: activeFilter === tab.id ? '2px solid var(--primary-color)' : '2px solid transparent',
              borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
              cursor: 'pointer',
              fontSize: 'var(--text-base)',
              fontWeight: activeFilter === tab.id ? 'var(--font-semibold)' : 'var(--font-medium)',
              transition: 'all 0.2s',
              marginBottom: '-2px',
              minWidth: '100px'
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span style={{
                marginRight: 'var(--space-2)',
                padding: '2px 8px',
                background: activeFilter === tab.id ? 'rgba(255,255,255,0.2)' : 'var(--bg-secondary)',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-bold)'
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{
          textAlign: 'center',
          padding: 'var(--space-8)',
          color: 'var(--text-secondary)'
        }}>
          <div style={{
            fontSize: 'var(--text-4xl)',
            marginBottom: 'var(--space-2)'
          }}>
            ⏳
          </div>
          <div>טוען תורים...</div>
        </div>
      )}

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

      {/* Bookings list */}
      {!loading && !error && (
        <>
          {filteredBookings.length > 0 ? (
            <div>
              {filteredBookings.map(booking => (
                <MyBookingCard
                  key={booking.id}
                  booking={booking}
                  canCancel={canCancelBooking(booking)}
                  onCancel={handleCancelClick}
                  setView={setView}
                />
              ))}
            </div>
          ) : (
            /* Empty state */
            <div style={{
              textAlign: 'center',
              padding: 'var(--space-8)',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-lg)',
              marginTop: 'var(--space-4)'
            }}>
              <div style={{
                fontSize: '4rem',
                marginBottom: 'var(--space-3)'
              }}>
                {emptyStates[activeFilter].icon}
              </div>
              <h3 style={{
                fontSize: 'var(--text-xl)',
                fontWeight: 'var(--font-semibold)',
                marginBottom: 'var(--space-2)'
              }}>
                {emptyStates[activeFilter].title}
              </h3>
              <p style={{
                color: 'var(--text-secondary)',
                marginBottom: 'var(--space-4)'
              }}>
                {emptyStates[activeFilter].description}
              </p>
              {activeFilter === 'upcoming' && setView && (
                <button
                  onClick={() => setView('customer')}
                  className="btn-primary"
                >
                  🔍 חפש תורים זמינים
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Cancel confirmation modal */}
      {showCancelConfirm && bookingToCancel && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 'var(--space-4)'
          }}
          onClick={handleCancelClose}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{
              fontSize: 'var(--text-xl)',
              fontWeight: 'var(--font-semibold)',
              marginBottom: 'var(--space-4)'
            }}>
              ביטול תור
            </h3>

            <div style={{
              marginBottom: 'var(--space-4)',
              color: 'var(--text-secondary)'
            }}>
              <p style={{ marginBottom: 'var(--space-2)' }}>
                האם אתה בטוח שברצונך לבטל את התור?
              </p>
              <div style={{
                padding: 'var(--space-3)',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-sm)'
              }}>
                <div><strong>שירות:</strong> {bookingToCancel.businessService?.serviceTemplate?.name || bookingToCancel.service?.name || 'שירות לא זמין'}</div>
                <div><strong>עסק:</strong> {bookingToCancel.business?.name || 'עסק לא זמין'}</div>
                <div><strong>תאריך:</strong> {bookingToCancel.slot?.date || 'לא זמין'}</div>
                <div><strong>שעה:</strong> {bookingToCancel.startTime || 'לא זמין'}</div>
              </div>
            </div>

            {cancelMessage && (
              <div style={{
                padding: 'var(--space-3)',
                marginBottom: 'var(--space-4)',
                borderRadius: 'var(--radius-md)',
                background: cancelError ? '#fee' : '#efe',
                color: cancelError ? '#c00' : '#060',
                textAlign: 'center'
              }}>
                {cancelMessage}
              </div>
            )}

            <div style={{
              display: 'flex',
              gap: 'var(--space-2)',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={handleCancelClose}
                className="btn-secondary"
                disabled={cancelMessage && !cancelError}
              >
                סגור
              </button>
              {!cancelMessage && (
                <button
                  onClick={handleCancelConfirm}
                  className="btn-primary"
                  style={{
                    background: 'var(--danger-color)',
                    borderColor: 'var(--danger-color)'
                  }}
                >
                  כן, בטל תור
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
