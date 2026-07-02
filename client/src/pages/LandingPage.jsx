export default function LandingPage({ setView }) {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-hero-content">
          <div className="landing-logo">
            <img src="/assets/onovi-logo.png" alt="Onovi" style={{ maxWidth: '280px', height: 'auto' }} />
          </div>
          <h2 className="landing-tagline">התור שלך, בזמן שלך</h2>
          <p className="landing-description">
            מצאו תור פנוי להיום, חסכו עד 50%, והזמינו בלי טלפונים.<br />
            אלפי תורים זמינים מעסקים מובילים.
          </p>
          <div className="landing-cta-group">
            <button className="btn-primary btn-lg landing-cta-primary" onClick={() => setView('customer')}>
              🔍 מצא תור עכשיו
            </button>
            <button className="btn-outline btn-lg landing-cta-secondary" onClick={() => setView('register-entry')}>
              הרשמת עסק
            </button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="landing-section">
        <div className="landing-container">
          <h2 className="landing-section-title">איך זה עובד?</h2>
          <div className="landing-steps">
            <div className="landing-step">
              <div className="landing-step-number">1</div>
              <div className="landing-step-icon">📍</div>
              <h3 className="landing-step-title">בחרו שירות ומיקום</h3>
              <p className="landing-step-description">
                ספרות שיער, מכוני יופי, מוסכים, קליניקות ועוד — כל השירותים באזור שלכם
              </p>
            </div>

            <div className="landing-step">
              <div className="landing-step-number">2</div>
              <div className="landing-step-icon">⚡</div>
              <h3 className="landing-step-title">ראו תורים פנויים</h3>
              <p className="landing-step-description">
                תורים זמינים להיום ולמחר, עם הנחות מיוחדות עד 50%
              </p>
            </div>

            <div className="landing-step">
              <div className="landing-step-number">3</div>
              <div className="landing-step-icon">✅</div>
              <h3 className="landing-step-title">הזמינו ותקבלו אישור</h3>
              <p className="landing-step-description">
                מלאו פרטים במהירות והעסק יאשר תוך דקות — פשוט וחכם
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* For Businesses */}
      <section className="landing-section landing-section-alt">
        <div className="landing-container">
          <h2 className="landing-section-title">למה עסקים בוחרים ב-Onovi?</h2>
          <div className="landing-features">
            <div className="landing-feature">
              <div className="landing-feature-icon">📅</div>
              <h3 className="landing-feature-title">מלאו תורים ריקים</h3>
              <p className="landing-feature-description">
                תורים שמתבטלים או נשארים ריקים מתמלאים אוטומטית על ידי לקוחות חדשים
              </p>
            </div>

            <div className="landing-feature">
              <div className="landing-feature-icon">💰</div>
              <h3 className="landing-feature-title">הגדילו הכנסות</h3>
              <p className="landing-feature-description">
                הפכו ביטולי תורים להזדמנות למכור במחיר מיוחד והגדילו מחזור
              </p>
            </div>

            <div className="landing-feature">
              <div className="landing-feature-icon">👥</div>
              <h3 className="landing-feature-title">צמחו עם לקוחות חדשים</h3>
              <p className="landing-feature-description">
                חשיפה לאלפי לקוחות פוטנציאליים שמחפשים בדיוק את השירות שלכם
              </p>
            </div>

            <div className="landing-feature">
              <div className="landing-feature-icon">⚙️</div>
              <h3 className="landing-feature-title">נהלו בקלות</h3>
              <p className="landing-feature-description">
                פאנל ניהול מקצועי לשירותים, תורים והזמנות — הכל במקום אחד
              </p>
            </div>
          </div>

          <div className="landing-business-cta">
            <button className="btn-primary btn-lg" onClick={() => setView('register-entry')}>
              💼 התחילו בחינם עכשיו
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="landing-footer-content">
            <div className="landing-footer-brand">
              <div className="landing-logo-small">
                <img src="/assets/onovi-logo.png" alt="Onovi" style={{ height: '32px' }} />
              </div>
              <p>התור שלך, בזמן שלך</p>
            </div>
            <button className="btn-secondary" onClick={() => setView('auth')}>
              התחבר / הרשם
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
