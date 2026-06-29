import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import BusinessAddressForm from '../components/BusinessAddressForm';

export default function BusinessPage({ user, setView }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [businesses, setBusinesses] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [businessForm, setBusinessForm] = useState({
    name: '',
    description: '',
    phone: '',
    identifierType: 'COMPANY_NUMBER',
    identifierValue: '',
    cityCode: null,
    cityNameHebrew: '',
    streetCode: null,
    streetNameHebrew: '',
    houseNumber: '',
    formattedAddress: '',
    latitude: null,
    longitude: null,
    categoryId: 1,
    isComplete: false
  });
  const [serviceForm, setServiceForm] = useState({ businessId: '', name: '', durationMinutes: 60, regularPrice: 250, description: '' });
  const [slotForm, setSlotForm] = useState({ businessId: '', serviceId: '', date: '2026-06-25', startTime: '17:30', endTime: '18:30', regularPrice: 250, dealPrice: 190 });
  const [editingBusiness, setEditingBusiness] = useState(null);
  const [editingService, setEditingService] = useState(null);
  const [editingSlot, setEditingSlot] = useState(null);
  const [msg, setMsg] = useState('');

  const services = useMemo(() => businesses.flatMap(b => b.services || []), [businesses]);
  const slots = useMemo(() => businesses.flatMap(b => b.slots || []), [businesses]);

  async function load() {
    if (!user) return;
    const myBusinesses = await api('/businesses/my');
    setBusinesses(myBusinesses);

    const allBookings = await api('/bookings');
    setBookings(allBookings.filter(b => myBusinesses.some(mb => mb.id === b.businessId)));
  }

  useEffect(() => {
    api('/categories').then(cats => {
      setCategories(cats);
      // Set default categoryId to first available category
      if (cats.length > 0 && businessForm.categoryId === 1) {
        setBusinessForm(prev => ({ ...prev, categoryId: cats[0].id }));
      }
    });
  }, []);

  useEffect(() => {
    load();
  }, [user]);

  if (!user || !['BUSINESS', 'ADMIN'].includes(user.role)) {
    return (
      <section className="panel narrow">
        <h2>צד עסק</h2>
        <p>כדי לנהל עסק צריך להתחבר כעסק.</p>
        <button className="primary" onClick={() => setView('auth')}>
          כניסה / הרשמה
        </button>
      </section>
    );
  }

  async function createBusiness(e) {
    e.preventDefault();
    setMsg('');

    console.log('[BusinessPage] Create business - Address object:', {
      cityCode: businessForm.cityCode,
      cityNameHebrew: businessForm.cityNameHebrew,
      streetCode: businessForm.streetCode,
      streetNameHebrew: businessForm.streetNameHebrew,
      houseNumber: businessForm.houseNumber,
      formattedAddress: businessForm.formattedAddress,
      isComplete: businessForm.isComplete
    });

    // Validate address - must have all code-based required fields
    if (!businessForm.cityCode || !businessForm.streetCode || !businessForm.houseNumber) {
      console.error('[BusinessPage] Validation failed:', {
        cityCode: businessForm.cityCode,
        streetCode: businessForm.streetCode,
        houseNumber: businessForm.houseNumber
      });
      setMsg('יש למלא כתובת מלאה: עיר, רחוב ומספר בית');
      setTimeout(() => setMsg(''), 4000);
      return;
    }

    // Validate address is complete
    if (!businessForm.isComplete) {
      console.error('[BusinessPage] Address not complete');
      setMsg('יש לבחור עיר ורחוב מתוך הרשימות הרשמיות בלבד');
      setTimeout(() => setMsg(''), 4000);
      return;
    }

    const payload = {
      name: businessForm.name,
      description: businessForm.description,
      phone: businessForm.phone,
      identifierType: businessForm.identifierType,
      identifierValue: businessForm.identifierValue,
      cityCode: businessForm.cityCode,
      cityNameHebrew: businessForm.cityNameHebrew,
      streetCode: businessForm.streetCode,
      streetNameHebrew: businessForm.streetNameHebrew,
      houseNumber: businessForm.houseNumber,
      formattedAddress: businessForm.formattedAddress,
      latitude: businessForm.latitude,
      longitude: businessForm.longitude,
      hasExactCoordinates: businessForm.hasExactCoordinates,
      isEstimatedLocation: businessForm.isEstimatedLocation,
      locationVerifiedByBusiness: businessForm.locationVerifiedByBusiness || false,
      categoryId: businessForm.categoryId
    };

    console.log('[BusinessPage] Sending payload:', payload);

    try {
      const response = await api('/businesses', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      console.log('[BusinessPage] Business created:', response);
      setMsg('העסק נוצר בהצלחה');
      setBusinessForm({
        name: '',
        description: '',
        phone: '',
        identifierType: 'COMPANY_NUMBER',
        identifierValue: '',
        cityCode: null,
        cityNameHebrew: '',
        streetCode: null,
        streetNameHebrew: '',
        houseNumber: '',
        formattedAddress: '',
        latitude: null,
        longitude: null,
        categoryId: categories.length > 0 ? categories[0].id : 1,
        isComplete: false
      });
      await load();
    } catch (err) {
      console.error('[BusinessPage] Create error:', err);
      setMsg(err.message);
    }
  }

  async function createService(e) {
    e.preventDefault();
    setMsg('');

    try {
      await api('/services', {
        method: 'POST',
        body: JSON.stringify(serviceForm)
      });

      setMsg('השירות נוצר');
      await load();
    } catch (err) {
      setMsg(err.message);
    }
  }

  async function createSlot(e) {
    e.preventDefault();
    setMsg('');

    try {
      await api('/slots', {
        method: 'POST',
        body: JSON.stringify(slotForm)
      });

      setMsg('התור פורסם');
      await load();
    } catch (err) {
      setMsg(err.message);
    }
  }

  async function updateBusiness(e) {
    e.preventDefault();
    setMsg('');

    console.log('[BusinessPage] Update business - Address object:', {
      cityCode: editingBusiness.cityCode,
      cityNameHebrew: editingBusiness.cityNameHebrew,
      streetCode: editingBusiness.streetCode,
      streetNameHebrew: editingBusiness.streetNameHebrew,
      houseNumber: editingBusiness.houseNumber,
      formattedAddress: editingBusiness.formattedAddress,
      isComplete: editingBusiness.isComplete
    });

    // Validate address - must have all code-based required fields
    if (!editingBusiness.cityCode || !editingBusiness.streetCode || !editingBusiness.houseNumber) {
      console.error('[BusinessPage] Update validation failed:', {
        cityCode: editingBusiness.cityCode,
        streetCode: editingBusiness.streetCode,
        houseNumber: editingBusiness.houseNumber
      });
      setMsg('יש למלא כתובת מלאה: עיר, רחוב ומספר בית');
      setTimeout(() => setMsg(''), 4000);
      return;
    }

    // Validate address is complete
    if (!editingBusiness.isComplete) {
      console.error('[BusinessPage] Update address not complete');
      setMsg('יש לבחור עיר ורחוב מתוך הרשימות הרשמיות בלבד');
      setTimeout(() => setMsg(''), 4000);
      return;
    }

    console.log('[BusinessPage] 🔍 editingBusiness state before creating payload:', {
      locationVerifiedByBusiness: editingBusiness.locationVerifiedByBusiness,
      latitude: editingBusiness.latitude,
      longitude: editingBusiness.longitude
    });

    const payload = {
      name: editingBusiness.name,
      description: editingBusiness.description,
      phone: editingBusiness.phone,
      cityCode: editingBusiness.cityCode,
      cityNameHebrew: editingBusiness.cityNameHebrew,
      streetCode: editingBusiness.streetCode,
      streetNameHebrew: editingBusiness.streetNameHebrew,
      houseNumber: editingBusiness.houseNumber,
      formattedAddress: editingBusiness.formattedAddress,
      latitude: editingBusiness.latitude,
      longitude: editingBusiness.longitude,
      hasExactCoordinates: editingBusiness.hasExactCoordinates,
      isEstimatedLocation: editingBusiness.isEstimatedLocation,
      locationVerifiedByBusiness: editingBusiness.locationVerifiedByBusiness === true,
      categoryId: editingBusiness.categoryId
    };

    console.log('[BusinessPage] 📤 Sending update payload:', payload);

    try {
      const response = await api(`/businesses/${editingBusiness.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      console.log('[BusinessPage] Business updated:', response);
      setMsg('העסק עודכן בהצלחה');
      setEditingBusiness(null);
      await load();
    } catch (err) {
      console.error('[BusinessPage] Update error:', err);
      setMsg(err.message);
    }
  }

  async function updateService(e) {
    e.preventDefault();
    setMsg('');
    try {
      await api(`/services/${editingService.id}`, {
        method: 'PATCH',
        body: JSON.stringify(editingService)
      });
      setMsg('השירות עודכן');
      setEditingService(null);
      await load();
    } catch (err) {
      setMsg(err.message);
    }
  }

  async function deleteService(id) {
    if (!confirm('למחוק שירות זה?')) return;
    setMsg('');
    try {
      await api(`/services/${id}`, { method: 'DELETE' });
      setMsg('השירות נמחק');
      await load();
    } catch (err) {
      setMsg(err.message);
    }
  }

  async function updateSlot(e) {
    e.preventDefault();
    setMsg('');
    try {
      await api(`/slots/${editingSlot.id}`, {
        method: 'PATCH',
        body: JSON.stringify(editingSlot)
      });
      setMsg('התור עודכן');
      setEditingSlot(null);
      await load();
    } catch (err) {
      setMsg(err.message);
    }
  }

  async function deleteSlot(id) {
    if (!confirm('למחוק תור זה?')) return;
    setMsg('');
    try {
      await api(`/slots/${id}`, { method: 'DELETE' });
      setMsg('התור נמחק');
      await load();
    } catch (err) {
      setMsg(err.message);
    }
  }

  async function updateBookingStatus(id, status) {
    setMsg('');
    try {
      await api(`/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      setMsg('הסטטוס עודכן');
      await load();
    } catch (err) {
      setMsg(err.message);
    }
  }

  async function confirm(id) {
    await api(`/bookings/${id}/confirm`, { method: 'PATCH' });
    await load();
  }

  async function cancel(id) {
    await api(`/bookings/${id}/cancel`, { method: 'PATCH' });
    await load();
  }

  const openSlots = slots.filter(s => s.status === 'OPEN');
  const pendingBookings = bookings.filter(b => b.status === 'PENDING');
  const completedBookings = bookings.filter(b => b.status === 'COMPLETED');

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">ניהול עסק</h1>
        <p className="page-description">ניהול מקצועי של השירותים, התורים וההזמנות שלך</p>
      </div>

      <div className="flex" style={{ gap: 'var(--space-3)', marginBottom: 'var(--space-8)', flexWrap: 'wrap' }}>
        <button className={activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'} onClick={() => setActiveTab('dashboard')}>
          📊 דשבורד
        </button>
        <button className={activeTab === 'services' ? 'btn-primary' : 'btn-secondary'} onClick={() => setActiveTab('services')}>
          🛎️ שירותים
        </button>
        <button className={activeTab === 'slots' ? 'btn-primary' : 'btn-secondary'} onClick={() => setActiveTab('slots')}>
          📅 תורים
        </button>
        <button className={activeTab === 'bookings' ? 'btn-primary' : 'btn-secondary'} onClick={() => setActiveTab('bookings')}>
          📋 הזמנות
        </button>
        <button className={activeTab === 'settings' ? 'btn-primary' : 'btn-secondary'} onClick={() => setActiveTab('settings')}>
          ⚙️ הגדרות
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <div>
          <div className="grid grid-3 mb-8">
            <div className="kpi-card">
              <div className="kpi-header">
                <div className="kpi-icon kpi-icon-primary">🛎️</div>
                <div className="kpi-label">סה״כ שירותים</div>
              </div>
              <div className="kpi-value">{services.length}</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <div className="kpi-icon kpi-icon-accent">📅</div>
                <div className="kpi-label">תורים פתוחים</div>
              </div>
              <div className="kpi-value">{openSlots.length}</div>
              <div className="kpi-trend">מתוך {slots.length} סה״כ</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <div className="kpi-icon kpi-icon-warning">⏳</div>
                <div className="kpi-label">הזמנות ממתינות</div>
              </div>
              <div className="kpi-value">{pendingBookings.length}</div>
              <div className="kpi-trend">דורש טיפול</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <div className="kpi-icon kpi-icon-primary">📋</div>
                <div className="kpi-label">סה״כ הזמנות</div>
              </div>
              <div className="kpi-value">{bookings.length}</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <div className="kpi-icon kpi-icon-success">✅</div>
                <div className="kpi-label">הושלמו</div>
              </div>
              <div className="kpi-value">{completedBookings.length}</div>
              <div className="kpi-trend kpi-trend-up">
                {bookings.length > 0 ? Math.round((completedBookings.length / bookings.length) * 100) : 0}% מכלל ההזמנות
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <div className="kpi-icon kpi-icon-accent">📊</div>
                <div className="kpi-label">ממוצע לעסק</div>
              </div>
              <div className="kpi-value">
                {businesses.length > 0 ? Math.round(bookings.length / businesses.length) : 0}
              </div>
              <div className="kpi-trend">הזמנות</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">העסקים שלי</h3>
              <p className="card-description">רשימת העסקים שאתה מנהל</p>
            </div>
            {businesses.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">🏢</div>
                <div className="empty-state-title">אין עדיין עסקים</div>
                <div className="empty-state-description">צור את העסק הראשון שלך בהגדרות</div>
                <button className="btn-primary" onClick={() => setActiveTab('settings')}>
                  צור עסק חדש
                </button>
              </div>
            )}
            {businesses.map(b => (
              <div key={b.id} style={{
                padding: 'var(--space-4)',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-1)' }}>{b.name}</div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                    📍 {b.city} · 📞 {b.phone}
                  </div>
                </div>
                <span className={`badge ${b.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'services' && (
        <div>
          <div className="card mb-8">
            <div className="card-header">
              <h3 className="card-title">הוספת שירות חדש</h3>
              <p className="card-description">הגדר את השירותים שהעסק שלך מציע</p>
            </div>
            <form onSubmit={createService}>
              <div className="form-group">
                <label className="form-label">עסק *</label>
                <select value={serviceForm.businessId} onChange={e => setServiceForm({ ...serviceForm, businessId: Number(e.target.value) })} required>
                  <option value="">בחר עסק</option>
                  {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">שם השירות *</label>
                <input placeholder="לדוגמה: תספורת גברים" value={serviceForm.name} onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })} required />
              </div>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">משך (דקות) *</label>
                  <input type="number" placeholder="60" value={serviceForm.durationMinutes} onChange={e => setServiceForm({ ...serviceForm, durationMinutes: Number(e.target.value) })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">מחיר רגיל *</label>
                  <input type="number" placeholder="250" value={serviceForm.regularPrice} onChange={e => setServiceForm({ ...serviceForm, regularPrice: Number(e.target.value) })} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">תיאור (אופציונלי)</label>
                <textarea placeholder="תיאור השירות..." value={serviceForm.description} onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })} />
              </div>
              <button className="btn-primary">💾 שמור שירות</button>
            </form>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">השירותים שלי ({services.length})</h3>
              <p className="card-description">ניהול השירותים הקיימים</p>
            </div>
            {services.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">🛎️</div>
                <div className="empty-state-title">אין שירותים עדיין</div>
                <div className="empty-state-description">צור את השירות הראשון שלך כדי להתחיל לקבל הזמנות</div>
              </div>
            )}
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>שם השירות</th>
                    <th>משך</th>
                    <th>מחיר</th>
                    <th>סטטוס</th>
                    <th>פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 'var(--font-semibold)' }}>{s.name}</td>
                      <td>{s.durationMinutes} דקות</td>
                      <td>₪{s.regularPrice}</td>
                      <td>
                        <span className={`badge ${s.active ? 'badge-success' : 'badge-gray'}`}>
                          {s.active ? '✓ פעיל' : '○ לא פעיל'}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn-sm btn-secondary" onClick={() => setEditingService(s)}>✏️ ערוך</button>
                          <button className="btn-sm btn-danger" onClick={() => deleteService(s.id)}>🗑️ מחק</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {editingService && (
            <div className="modal-backdrop" onClick={() => setEditingService(null)}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={() => setEditingService(null)}>✕</button>
                <h3>עריכת שירות</h3>
                <form className="form" onSubmit={updateService}>
                  <input placeholder="שם השירות" value={editingService.name} onChange={e => setEditingService({ ...editingService, name: e.target.value })} required />
                  <input type="number" placeholder="משך (דקות)" value={editingService.durationMinutes} onChange={e => setEditingService({ ...editingService, durationMinutes: Number(e.target.value) })} required />
                  <input type="number" placeholder="מחיר רגיל" value={editingService.regularPrice} onChange={e => setEditingService({ ...editingService, regularPrice: Number(e.target.value) })} required />
                  <textarea placeholder="תיאור" value={editingService.description || ''} onChange={e => setEditingService({ ...editingService, description: e.target.value })} />
                  <label>
                    <input type="checkbox" checked={editingService.active} onChange={e => setEditingService({ ...editingService, active: e.target.checked })} />
                    פעיל
                  </label>
                  <button className="primary">שמור</button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'slots' && (
        <div>
          <div className="card mb-8">
            <div className="card-header">
              <h3 className="card-title">פרסום תור פנוי</h3>
              <p className="card-description">פרסם תורים פנויים כדי למלא את היומן שלך</p>
            </div>
            <form onSubmit={createSlot}>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">עסק *</label>
                  <select value={slotForm.businessId} onChange={e => setSlotForm({ ...slotForm, businessId: Number(e.target.value) })} required>
                    <option value="">בחר עסק</option>
                    {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">שירות *</label>
                  <select value={slotForm.serviceId} onChange={e => setSlotForm({ ...slotForm, serviceId: Number(e.target.value) })} required>
                    <option value="">בחר שירות</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-3">
                <div className="form-group">
                  <label className="form-label">תאריך *</label>
                  <input type="date" value={slotForm.date} onChange={e => setSlotForm({ ...slotForm, date: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">שעת התחלה *</label>
                  <input type="time" placeholder="09:00" value={slotForm.startTime} onChange={e => setSlotForm({ ...slotForm, startTime: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">שעת סיום *</label>
                  <input type="time" placeholder="10:00" value={slotForm.endTime} onChange={e => setSlotForm({ ...slotForm, endTime: e.target.value })} required />
                </div>
              </div>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">מחיר רגיל *</label>
                  <input type="number" placeholder="250" value={slotForm.regularPrice} onChange={e => setSlotForm({ ...slotForm, regularPrice: Number(e.target.value) })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">מחיר מבצע (אופציונלי)</label>
                  <input type="number" placeholder="190" value={slotForm.dealPrice} onChange={e => setSlotForm({ ...slotForm, dealPrice: Number(e.target.value) })} />
                </div>
              </div>
              <button className="btn-primary">📅 פרסם תור</button>
            </form>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">התורים שלי ({slots.length})</h3>
              <p className="card-description">ניהול התורים הפנויים והתפוסים</p>
            </div>
            {slots.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">📅</div>
                <div className="empty-state-title">אין תורים פנויים</div>
                <div className="empty-state-description">פרסם את התור הראשון שלך כדי להתחיל לקבל הזמנות</div>
              </div>
            )}
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>שירות</th>
                    <th>תאריך</th>
                    <th>שעה</th>
                    <th>מחיר</th>
                    <th>סטטוס</th>
                    <th>פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {slots.map(sl => (
                    <tr key={sl.id}>
                      <td style={{ fontWeight: 'var(--font-semibold)' }}>{sl.service?.name || 'שירות'}</td>
                      <td>{sl.date}</td>
                      <td>{sl.startTime}-{sl.endTime}</td>
                      <td>
                        {sl.dealPrice && sl.dealPrice < sl.regularPrice ? (
                          <span>
                            <span style={{ color: 'var(--primary-600)', fontWeight: 'var(--font-bold)' }}>₪{sl.dealPrice}</span>
                            {' '}
                            <span style={{ textDecoration: 'line-through', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>₪{sl.regularPrice}</span>
                          </span>
                        ) : (
                          <span>₪{sl.regularPrice}</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${
                          sl.status === 'OPEN' ? 'badge-success' :
                          sl.status === 'BOOKED' ? 'badge-primary' :
                          'badge-gray'
                        }`}>
                          {sl.status === 'OPEN' ? '✓ פתוח' : sl.status === 'BOOKED' ? '📋 מוזמן' : sl.status}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn-sm btn-secondary" onClick={() => setEditingSlot(sl)}>✏️ ערוך</button>
                          <button className="btn-sm btn-danger" onClick={() => deleteSlot(sl.id)}>🗑️ מחק</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {editingSlot && (
            <div className="modal-backdrop" onClick={() => setEditingSlot(null)}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={() => setEditingSlot(null)}>✕</button>
                <h3>עריכת חור</h3>
                <form className="form" onSubmit={updateSlot}>
                  <input type="date" value={editingSlot.date} onChange={e => setEditingSlot({ ...editingSlot, date: e.target.value })} required />
                  <input placeholder="שעת התחלה" value={editingSlot.startTime} onChange={e => setEditingSlot({ ...editingSlot, startTime: e.target.value })} required />
                  <input placeholder="שעת סיום" value={editingSlot.endTime} onChange={e => setEditingSlot({ ...editingSlot, endTime: e.target.value })} required />
                  <input type="number" placeholder="מחיר רגיל" value={editingSlot.regularPrice} onChange={e => setEditingSlot({ ...editingSlot, regularPrice: Number(e.target.value) })} required />
                  <input type="number" placeholder="מחיר דיל" value={editingSlot.dealPrice || ''} onChange={e => setEditingSlot({ ...editingSlot, dealPrice: e.target.value ? Number(e.target.value) : null })} />
                  <button className="primary">שמור</button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">הזמנות ({bookings.length})</h3>
            <p className="card-description">ניהול כל ההזמנות מלקוחות</p>
          </div>
          {bookings.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-title">אין הזמנות עדיין</div>
              <div className="empty-state-description">כשלקוחות יזמינו תורים, הם יופיעו כאן</div>
            </div>
          )}
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>לקוח</th>
                  <th>שירות</th>
                  <th>תאריך ושעה</th>
                  <th>מחיר</th>
                  <th>סטטוס</th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id}>
                    <td>
                      <div style={{ fontWeight: 'var(--font-semibold)' }}>{b.customerName}</div>
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>📞 {b.customerPhone}</div>
                    </td>
                    <td>{b.service?.name}</td>
                    <td>
                      <div>{b.slot?.date}</div>
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{b.slot?.startTime}</div>
                    </td>
                    <td style={{ fontWeight: 'var(--font-semibold)' }}>₪{b.price}</td>
                    <td>
                      <span className={`badge ${
                        b.status === 'APPROVED' ? 'badge-success' :
                        b.status === 'PENDING' ? 'badge-warning' :
                        b.status === 'COMPLETED' ? 'badge-primary' :
                        b.status === 'REJECTED' || b.status === 'CANCELLED' ? 'badge-danger' :
                        'badge-gray'
                      }`}>
                        {b.status === 'APPROVED' ? '✓ מאושר' :
                         b.status === 'PENDING' ? '⏳ ממתין' :
                         b.status === 'COMPLETED' ? '✅ הושלם' :
                         b.status === 'REJECTED' ? '✗ נדחה' :
                         b.status === 'CANCELLED' ? '✗ בוטל' :
                         b.status}
                      </span>
                    </td>
                    <td>
                      <select
                        value={b.status}
                        onChange={e => updateBookingStatus(b.id, e.target.value)}
                        style={{
                          fontSize: 'var(--text-sm)',
                          padding: 'var(--space-2) var(--space-3)',
                          borderRadius: 'var(--radius-md)'
                        }}
                      >
                        <option value="PENDING">⏳ ממתין</option>
                        <option value="APPROVED">✓ מאושר</option>
                        <option value="REJECTED">✗ נדחה</option>
                        <option value="COMPLETED">✅ הושלם</option>
                        <option value="CANCELLED">✗ בוטל</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div>
          <div className="card mb-8">
            <div className="card-header">
              <h3 className="card-title">יצירת עסק חדש</h3>
              <p className="card-description">הוסף עסק חדש למערכת</p>
            </div>
            <form onSubmit={createBusiness}>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">שם העסק *</label>
                  <input placeholder="לדוגמה: מספרת דן" value={businessForm.name} onChange={e => setBusinessForm({ ...businessForm, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">טלפון *</label>
                  <input placeholder="03-1234567" value={businessForm.phone} onChange={e => setBusinessForm({ ...businessForm, phone: e.target.value })} required />
                </div>
              </div>

              {/* Business Identifier Fields */}
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">סוג מזהה עסקי *</label>
                  <select value={businessForm.identifierType} onChange={e => setBusinessForm({ ...businessForm, identifierType: e.target.value })} required>
                    <option value="ISRAELI_ID">תעודת זהות</option>
                    <option value="COMPANY_NUMBER">חברה בע"מ / ח.פ</option>
                    <option value="AUTHORIZED_DEALER">עוסק מורשה</option>
                    <option value="EXEMPT_DEALER">עוסק פטור</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">מספר מזהה *</label>
                  <input
                    placeholder="למשל: 123456789"
                    value={businessForm.identifierValue}
                    onChange={e => setBusinessForm({ ...businessForm, identifierValue: e.target.value })}
                    required
                  />
                  <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                    {businessForm.identifierType === 'ISRAELI_ID' && 'תעודת זהות ישראלית - 9 ספרות'}
                    {businessForm.identifierType === 'COMPANY_NUMBER' && 'מספר חברה - 9 ספרות'}
                    {businessForm.identifierType === 'AUTHORIZED_DEALER' && 'עוסק מורשה - 9 ספרות'}
                    {businessForm.identifierType === 'EXEMPT_DEALER' && 'עוסק פטור - 9 ספרות'}
                  </div>
                </div>
              </div>

              {/* Business Address Form - 3 Fields */}
              <BusinessAddressForm
                value={businessForm}
                onChange={(addressData) => {
                  setBusinessForm({
                    ...businessForm,
                    ...addressData
                  });
                }}
                required={true}
              />
              <div className="form-group">
                <label className="form-label">קטגוריה *</label>
                <select value={businessForm.categoryId} onChange={e => setBusinessForm({ ...businessForm, categoryId: Number(e.target.value) })} required>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">תיאור (אופציונלי)</label>
                <textarea placeholder="תיאור העסק..." value={businessForm.description} onChange={e => setBusinessForm({ ...businessForm, description: e.target.value })} />
              </div>
              <button className="btn-primary">💼 שמור עסק</button>
            </form>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">העסקים שלי ({businesses.length})</h3>
              <p className="card-description">ניהול העסקים הקיימים</p>
            </div>
            {businesses.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">🏢</div>
                <div className="empty-state-title">אין עסקים עדיין</div>
                <div className="empty-state-description">צור את העסק הראשון שלך כדי להתחיל</div>
              </div>
            )}
            {businesses.map(b => (
              <div key={b.id} style={{
                padding: 'var(--space-5)',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 'var(--space-4)'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'var(--font-bold)', fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>{b.name}</div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>
                    📍 {b.city} · 📞 {b.phone}
                  </div>
                  <span className={`badge ${b.status === 'ACTIVE' ? 'badge-success' : b.status === 'PENDING_APPROVAL' ? 'badge-warning' : 'badge-gray'}`}>
                    {b.status === 'ACTIVE' ? '✓ פעיל' : b.status === 'PENDING_APPROVAL' ? '⏳ ממתין לאישור' : b.status}
                  </span>
                </div>
                <button className="btn-secondary btn-sm" onClick={() => {
                  console.log('[BusinessPage] 🖊️ Opening edit for business:', {
                    id: b.id,
                    name: b.name,
                    locationVerifiedByBusiness: b.locationVerifiedByBusiness,
                    latitude: b.latitude,
                    longitude: b.longitude
                  });
                  setEditingBusiness(b);
                }}>✏️ ערוך</button>
              </div>
            ))}
          </div>

          {editingBusiness && (
            <div className="modal-backdrop" onClick={() => setEditingBusiness(null)}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={() => setEditingBusiness(null)}>✕</button>
                <h3>עריכת עסק</h3>
                <form className="form" onSubmit={updateBusiness}>
                  <div className="form-group">
                    <label className="form-label">שם העסק *</label>
                    <input placeholder="שם עסק" value={editingBusiness.name} onChange={e => setEditingBusiness({ ...editingBusiness, name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">טלפון *</label>
                    <input placeholder="טלפון" value={editingBusiness.phone} onChange={e => setEditingBusiness({ ...editingBusiness, phone: e.target.value })} required />
                  </div>

                  <BusinessAddressForm
                    value={editingBusiness}
                    onChange={(addressData) => {
                      setEditingBusiness({
                        ...editingBusiness,
                        ...addressData
                      });
                    }}
                    required={true}
                  />

                  <div className="form-group">
                    <label className="form-label">תיאור (אופציונלי)</label>
                    <textarea placeholder="תיאור העסק..." value={editingBusiness.description || ''} onChange={e => setEditingBusiness({ ...editingBusiness, description: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">קטגוריה *</label>
                    <select value={editingBusiness.categoryId} onChange={e => setEditingBusiness({ ...editingBusiness, categoryId: Number(e.target.value) })} required>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <button className="btn-primary">💾 שמור שינויים</button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {msg && <div className="toast">{msg}</div>}
    </div>
  );
}
