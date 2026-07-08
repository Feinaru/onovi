import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

import { clearSession, getUser, setSession } from './api';
import AuthPanel from './components/AuthPanel';
import CustomerPage from './features/customer/CustomerPage';
import MyBookingsPage from './features/customer/pages/MyBookingsPage';
import BusinessPage from './features/business/BusinessPage';
import ServiceProviderWorkspace from './features/service-provider/ServiceProviderWorkspace';
import AdminPage from './pages/AdminPage';
import LandingPage from './pages/LandingPage';
import CRMPage from './pages/CRMPage';
import RegistrationEntryPage from './features/registration/RegistrationEntryPage';
import ServiceRecipientComingSoon from './features/registration/ServiceRecipientComingSoon';
import ServiceProviderRegistrationPlaceholder from './features/registration/ServiceProviderRegistrationPlaceholder';
import FieldSelectionPage from './features/registration/FieldSelectionPage';
import ProfessionSelectionPage from './features/registration/ProfessionSelectionPage';
import ServiceSelectionPage from './features/registration/ServiceSelectionPage';
import ServiceGroupSummary from './features/registration/ServiceGroupSummary';
import BusinessDetailsPage from './features/registration/BusinessDetailsPage';
import DocumentUploadPage from './features/registration/DocumentUploadPage';
import ConsentScreen from './features/registration/ConsentScreen';
import RegistrationComplete from './features/registration/RegistrationComplete';

import AppLayout from './layouts/AppLayout';
import PublicLayout from './layouts/PublicLayout';
import Toast from './shared/ui/Toast';
import UnauthorizedAccess from './shared/ui/UnauthorizedAccess';
import { getNavItems, getHomeView, isAuthorized } from './shared/hooks/useNavigation';

import './styles.css';

function App() {
  const [view, setView] = useState('landing');
  const [user, setUser] = useState(getUser());
  const [message, setMessage] = useState('');
  // Current service group being created
  const [currentFieldId, setCurrentFieldId] = useState(null);
  const [currentFieldName, setCurrentFieldName] = useState('');
  const [currentProfessionId, setCurrentProfessionId] = useState(null);
  const [currentProfessionName, setCurrentProfessionName] = useState('');
  const [currentServiceIds, setCurrentServiceIds] = useState([]);

  // Collection of all service groups
  const [serviceGroups, setServiceGroups] = useState([]);

  // Business details
  const [businessDetails, setBusinessDetails] = useState(null);

  // Registration data (user/business created after business details)
  const [registrationData, setRegistrationData] = useState(null);

  // Uploaded documents
  const [uploadedDocuments, setUploadedDocuments] = useState({});

  // Auto-route based on user role on mount
  useEffect(() => {
    if (user) {
      setView(getHomeView(user));
    } else {
      setView('landing');
    }
  }, []);

  function logout() {
    clearSession();
    setUser(null);
    setView('landing');
    showMessage('התנתקת בהצלחה');
  }

  function handleLogin(u, token) {
    setSession(token, u);
    setUser(u);
    showMessage('התחברת בהצלחה');
    setView(getHomeView(u));
  }

  function showMessage(msg) {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  }

  function handleNavigate(newView) {
    setView(newView);
  }

  function handleNavigateHome() {
    setView(user ? getHomeView(user) : 'landing');
  }

  // Service Group management functions
  function handleCreateServiceGroup(services) {
    const newGroup = {
      fieldId: currentFieldId,
      fieldName: currentFieldName,
      professionId: currentProfessionId,
      professionName: currentProfessionName,
      services: services
    };
    setServiceGroups([...serviceGroups, newGroup]);
    setCurrentServiceIds(services.map(s => s.id));
  }

  function handleAddAnotherServiceGroup() {
    // Reset current service group state
    setCurrentFieldId(null);
    setCurrentFieldName('');
    setCurrentProfessionId(null);
    setCurrentProfessionName('');
    setCurrentServiceIds([]);
    // Navigate back to field selection
    setView('register-field-selection');
  }

  function handleEditServiceGroup(serviceGroup) {
    // Load the service group into current state
    setCurrentFieldId(serviceGroup.fieldId);
    setCurrentFieldName(serviceGroup.fieldName);
    setCurrentProfessionId(serviceGroup.professionId);
    setCurrentProfessionName(serviceGroup.professionName);
    setCurrentServiceIds(serviceGroup.services.map(s => s.id));
    // Remove from array (will be re-added when saved)
    setServiceGroups(serviceGroups.filter(g =>
      !(g.fieldId === serviceGroup.fieldId &&
        g.professionId === serviceGroup.professionId &&
        JSON.stringify(g.services) === JSON.stringify(serviceGroup.services))
    ));
    // Navigate to service selection
    setView('register-service-selection');
  }

  function handleRemoveServiceGroup(serviceGroup) {
    setServiceGroups(serviceGroups.filter(g =>
      !(g.fieldId === serviceGroup.fieldId &&
        g.professionId === serviceGroup.professionId &&
        JSON.stringify(g.services) === JSON.stringify(serviceGroup.services))
    ));
  }

  function handleContinueRegistration() {
    setView('register-business-details');
  }

  const navItems = getNavItems(user);

  // Show landing page for logged-out users
  if (!user && view === 'landing') {
    return (
      <>
        <LandingPage setView={setView} />
        <Toast message={message} />
      </>
    );
  }

  // Show customer page for non-logged-in users (browse/search/book)
  if (!user && view === 'customer') {
    return (
      <>
        <PublicLayout
          user={user}
          onNavigate={handleNavigate}
          onLogout={logout}
          showBackButton={true}
        >
          <CustomerPage user={user} setView={setView} />
        </PublicLayout>
        <Toast message={message} />
      </>
    );
  }

  // Show auth page
  if (view === 'auth') {
    return (
      <>
        <PublicLayout
          user={user}
          onNavigate={handleNavigate}
          onLogout={logout}
          showBackButton={!user}
        >
          <AuthPanel onLogin={handleLogin} />
        </PublicLayout>
        <Toast message={message} />
      </>
    );
  }

  // Show registration entry page
  if (view === 'register-entry') {
    return (
      <>
        <PublicLayout
          user={user}
          onNavigate={handleNavigate}
          onLogout={logout}
          showBackButton={true}
        >
          <RegistrationEntryPage setView={setView} />
        </PublicLayout>
        <Toast message={message} />
      </>
    );
  }

  // Show service recipient coming soon
  if (view === 'register-service-recipient') {
    return (
      <>
        <PublicLayout
          user={user}
          onNavigate={handleNavigate}
          onLogout={logout}
          showBackButton={true}
        >
          <ServiceRecipientComingSoon setView={setView} />
        </PublicLayout>
        <Toast message={message} />
      </>
    );
  }

  // Show service provider registration placeholder (OLD - for backward compatibility)
  if (view === 'register-service-provider') {
    return (
      <>
        <PublicLayout
          user={user}
          onNavigate={handleNavigate}
          onLogout={logout}
          showBackButton={true}
        >
          <FieldSelectionPage
            setView={setView}
            onFieldSelected={setCurrentFieldId}
            onFieldNameSelected={setCurrentFieldName}
          />
        </PublicLayout>
        <Toast message={message} />
      </>
    );
  }

  // Show field selection
  if (view === 'register-field-selection') {
    return (
      <>
        <PublicLayout
          user={user}
          onNavigate={handleNavigate}
          onLogout={logout}
          showBackButton={true}
        >
          <FieldSelectionPage
            setView={setView}
            onFieldSelected={setCurrentFieldId}
            onFieldNameSelected={setCurrentFieldName}
          />
        </PublicLayout>
        <Toast message={message} />
      </>
    );
  }

  // Show profession selection
  if (view === 'register-profession-selection') {
    return (
      <>
        <PublicLayout
          user={user}
          onNavigate={handleNavigate}
          onLogout={logout}
          showBackButton={true}
        >
          <ProfessionSelectionPage
            selectedFieldId={currentFieldId}
            selectedFieldName={currentFieldName}
            setView={setView}
            onProfessionSelected={setCurrentProfessionId}
            onProfessionNameSelected={setCurrentProfessionName}
          />
        </PublicLayout>
        <Toast message={message} />
      </>
    );
  }

  // Show service selection
  if (view === 'register-service-selection') {
    return (
      <>
        <PublicLayout
          user={user}
          onNavigate={handleNavigate}
          onLogout={logout}
          showBackButton={true}
        >
          <ServiceSelectionPage
            selectedFieldId={currentFieldId}
            selectedFieldName={currentFieldName}
            selectedProfessionId={currentProfessionId}
            selectedProfessionName={currentProfessionName}
            setView={setView}
            onServicesSelected={handleCreateServiceGroup}
          />
        </PublicLayout>
        <Toast message={message} />
      </>
    );
  }

  // Show service group summary
  if (view === 'register-service-group-summary') {
    return (
      <>
        <PublicLayout
          user={user}
          onNavigate={handleNavigate}
          onLogout={logout}
          showBackButton={false}
        >
          <ServiceGroupSummary
            serviceGroups={serviceGroups}
            onAddAnother={handleAddAnotherServiceGroup}
            onContinue={handleContinueRegistration}
            onEdit={handleEditServiceGroup}
            onRemove={handleRemoveServiceGroup}
          />
        </PublicLayout>
        <Toast message={message} />
      </>
    );
  }

  // Show business details
  if (view === 'register-business-details') {
    return (
      <>
        <PublicLayout
          user={user}
          onNavigate={handleNavigate}
          onLogout={logout}
          showBackButton={true}
        >
          <BusinessDetailsPage
            businessDetails={businessDetails}
            serviceGroups={serviceGroups}
            onBusinessDetailsChange={setBusinessDetails}
            onRegistrationComplete={setRegistrationData}
            setView={setView}
          />
        </PublicLayout>
        <Toast message={message} />
      </>
    );
  }

  // Show document upload
  if (view === 'register-document-upload') {
    return (
      <>
        <PublicLayout
          user={user}
          onNavigate={handleNavigate}
          onLogout={logout}
          showBackButton={true}
        >
          <DocumentUploadPage
            serviceGroups={serviceGroups}
            registrationData={registrationData}
            uploadedDocuments={uploadedDocuments}
            onDocumentsChange={setUploadedDocuments}
            setView={setView}
          />
        </PublicLayout>
        <Toast message={message} />
      </>
    );
  }

  // Show consent screen
  if (view === 'register-consent') {
    return (
      <>
        <ConsentScreen
          serviceGroups={serviceGroups}
          registrationData={registrationData}
          setView={setView}
        />
        <Toast message={message} />
      </>
    );
  }

  // Show registration complete
  if (view === 'register-complete') {
    return (
      <>
        <RegistrationComplete setView={setView} />
        <Toast message={message} />
      </>
    );
  }

  // Service Provider Workspace has its own layout (not wrapped in AppLayout)
  if (user && view === 'service-provider') {
    return (
      <>
        <ServiceProviderWorkspace user={user} setView={setView} onLogout={logout} />
        <Toast message={message} />
      </>
    );
  }

  // Show app shell with role-based navigation for logged-in users (Customer, Business, Admin, CRM)
  return (
    <>
      <AppLayout
        user={user}
        view={view}
        navItems={navItems}
        onNavigate={handleNavigate}
        onLogout={logout}
      >
        {/* Customer View */}
        {view === 'customer' && <CustomerPage user={user} setView={setView} />}

        {/* My Bookings View */}
        {view === 'my-bookings' && user.role === 'CUSTOMER' && <MyBookingsPage setView={setView} />}

        {/* Business View */}
        {view === 'business' && <BusinessPage user={user} setView={setView} />}

        {/* Admin View */}
        {view === 'admin' && user.role === 'ADMIN' && <AdminPage user={user} setView={setView} />}
        {view === 'admin' && user.role !== 'ADMIN' && (
          <UnauthorizedAccess onNavigateHome={handleNavigateHome} />
        )}

        {/* CRM View */}
        {view === 'crm' && user.role === 'ADMIN' && <CRMPage user={user} setView={setView} />}
        {view === 'crm' && user.role !== 'ADMIN' && (
          <UnauthorizedAccess
            message="ה-CRM מיועד לשימוש מנהלים בלבד"
            onNavigateHome={handleNavigateHome}
          />
        )}
      </AppLayout>

      <Toast message={message} />
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
