import { useState, useEffect } from 'react';
import { api } from '../../../api';

/**
 * ProviderCustomersPage - Customer list aggregated from bookings
 */
export default function ProviderCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [searchQuery, customers]);

  async function loadCustomers() {
    try {
      setLoading(true);
      setError('');

      const response = await api('/api/service-provider/customers');

      if (response.success && Array.isArray(response.data)) {
        setCustomers(response.data);
      } else {
        setError(response.error || 'שגיאה בטעינת לקוחות');
      }
    } catch (err) {
      setError(err.message || 'שגיאה בטעינת לקוחות');
    } finally {
      setLoading(false);
    }
  }

  function filterCustomers() {
    if (!searchQuery.trim()) {
      setFilteredCustomers(customers);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = customers.filter(customer => {
      const name = (customer.customerName || '').toLowerCase();
      const phone = (customer.customerPhone || '').toLowerCase();
      return name.includes(query) || phone.includes(query);
    });

    setFilteredCustomers(filtered);
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        padding: 'var(--space-8)'
      }}>
        <div style={{
          fontSize: '64px',
          marginBottom: 'var(--space-4)',
          animation: 'pulse 1.5s ease-in-out infinite'
        }}>
          ⏳
        </div>
        <div style={{
          fontSize: 'var(--text-lg)',
          color: 'var(--text-secondary)',
          fontWeight: 'var(--font-medium)'
        }}>
          טוען לקוחות...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: 'var(--space-4)',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <div style={{
          padding: 'var(--space-8)',
          textAlign: 'center',
          background: 'var(--danger-50)',
          borderRadius: 'var(--radius-lg)',
          border: '2px solid var(--danger-200)'
        }}>
          <div style={{
            fontSize: '64px',
            marginBottom: 'var(--space-4)'
          }}>
            ⚠️
          </div>
          <h3 style={{
            fontSize: 'var(--text-xl)',
            fontWeight: 'var(--font-semibold)',
            color: 'var(--danger-700)',
            marginBottom: 'var(--space-3)'
          }}>
            שגיאה בטעינת הנתונים
          </h3>
          <div style={{
            fontSize: 'var(--text-base)',
            color: 'var(--danger-600)',
            marginBottom: 'var(--space-6)'
          }}>
            {error}
          </div>
          <button onClick={loadCustomers} className="btn-primary">
            🔄 נסה שוב
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: 'var(--space-4)',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      {/* Modern Page Header */}
      <div style={{
        marginBottom: 'var(--space-6)',
        paddingBottom: 'var(--space-4)',
        borderBottom: '2px solid var(--border-color)'
      }}>
        <h1 style={{
          fontSize: 'var(--text-3xl)',
          fontWeight: 'var(--font-bold)',
          marginBottom: 'var(--space-2)',
          color: 'var(--text-primary)'
        }}>
          👥 לקוחות
        </h1>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: 'var(--text-base)',
          lineHeight: '1.6'
        }}>
          לקוחות שהזמינו תורים אצלך - מידע מרוכז ונגיש
        </p>
      </div>

      {/* Summary Stats Cards */}
      {customers.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)'
        }}>
          <div style={{
            padding: 'var(--space-4)',
            background: 'linear-gradient(135deg, var(--primary-50) 0%, var(--primary-100) 100%)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--primary-200)'
          }}>
            <div style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--primary-700)',
              fontWeight: 'var(--font-semibold)',
              marginBottom: 'var(--space-2)'
            }}>
              סה"כ לקוחות
            </div>
            <div style={{
              fontSize: 'var(--text-3xl)',
              fontWeight: 'var(--font-bold)',
              color: 'var(--primary-700)'
            }}>
              {customers.length}
            </div>
          </div>

          <div style={{
            padding: 'var(--space-4)',
            background: 'linear-gradient(135deg, var(--success-50) 0%, var(--success-100) 100%)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--success-200)'
          }}>
            <div style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--success-700)',
              fontWeight: 'var(--font-semibold)',
              marginBottom: 'var(--space-2)'
            }}>
              סה"כ תורים
            </div>
            <div style={{
              fontSize: 'var(--text-3xl)',
              fontWeight: 'var(--font-bold)',
              color: 'var(--success-700)'
            }}>
              {customers.reduce((sum, c) => sum + (c.totalBookings || 0), 0)}
            </div>
          </div>
        </div>
      )}

      {/* Refined Search Input */}
      <div style={{
        marginBottom: 'var(--space-6)'
      }}>
        <div style={{
          position: 'relative',
          maxWidth: '500px'
        }}>
          <div style={{
            position: 'absolute',
            left: 'var(--space-3)',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 'var(--text-xl)',
            color: 'var(--text-secondary)',
            pointerEvents: 'none'
          }}>
            🔍
          </div>
          <input
            type="text"
            placeholder="חיפוש לקוח לפי שם או טלפון..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: 'var(--space-3) var(--space-3) var(--space-3) var(--space-10)',
              fontSize: 'var(--text-base)',
              border: '2px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'white',
              transition: 'all 0.2s',
              outline: 'none'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--primary-color)';
              e.target.style.boxShadow = '0 0 0 3px var(--primary-50)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border-color)';
              e.target.style.boxShadow = 'none';
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: 'var(--space-3)',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                fontSize: 'var(--text-lg)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: 'var(--space-1)',
                borderRadius: 'var(--radius-md)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'var(--gray-100)';
                e.target.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'none';
                e.target.style.color = 'var(--text-secondary)';
              }}
            >
              ✕
            </button>
          )}
        </div>
        {searchQuery && (
          <div style={{
            marginTop: 'var(--space-2)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)'
          }}>
            נמצאו {filteredCustomers.length} תוצאות מתוך {customers.length} לקוחות
          </div>
        )}
      </div>

      {/* Enhanced Empty State */}
      {filteredCustomers.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: 'var(--space-12)',
          background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--gray-50) 100%)',
          borderRadius: 'var(--radius-xl)',
          border: '2px dashed var(--border-color)'
        }}>
          <div style={{
            fontSize: '80px',
            marginBottom: 'var(--space-4)',
            opacity: '0.8'
          }}>
            {searchQuery ? '🔍' : '👥'}
          </div>
          <h3 style={{
            fontSize: 'var(--text-2xl)',
            fontWeight: 'var(--font-bold)',
            marginBottom: 'var(--space-3)',
            color: 'var(--text-primary)'
          }}>
            {searchQuery ? 'לא נמצאו תוצאות' : 'אין עדיין לקוחות'}
          </h3>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: 'var(--text-base)',
            maxWidth: '400px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            {searchQuery
              ? 'נסה לשנות את מילות החיפוש או לנקות את שדה החיפוש'
              : 'לקוחות שהזמינו תורים יופיעו כאן אוטומטית'}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="btn-secondary"
              style={{
                marginTop: 'var(--space-4)'
              }}
            >
              נקה חיפוש
            </button>
          )}
        </div>
      )}

      {/* Polished Customers Table */}
      {filteredCustomers.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              minWidth: '700px',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{
                  background: 'linear-gradient(to bottom, var(--gray-50), var(--gray-100))',
                  borderBottom: '2px solid var(--border-color)'
                }}>
                  <th style={{
                    padding: 'var(--space-4)',
                    textAlign: 'right',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-bold)',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    שם לקוח
                  </th>
                  <th style={{
                    padding: 'var(--space-4)',
                    textAlign: 'right',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-bold)',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    טלפון
                  </th>
                  <th style={{
                    padding: 'var(--space-4)',
                    textAlign: 'right',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-bold)',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    אימייל
                  </th>
                  <th style={{
                    padding: 'var(--space-4)',
                    textAlign: 'right',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-bold)',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    תור אחרון
                  </th>
                  <th style={{
                    padding: 'var(--space-4)',
                    textAlign: 'center',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-bold)',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    סך תורים
                  </th>
                  <th style={{
                    padding: 'var(--space-4)',
                    textAlign: 'center',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-bold)',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    בוטלו
                  </th>
                  <th style={{
                    padding: 'var(--space-4)',
                    textAlign: 'center',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-bold)',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    לא הגיעו
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer, index) => (
                  <tr
                    key={customer.customerId || `legacy-${index}`}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'background-color 0.15s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--gray-50)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <td style={{
                      padding: 'var(--space-4)',
                      fontWeight: 'var(--font-semibold)',
                      color: 'var(--text-primary)',
                      fontSize: 'var(--text-base)'
                    }}>
                      {customer.customerName || 'לקוח לא זמין'}
                    </td>
                    <td style={{
                      padding: 'var(--space-4)',
                      fontSize: 'var(--text-sm)'
                    }}>
                      {customer.customerPhone && customer.customerPhone !== 'טלפון לא זמין' ? (
                        <a
                          href={`tel:${customer.customerPhone}`}
                          style={{
                            color: 'var(--primary-color)',
                            textDecoration: 'none',
                            fontWeight: 'var(--font-medium)',
                            transition: 'color 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.color = 'var(--primary-600)';
                            e.target.style.textDecoration = 'underline';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.color = 'var(--primary-color)';
                            e.target.style.textDecoration = 'none';
                          }}
                        >
                          📞 {customer.customerPhone}
                        </a>
                      ) : (
                        <span style={{
                          color: 'var(--text-secondary)',
                          fontSize: 'var(--text-sm)'
                        }}>
                          טלפון לא זמין
                        </span>
                      )}
                    </td>
                    <td style={{
                      padding: 'var(--space-4)',
                      fontSize: 'var(--text-sm)'
                    }}>
                      {customer.email ? (
                        <a
                          href={`mailto:${customer.email}`}
                          style={{
                            color: 'var(--primary-color)',
                            textDecoration: 'none',
                            fontWeight: 'var(--font-medium)',
                            transition: 'color 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.color = 'var(--primary-600)';
                            e.target.style.textDecoration = 'underline';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.color = 'var(--primary-color)';
                            e.target.style.textDecoration = 'none';
                          }}
                        >
                          ✉️ {customer.email}
                        </a>
                      ) : (
                        <span style={{
                          color: 'var(--text-secondary)',
                          fontSize: 'var(--text-sm)'
                        }}>
                          אימייל לא זמין
                        </span>
                      )}
                    </td>
                    <td style={{
                      padding: 'var(--space-4)',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--text-secondary)'
                    }}>
                      {customer.lastBookingDate ? (
                        <span style={{ fontWeight: 'var(--font-medium)', color: 'var(--text-primary)' }}>
                          📅 {customer.lastBookingDate}
                        </span>
                      ) : (
                        'אין תורים'
                      )}
                    </td>
                    <td style={{
                      padding: 'var(--space-4)',
                      textAlign: 'center'
                    }}>
                      <span style={{
                        display: 'inline-block',
                        padding: 'var(--space-1) var(--space-3)',
                        background: 'linear-gradient(135deg, var(--primary-50), var(--primary-100))',
                        color: 'var(--primary-700)',
                        borderRadius: 'var(--radius-full)',
                        fontWeight: 'var(--font-bold)',
                        fontSize: 'var(--text-sm)',
                        minWidth: '32px',
                        border: '1px solid var(--primary-200)'
                      }}>
                        {customer.totalBookings}
                      </span>
                    </td>
                    <td style={{
                      padding: 'var(--space-4)',
                      textAlign: 'center',
                      fontSize: 'var(--text-base)',
                      fontWeight: 'var(--font-semibold)'
                    }}>
                      {customer.cancelledCount > 0 ? (
                        <span style={{
                          color: 'var(--warning-600)',
                          background: 'var(--warning-50)',
                          padding: 'var(--space-1) var(--space-2)',
                          borderRadius: 'var(--radius-md)',
                          fontSize: 'var(--text-sm)'
                        }}>
                          {customer.cancelledCount}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)' }}>—</span>
                      )}
                    </td>
                    <td style={{
                      padding: 'var(--space-4)',
                      textAlign: 'center',
                      fontSize: 'var(--text-base)',
                      fontWeight: 'var(--font-semibold)'
                    }}>
                      {customer.noShowCount > 0 ? (
                        <span style={{
                          color: 'var(--danger-600)',
                          background: 'var(--danger-50)',
                          padding: 'var(--space-1) var(--space-2)',
                          borderRadius: 'var(--radius-md)',
                          fontSize: 'var(--text-sm)'
                        }}>
                          {customer.noShowCount}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Summary */}
          <div style={{
            padding: 'var(--space-4)',
            background: 'var(--gray-50)',
            borderTop: '1px solid var(--border-color)',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-2)'
          }}>
            <span style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)'
            }}>
              מציג
            </span>
            <span style={{
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-bold)',
              color: 'var(--primary-600)'
            }}>
              {filteredCustomers.length}
            </span>
            <span style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)'
            }}>
              {searchQuery ? `מתוך ${customers.length} לקוחות` : 'לקוחות'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
