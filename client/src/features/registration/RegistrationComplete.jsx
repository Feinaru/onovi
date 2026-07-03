import './RegistrationComplete.css';

/**
 * Registration Complete Placeholder
 *
 * Final screen after consent submission
 * Shows success message and returns to home
 */
export default function RegistrationComplete({ setView }) {
  function handleReturnHome() {
    setView('landing');
  }

  return (
    <div className="registration-complete">
      <div className="registration-complete-container">
        <div className="complete-icon">✅</div>
        <h1 className="complete-title">הבקשה התקבלה</h1>
        <p className="complete-message">
          פרטי נותן השירות והמסמכים שהועלו ייבדקו על ידי צוות Lomea.
          <br />
          לאחר האישור, הפרופיל יוכל להופיע באתר.
        </p>
        <button
          type="button"
          className="btn-primary btn-lg"
          onClick={handleReturnHome}
        >
          חזרה לדף הבית
        </button>
      </div>
    </div>
  );
}
