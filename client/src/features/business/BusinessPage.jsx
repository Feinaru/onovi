import React, { useState, useEffect } from 'react';
import { useBusinessData } from './hooks/useBusinessData';
import { useBusinessForms } from './hooks/useBusinessForms';

import DashboardTab from './tabs/DashboardTab';
import ServicesTab from './tabs/ServicesTab';
import SlotsTab from './tabs/SlotsTab';
import BookingsTab from './tabs/BookingsTab';
import SettingsTab from './tabs/SettingsTab';

/**
 * BusinessPage - Main business management page
 * Orchestrates tabs and business data management
 */
function BusinessPage({ user, setView }) {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Custom hooks for data and forms
  const {
    businesses,
    bookings,
    categories,
    services,
    slots,
    msg,
    setMsg,
    showMessage,
    reload
  } = useBusinessData(user);

  const {
    businessForm,
    setBusinessForm,
    serviceForm,
    setServiceForm,
    slotForm,
    setSlotForm,
    editingBusiness,
    setEditingBusiness,
    editingService,
    setEditingService,
    editingSlot,
    setEditingSlot,
    resetBusinessForm
  } = useBusinessForms(categories);

  // Update businessForm categoryId when categories load
  useEffect(() => {
    if (categories.length > 0 && businessForm.categoryId === 1) {
      setBusinessForm(prev => ({ ...prev, categoryId: categories[0].id }));
    }
  }, [categories]);

  // Authorization check
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

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">ניהול עסק</h1>
        <p className="page-description">ניהול מקצועי של השירותים, התורים וההזמנות שלך</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex" style={{ gap: 'var(--space-3)', marginBottom: 'var(--space-8)', flexWrap: 'wrap' }}>
        <button
          className={activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 דשבורד
        </button>
        <button
          className={activeTab === 'services' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveTab('services')}
        >
          🛎️ שירותים
        </button>
        <button
          className={activeTab === 'slots' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveTab('slots')}
        >
          📅 תורים
        </button>
        <button
          className={activeTab === 'bookings' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveTab('bookings')}
        >
          📋 הזמנות
        </button>
        <button
          className={activeTab === 'settings' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ הגדרות
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard' && (
        <DashboardTab
          businesses={businesses}
          services={services}
          slots={slots}
          bookings={bookings}
          setActiveTab={setActiveTab}
        />
      )}

      {activeTab === 'services' && (
        <ServicesTab
          businesses={businesses}
          services={services}
          serviceForm={serviceForm}
          setServiceForm={setServiceForm}
          editingService={editingService}
          setEditingService={setEditingService}
          showMessage={showMessage}
          reload={reload}
        />
      )}

      {activeTab === 'slots' && (
        <SlotsTab
          businesses={businesses}
          services={services}
          slots={slots}
          slotForm={slotForm}
          setSlotForm={setSlotForm}
          editingSlot={editingSlot}
          setEditingSlot={setEditingSlot}
          showMessage={showMessage}
          reload={reload}
        />
      )}

      {activeTab === 'bookings' && (
        <BookingsTab
          bookings={bookings}
          showMessage={showMessage}
          reload={reload}
        />
      )}

      {activeTab === 'settings' && (
        <SettingsTab
          businesses={businesses}
          categories={categories}
          businessForm={businessForm}
          setBusinessForm={setBusinessForm}
          editingBusiness={editingBusiness}
          setEditingBusiness={setEditingBusiness}
          showMessage={showMessage}
          reload={reload}
          resetBusinessForm={resetBusinessForm}
        />
      )}

      {/* Toast Notification */}
      {msg && <div className="toast">{msg}</div>}
    </div>
  );
}

export default BusinessPage;
