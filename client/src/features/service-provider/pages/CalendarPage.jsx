import { useState, useEffect } from 'react';
import { api } from '../../../api';
import SlotForm from '../../business/components/SlotForm';
import SlotCard from '../../business/components/SlotCard';

/**
 * CalendarPage - Standalone slot management for Service Provider Workspace
 * Migrated to use provider-scoped API routes (Phase B)
 */
export default function CalendarPage({ user }) {
  const [business, setBusiness] = useState(null);
  const [services, setServices] = useState([]);
  const [slots, setSlots] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Slot form state - businessId kept for SlotForm compatibility but not sent to backend
  const [slotForm, setSlotForm] = useState({
    businessId: '',
    date: '',
    startTime: '',
    endTime: '',
    regularPrice: '',
    dealPrice: '',
    status: 'OPEN',
    allowedServiceIds: [] // Epic 2: Multiple services per slot
  });

  const [editingSlot, setEditingSlot] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      // Fetch provider business profile
      const businessRes = await api('/api/service-provider/business/profile');
      if (businessRes.success && businessRes.data) {
        const businessData = businessRes.data;
        setBusiness(businessData);

        // Set businessId in form for SlotForm compatibility (not sent to backend)
        if (!slotForm.businessId) {
          setSlotForm(prev => ({ ...prev, businessId: businessData.id }));
        }
      }

      // Fetch provider services
      const servicesRes = await api('/api/service-provider/services');
      if (servicesRes.success && Array.isArray(servicesRes.data)) {
        setServices(servicesRes.data);
      }

      // Fetch provider slots
      const slotsRes = await api('/api/service-provider/slots');
      if (slotsRes.success && Array.isArray(slotsRes.data)) {
        setSlots(slotsRes.data);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      showMessage('שגיאה בטעינת נתונים');
    } finally {
      setLoading(false);
    }
  }

  function showMessage(msg) {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  }

  async function createSlot(e) {
    e.preventDefault();

    // Validate allowedServiceIds
    if (!slotForm.allowedServiceIds || slotForm.allowedServiceIds.length === 0) {
      showMessage('חובה לבחור לפחות שירות אחד');
      return;
    }

    try {
      // Extract only fields needed by backend (no businessId)
      const slotData = {
        date: slotForm.date,
        startTime: slotForm.startTime,
        endTime: slotForm.endTime,
        regularPrice: slotForm.regularPrice,
        dealPrice: slotForm.dealPrice || undefined,
        allowedServiceIds: slotForm.allowedServiceIds
      };

      const result = await api('/api/service-provider/slots', {
        method: 'POST',
        body: JSON.stringify(slotData)
      });

      if (result.success) {
        showMessage('התור פורסם');
        await loadData();

        // Reset form
        setSlotForm({
          businessId: slotForm.businessId, // Keep for SlotForm compatibility
          date: '',
          startTime: '',
          endTime: '',
          regularPrice: '',
          dealPrice: '',
          status: 'OPEN',
          allowedServiceIds: []
        });
      } else {
        showMessage(result.error || 'שגיאה ביצירת תור');
      }
    } catch (err) {
      showMessage(err.message || 'שגיאה ביצירת תור');
    }
  }

  async function updateSlot(e) {
    e.preventDefault();

    try {
      // Extract only fields that can be updated
      const updateData = {
        date: editingSlot.date,
        startTime: editingSlot.startTime,
        endTime: editingSlot.endTime,
        regularPrice: editingSlot.regularPrice,
        dealPrice: editingSlot.dealPrice || null,
        note: editingSlot.note
      };

      const result = await api(`/api/service-provider/slots/${editingSlot.id}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      });

      if (result.success) {
        showMessage('התור עודכן');
        setEditingSlot(null);
        await loadData();
      } else {
        showMessage(result.error || 'שגיאה בעדכון תור');
      }
    } catch (err) {
      showMessage(err.message || 'שגיאה בעדכון תור');
    }
  }

  async function deleteSlot(id) {
    if (!confirm('למחוק תור זה?')) return;

    try {
      const result = await api(`/api/service-provider/slots/${id}`, {
        method: 'DELETE'
      });

      if (result.success) {
        showMessage('התור נמחק');
        await loadData();
      } else {
        showMessage(result.error || 'שגיאה במחיקת תור');
      }
    } catch (err) {
      showMessage(err.message || 'שגיאה במחיקת תור');
    }
  }

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>טוען...</div>;
  }

  const businessServices = services.filter(s => s.businessId === Number(slotForm.businessId));

  return (
    <div>
      {/* Message Toast */}
      {message && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 1000
        }}>
          {message}
        </div>
      )}

      {/* Slot Creation Form */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h3 className="card-title">פרסום תור חדש</h3>
          <p className="card-description">צור תור חדש עם בחירת שירותים מרובים</p>
        </div>
        <div className="card-body">
          <SlotForm
            slotForm={slotForm}
            setSlotForm={setSlotForm}
            businesses={business ? [business] : []}
            services={businessServices}
            onSubmit={createSlot}
            showMessage={showMessage}
          />
        </div>
      </div>

      {/* Existing Slots */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">תורים קיימים ({slots.length})</h3>
          <p className="card-description">כל התורים שפרסמת</p>
        </div>

        {slots.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <h3 className="empty-state-title">אין תורים</h3>
            <p className="empty-state-description">פרסם תור ראשון כדי להתחיל לקבל הזמנות</p>
          </div>
        )}

        {slots.length > 0 && (
          <div style={{ padding: '16px', display: 'grid', gap: '16px' }}>
            {slots.map(slot => (
              <SlotCard
                key={slot.id}
                slot={slot}
                onEdit={setEditingSlot}
                onDelete={deleteSlot}
                showMessage={showMessage}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal (if needed) */}
      {editingSlot && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ maxWidth: '600px', width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
            <div className="card-header">
              <h3 className="card-title">עריכת תור</h3>
              <button onClick={() => setEditingSlot(null)} className="btn-ghost">✕</button>
            </div>
            <div className="card-body">
              <SlotForm
                slotForm={editingSlot}
                setSlotForm={setEditingSlot}
                businesses={business ? [business] : []}
                services={services.filter(s => s.businessId === editingSlot.businessId)}
                onSubmit={updateSlot}
                showMessage={showMessage}
                isEditing={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
