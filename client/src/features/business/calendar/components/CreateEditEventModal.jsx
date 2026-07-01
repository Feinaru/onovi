import React, { useState, useEffect } from 'react';
import { api } from '../../../../api';
import './CreateEditEventModal.css';

/**
 * CreateEditEventModal - Create or edit calendar events
 * Handles: Slot, CalendarEvent, TimeBlock, Vacation
 */
function CreateEditEventModal({ eventType, event, initialData, businessId, onClose, onSuccess }) {
  const isEditing = !!event;
  const [formData, setFormData] = useState(getInitialFormData());
  const [services, setServices] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Handle escape key
  useEffect(() => {
    function handleEscape(e) {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose, isSubmitting]);

  function getInitialFormData() {
    if (event) {
      // Editing existing event
      return { ...event };
    }

    // Helper to format date in local timezone (avoiding UTC conversion)
    const formatDateLocal = (date) => {
      if (typeof date === 'string') return date;
      const d = date || new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Creating new event
    const baseData = {
      date: formatDateLocal(initialData?.date),
      startTime: initialData?.startTime || '09:00',
      endTime: initialData?.endTime || '10:00',
    };

    switch (eventType) {
      case 'SLOT':
        return {
          ...baseData,
          serviceId: '',
          regularPrice: '',
          dealPrice: '',
          note: '',
        };
      case 'CALENDAR_EVENT':
        return {
          ...baseData,
          title: '',
          category: 'APPOINTMENT',
          description: '',
          customerName: '',
          customerPhone: '',
        };
      case 'TIME_BLOCK':
        return {
          ...baseData,
          title: '',
          blockType: 'BREAK',
          description: '',
          recurring: false,
        };
      case 'VACATION':
        return {
          title: '',
          startDate: formatDateLocal(initialData?.date),
          endDate: formatDateLocal(initialData?.date),
          description: '',
        };
      default:
        return baseData;
    }
  }

  useEffect(() => {
    async function fetchServices() {
      if (eventType !== 'SLOT') return;
      if (!businessId) {
        setError('Business ID not found. Please refresh the page.');
        return;
      }

      try {
        const data = await api(`/services?businessId=${businessId}`);
        setServices(data || []);
        if (data && data.length > 0 && !formData.serviceId) {
          setFormData(prev => ({ ...prev, serviceId: data[0].id }));
        } else if (!data || data.length === 0) {
          setError('No services found. Please create a service first in the Services tab.');
        }
      } catch (err) {
        setError(`Failed to load services: ${err.message}`);
      }
    }

    fetchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventType, businessId]);

  function handleChange(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let endpoint, method, body;

      if (eventType === 'SLOT') {
        if (isEditing) {
          endpoint = `/api/calendar/${businessId}/slots/${event.originalId}`;
          method = 'PATCH';
          body = {
            date: formData.date,
            startTime: formData.startTime,
            endTime: formData.endTime,
            regularPrice: Number(formData.regularPrice),
            dealPrice: formData.dealPrice ? Number(formData.dealPrice) : null,
            note: formData.note || null,
          };
        } else {
          endpoint = `/api/calendar/${businessId}/slots`;
          method = 'POST';
          body = {
            serviceId: Number(formData.serviceId),
            date: formData.date,
            startTime: formData.startTime,
            endTime: formData.endTime,
            regularPrice: Number(formData.regularPrice),
            dealPrice: formData.dealPrice ? Number(formData.dealPrice) : null,
            note: formData.note || null,
          };
        }
      } else if (eventType === 'CALENDAR_EVENT') {
        if (isEditing) {
          endpoint = `/api/calendar/${businessId}/calendar-events/${event.originalId}`;
          method = 'PATCH';
        } else {
          endpoint = `/api/calendar/${businessId}/calendar-events`;
          method = 'POST';
        }
        body = {
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          eventType: formData.category || 'APPOINTMENT',
          category: formData.category || 'APPOINTMENT',
          title: formData.title,
          description: formData.description || null,
          customerName: formData.customerName || null,
          customerPhone: formData.customerPhone || null,
        };
      } else if (eventType === 'TIME_BLOCK') {
        if (isEditing) {
          endpoint = `/api/calendar/${businessId}/time-blocks/${event.originalId}`;
          method = 'PATCH';
        } else {
          endpoint = `/api/calendar/${businessId}/time-blocks`;
          method = 'POST';
        }
        body = {
          title: formData.title,
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          blockType: formData.blockType || 'BREAK',
          description: formData.description || null,
          recurring: formData.recurring || false,
        };
      } else if (eventType === 'VACATION') {
        if (isEditing) {
          endpoint = `/api/calendar/${businessId}/vacations/${event.originalId}`;
          method = 'PATCH';
        } else {
          endpoint = `/api/calendar/${businessId}/vacations`;
          method = 'POST';
        }
        body = {
          title: formData.title,
          startDate: formData.startDate,
          endDate: formData.endDate,
          description: formData.description || null,
        };
      }

      await api(endpoint, {
        method,
        body: JSON.stringify(body),
      });

      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderSlotForm() {
    return (
      <>
        <div className="form-field">
          <label>שירות *</label>
          <select
            value={formData.serviceId}
            onChange={e => handleChange('serviceId', e.target.value)}
            required
            disabled={isEditing && event.bookings && event.bookings.length > 0}
          >
            <option value="">בחר שירות</option>
            {services.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.durationMinutes} דקות)
              </option>
            ))}
          </select>
          {isEditing && event.bookings && event.bookings.length > 0 && (
            <small className="form-help">לא ניתן לשנות שירות כאשר יש הזמנות</small>
          )}
        </div>

        <div className="form-row">
          <div className="form-field">
            <label>תאריך *</label>
            <input
              type="date"
              value={formData.date}
              onChange={e => handleChange('date', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-field">
            <label>שעת התחלה *</label>
            <input
              type="time"
              value={formData.startTime}
              onChange={e => handleChange('startTime', e.target.value)}
              required
            />
          </div>
          <div className="form-field">
            <label>שעת סיום *</label>
            <input
              type="time"
              value={formData.endTime}
              onChange={e => handleChange('endTime', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-field">
            <label>מחיר רגיל *</label>
            <input
              type="number"
              value={formData.regularPrice}
              onChange={e => handleChange('regularPrice', e.target.value)}
              required
              min="0"
              step="0.01"
            />
          </div>
          <div className="form-field">
            <label>מחיר מבצע</label>
            <input
              type="number"
              value={formData.dealPrice}
              onChange={e => handleChange('dealPrice', e.target.value)}
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div className="form-field">
          <label>הערה</label>
          <textarea
            value={formData.note}
            onChange={e => handleChange('note', e.target.value)}
            rows="3"
          />
        </div>
      </>
    );
  }

  function renderCalendarEventForm() {
    return (
      <>
        <div className="form-field">
          <label>קטגוריה *</label>
          <select
            value={formData.category}
            onChange={e => handleChange('category', e.target.value)}
            required
          >
            <option value="APPOINTMENT">⚪ פגישה</option>
            <option value="PHONE_BOOKING">📞 תיאום טלפוני</option>
            <option value="WHATSAPP_BOOKING">💬 תיאום וואטסאפ</option>
            <option value="MEETING">👥 פגישה</option>
            <option value="PERSONAL">🏠 אישי</option>
            <option value="LUNCH">🍽️ ארוחה</option>
            <option value="TRAINING">📚 הדרכה</option>
            <option value="BREAK">☕ הפסקה</option>
            <option value="OTHER">אחר</option>
          </select>
        </div>

        <div className="form-field">
          <label>כותרת *</label>
          <input
            type="text"
            value={formData.title}
            onChange={e => handleChange('title', e.target.value)}
            required
          />
        </div>

        <div className="form-field">
          <label>תאריך *</label>
          <input
            type="date"
            value={formData.date}
            onChange={e => handleChange('date', e.target.value)}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-field">
            <label>שעת התחלה *</label>
            <input
              type="time"
              value={formData.startTime}
              onChange={e => handleChange('startTime', e.target.value)}
              required
            />
          </div>
          <div className="form-field">
            <label>שעת סיום *</label>
            <input
              type="time"
              value={formData.endTime}
              onChange={e => handleChange('endTime', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-field">
          <label>שם לקוח</label>
          <input
            type="text"
            value={formData.customerName}
            onChange={e => handleChange('customerName', e.target.value)}
          />
        </div>

        <div className="form-field">
          <label>טלפון לקוח</label>
          <input
            type="tel"
            value={formData.customerPhone}
            onChange={e => handleChange('customerPhone', e.target.value)}
          />
        </div>

        <div className="form-field">
          <label>תיאור</label>
          <textarea
            value={formData.description}
            onChange={e => handleChange('description', e.target.value)}
            rows="3"
          />
        </div>
      </>
    );
  }

  function renderTimeBlockForm() {
    return (
      <>
        <div className="form-field">
          <label>סוג חסימה *</label>
          <select
            value={formData.blockType}
            onChange={e => handleChange('blockType', e.target.value)}
            required
          >
            <option value="BREAK">☕ הפסקה</option>
            <option value="LUNCH">🍽️ ארוחה</option>
            <option value="PERSONAL">🏠 אישי</option>
            <option value="MEETING">👥 פגישה</option>
            <option value="OTHER">אחר</option>
          </select>
        </div>

        <div className="form-field">
          <label>כותרת *</label>
          <input
            type="text"
            value={formData.title}
            onChange={e => handleChange('title', e.target.value)}
            required
            placeholder="לדוגמה: הפסקת צהריים"
          />
        </div>

        <div className="form-field">
          <label>תאריך *</label>
          <input
            type="date"
            value={formData.date}
            onChange={e => handleChange('date', e.target.value)}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-field">
            <label>שעת התחלה *</label>
            <input
              type="time"
              value={formData.startTime}
              onChange={e => handleChange('startTime', e.target.value)}
              required
            />
          </div>
          <div className="form-field">
            <label>שעת סיום *</label>
            <input
              type="time"
              value={formData.endTime}
              onChange={e => handleChange('endTime', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-field">
          <label>תיאור</label>
          <textarea
            value={formData.description}
            onChange={e => handleChange('description', e.target.value)}
            rows="3"
          />
        </div>

        <div className="form-field">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.recurring}
              onChange={e => handleChange('recurring', e.target.checked)}
            />
            <span>חוזר</span>
          </label>
          <small className="form-help">תכונת חזרה תיושם בגרסה עתידית</small>
        </div>
      </>
    );
  }

  function renderVacationForm() {
    return (
      <>
        <div className="form-field">
          <label>כותרת *</label>
          <input
            type="text"
            value={formData.title}
            onChange={e => handleChange('title', e.target.value)}
            required
            placeholder="לדוגמה: חופשה משפחתית"
          />
        </div>

        <div className="form-row">
          <div className="form-field">
            <label>תאריך התחלה *</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={e => handleChange('startDate', e.target.value)}
              required
            />
          </div>
          <div className="form-field">
            <label>תאריך סיום *</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={e => handleChange('endDate', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-field">
          <label>תיאור</label>
          <textarea
            value={formData.description}
            onChange={e => handleChange('description', e.target.value)}
            rows="3"
          />
        </div>
      </>
    );
  }

  function getTitle() {
    const titles = {
      SLOT: isEditing ? 'עריכת סלוט' : 'יצירת סלוט חדש',
      CALENDAR_EVENT: isEditing ? 'עריכת אירוע' : 'יצירת אירוע חדש',
      TIME_BLOCK: isEditing ? 'עריכת חסימה' : 'יצירת חסימת זמן',
      VACATION: isEditing ? 'עריכת חופשה' : 'יצירת חופשה',
    };
    return titles[eventType] || 'אירוע';
  }

  function getIcon() {
    const icons = {
      SLOT: '🟢',
      CALENDAR_EVENT: '⚪',
      TIME_BLOCK: '🟡',
      VACATION: '🟣',
    };
    return icons[eventType] || '⚪';
  }

  return (
    <div className="modal-backdrop-v2" onClick={onClose}>
      <div className="modal-v2 create-edit-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close-v2" onClick={onClose}>✕</button>

        <div className="create-edit-header">
          <span className="create-edit-icon">{getIcon()}</span>
          <h2 className="create-edit-title">{getTitle()}</h2>
        </div>

        <form onSubmit={handleSubmit} className="create-edit-form">
          {eventType === 'SLOT' && renderSlotForm()}
          {eventType === 'CALENDAR_EVENT' && renderCalendarEventForm()}
          {eventType === 'TIME_BLOCK' && renderTimeBlockForm()}
          {eventType === 'VACATION' && renderVacationForm()}

          {error && (
            <div className="create-edit-error">{error}</div>
          )}

          <div className="create-edit-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              ביטול
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'שומר...' : isEditing ? 'עדכן' : 'צור'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateEditEventModal;
