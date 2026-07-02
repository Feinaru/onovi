import './ServiceProviderRegistrationPlaceholder.css';

export default function ServiceProviderRegistrationPlaceholder({ setView }) {
  return (
    <div className="sp-reg-placeholder">
      <div className="sp-reg-placeholder-container">
        <div className="sp-reg-placeholder-icon">🏗️</div>
        <h1 className="sp-reg-placeholder-title">הרשמת נותן שירות</h1>
        <p className="sp-reg-placeholder-description">
          מסך ההרשמה הבא יבנה בהמשך
        </p>
        <button
          className="btn-primary btn-lg"
          onClick={() => setView('register-entry')}
        >
          חזרה לבחירת סוג חשבון
        </button>
      </div>
    </div>
  );
}
