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
      <div style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)' }}>⏳</div>
        <div style={{ fontSize: 'var(--text-lg)', color: 'var(--text-secondary)' }}>טוען לקוחות...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 'var(--space-4)' }}>
        <div style={{
          padding: 'var(--space-6)',
          textAlign: 'center',
          background: 'var(--danger-50)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--danger-200)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)' }}>⚠️</div>
          <div style={{ fontSize: 'var(--text-lg)', color: 'var(--danger-700)', marginBottom: 'var(--space-4)' }}>
            {error}
          </div>
          <button onClick={loadCustomers} className="btn-primary">
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-4)' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <h1 style={{
          fontSize: 'var(--text-3xl)',
          fontWeight: 'var(--font-bold)',
          marginBottom: 'var(--space-2)'
        }}>
          לקוחות
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)' }}>
          לקוחות שהזמינו תורים אצלך
        </p>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <input
          type="text"
          placeholder="חיפוש לפי שם או טלפון"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="form-input"
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: 'var(--space-3)',
            fontSize: 'var(--text-base)'
          }}
        />
      </div>

      {/* Empty State */}
      {filteredCustomers.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: 'var(--space-12)',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: 'var(--space-4)' }}>👥</div>
          <h3 style={{
            fontSize: 'var(--text-xl)',
            fontWeight: 'var(--font-semibold)',
            marginBottom: 'var(--space-2)'
          }}>
            {searchQuery ? 'לא נמצאו לקוחות' : 'אין לקוחות להצגה'}
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            {searchQuery ? 'נסה לשנות את חיפוש' : 'לקוחות שהזמינו תורים יופיעו כאן'}
          </p>
        </div>
      )}

      {/* Customers Table */}
      {filteredCustomers.length > 0 && (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', minWidth: '600px' }}>
            <thead>
              <tr>
                <th>שם</th>
                <th>טלפון</th>
                <th>אימייל</th>
                <th>תור אחרון</th>
                <th>סך תורים</th>
                <th>בוטלו</th>
                <th>לא הגיעו</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer, index) => (
                <tr key={customer.customerId || `legacy-${index}`}>
                  <td style={{ fontWeight: 'var(--font-semibold)' }}>
                    {customer.customerName || 'לקוח לא זמין'}
                  </td>
                  <td>
                    {customer.customerPhone && customer.customerPhone !== 'טלפון לא זמין' ? (
                      <a href={`tel:${customer.customerPhone}`}>{customer.customerPhone}</a>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)' }}>טלפון לא זמין</span>
                    )}
                  </td>
                  <td>
                    {customer.email ? (
                      <a href={`mailto:${customer.email}`}>{customer.email}</a>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)' }}>אימייל לא זמין</span>
                    )}
                  </td>
                  <td>
                    {customer.lastBookingDate || (
                      <span style={{ color: 'var(--text-secondary)' }}>אין תורים</span>
                    )}
                  </td>
                  <td>
                    <span style={{
                      padding: 'var(--space-1) var(--space-2)',
                      background: 'var(--primary-50)',
                      color: 'var(--primary-700)',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: 'var(--font-semibold)'
                    }}>
                      {customer.totalBookings}
                    </span>
                  </td>
                  <td>
                    {customer.cancelledCount > 0 ? (
                      <span style={{ color: 'var(--warning-color)' }}>{customer.cancelledCount}</span>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)' }}>0</span>
                    )}
                  </td>
                  <td>
                    {customer.noShowCount > 0 ? (
                      <span style={{ color: 'var(--danger-color)' }}>{customer.noShowCount}</span>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)' }}>0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{
            padding: 'var(--space-4)',
            borderTop: '1px solid var(--border-color)',
            textAlign: 'center',
            color: 'var(--text-secondary)',
            fontSize: 'var(--text-sm)'
          }}>
            סה"כ {filteredCustomers.length} לקוחות
            {searchQuery && ` (מתוך ${customers.length})`}
          </div>
        </div>
      )}
    </div>
  );
}
