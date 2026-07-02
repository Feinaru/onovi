import './ServiceRecipientComingSoon.css';

export default function ServiceRecipientComingSoon({ setView }) {
  return (
    <div className="coming-soon">
      <div className="coming-soon-container">
        <div className="coming-soon-icon">🚀</div>
        <h1 className="coming-soon-title">בקרוב...</h1>
        <p className="coming-soon-description">
          הרשמה למקבלי שירות תהיה זמינה בקרוב
        </p>
        <button
          className="btn-primary btn-lg"
          onClick={() => setView('landing')}
        >
          חזרה לדף הבית
        </button>
      </div>
    </div>
  );
}
