import './ProfessionSelectionPlaceholder.css';

export default function ProfessionSelectionPlaceholder({ setView }) {
  return (
    <div className="profession-placeholder">
      <div className="profession-placeholder-container">
        <div className="profession-placeholder-icon">🏗️</div>
        <h1 className="profession-placeholder-title">בחירת מקצועות</h1>
        <p className="profession-placeholder-description">
          מסך בחירת המקצועות יבנה בשלב הבא
        </p>
        <button
          className="btn-primary btn-lg"
          onClick={() => setView('register-field-selection')}
        >
          חזרה לבחירת תחום
        </button>
      </div>
    </div>
  );
}
