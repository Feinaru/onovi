import './ConsentPlaceholder.css';

export default function ConsentPlaceholder({ setView }) {
  return (
    <div className="consent-placeholder">
      <div className="consent-placeholder-container">
        <div className="consent-placeholder-icon">✅</div>
        <h1 className="consent-placeholder-title">הסכמות ואישורים</h1>
        <p className="consent-placeholder-description">
          מסך ההסכמות והאישורים יבנה בשלב הבא
        </p>
        <div className="consent-placeholder-info">
          <p>במסך זה יהיה ניתן לאשר:</p>
          <ul>
            <li>תנאי שימוש</li>
            <li>מדיניות פרטיות</li>
            <li>אישור קבלת עדכונים</li>
            <li>הסכמה למעקב אחר מיקום (אופציונלי)</li>
          </ul>
        </div>
        <div className="consent-placeholder-actions">
          <button
            className="btn-primary btn-lg"
            onClick={() => setView('register-document-upload')}
          >
            חזרה להעלאת מסמכים
          </button>
        </div>
      </div>
    </div>
  );
}
