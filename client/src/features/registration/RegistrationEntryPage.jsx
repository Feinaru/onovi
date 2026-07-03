import { useState } from 'react';
import './RegistrationEntryPage.css';

export default function RegistrationEntryPage({ setView }) {
  const [selectedType, setSelectedType] = useState(null);

  const handleSelectServiceProvider = () => {
    setSelectedType('SERVICE_PROVIDER');
    // Navigate to service provider registration flow (screen 2)
    setView('register-service-provider');
  };

  const handleSelectServiceRecipient = () => {
    setSelectedType('SERVICE_RECIPIENT');
    // Navigate to service recipient placeholder
    setView('register-service-recipient');
  };

  return (
    <div className="registration-entry">
      <div className="registration-entry-container">
        <div className="registration-entry-header">
          <h1 className="registration-entry-title">הצטרפו ל-Lomea</h1>
          <p className="registration-entry-subtitle">בחרו את סוג החשבון המתאים לכם</p>
        </div>

        <div className="registration-entry-cards">
          {/* Service Recipient Card */}
          <div
            className={`registration-card ${selectedType === 'SERVICE_RECIPIENT' ? 'registration-card-selected' : ''}`}
            onClick={handleSelectServiceRecipient}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSelectServiceRecipient();
              }
            }}
            tabIndex={0}
            role="button"
            aria-label="בחר חשבון מקבל שירות"
          >
            <div className="registration-card-icon">🔍</div>
            <h2 className="registration-card-title">מקבל שירות</h2>
            <p className="registration-card-description">
              הרשמה על מנת לחפש ולהזמין שירותים
            </p>
            <button className="registration-card-button btn-primary">
              המשך
            </button>
          </div>

          {/* Service Provider Card */}
          <div
            className={`registration-card ${selectedType === 'SERVICE_PROVIDER' ? 'registration-card-selected' : ''}`}
            onClick={handleSelectServiceProvider}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSelectServiceProvider();
              }
            }}
            tabIndex={0}
            role="button"
            aria-label="בחר חשבון נותן שירות"
          >
            <div className="registration-card-icon">💼</div>
            <h2 className="registration-card-title">נותן שירות</h2>
            <p className="registration-card-description">
              הרשמה על מנת להציע שירותים דרך הפלטפורמה
            </p>
            <button className="registration-card-button btn-primary">
              המשך
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
