import React from 'react';
import Button from '../shared/ui/Button';
import Card from '../shared/ui/Card';
import Badge from '../shared/ui/Badge';
import Section from '../shared/ui/Section';

export default function LandingPage({ setView }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F5F5F4 0%, #FAFAF9 100%)',
    }}>
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #009999 0%, #007A7A 100%)',
        color: 'white',
        padding: '4rem 1.5rem',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ marginBottom: '2rem' }}>
            <img
              src="/assets/onovi-logo.png"
              alt="Onovi"
              style={{
                maxWidth: '280px',
                height: 'auto',
                filter: 'brightness(0) invert(1)',
              }}
            />
          </div>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: '700',
            marginBottom: '1rem',
            lineHeight: '1.2',
          }}>
            התור שלך, בזמן שלך
          </h1>
          <p style={{
            fontSize: '1.25rem',
            marginBottom: '3rem',
            opacity: '0.95',
            lineHeight: '1.6',
            maxWidth: '600px',
            margin: '0 auto 3rem',
          }}>
            מצאו תור פנוי להיום, חסכו עד 50%, והזמינו בלי טלפונים.<br />
            אלפי תורים זמינים מעסקים מובילים.
          </p>
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => setView('customer')}
              style={{
                minWidth: '200px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
              }}
            >
              🔍 מצא תור עכשיו
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => setView('auth')}
              style={{
                minWidth: '200px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: 'white',
                backdropFilter: 'blur(10px)',
              }}
            >
              הרשמת עסק
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 1.5rem' }}>
        <Section
          title="איך זה עובד?"
          description="שלושה צעדים פשוטים לתור המושלם"
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem',
          }}>
            {/* Step 1 */}
            <Card variant="elevated" padding="lg">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '1rem',
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #009999, #007A7A)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  marginLeft: '1rem',
                }}>
                  1
                </div>
                <div style={{ fontSize: '3rem' }}>📍</div>
              </div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                marginBottom: '0.75rem',
                color: '#1C1917',
              }}>
                בחרו שירות ומיקום
              </h3>
              <p style={{ color: '#78716C', lineHeight: '1.6' }}>
                ספרות שיער, מכוני יופי, מוסכים, קליניקות ועוד — כל השירותים באזור שלכם
              </p>
            </Card>

            {/* Step 2 */}
            <Card variant="elevated" padding="lg">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '1rem',
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #009999, #007A7A)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  marginLeft: '1rem',
                }}>
                  2
                </div>
                <div style={{ fontSize: '3rem' }}>⚡</div>
              </div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                marginBottom: '0.75rem',
                color: '#1C1917',
              }}>
                ראו תורים פנויים
              </h3>
              <p style={{ color: '#78716C', lineHeight: '1.6' }}>
                תורים זמינים להיום ולמחר, עם הנחות מיוחדות עד 50%
              </p>
              <Badge variant="danger" size="md" style={{ marginTop: '0.75rem' }}>
                🔥 הנחות עד 50%
              </Badge>
            </Card>

            {/* Step 3 */}
            <Card variant="elevated" padding="lg">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '1rem',
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #009999, #007A7A)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  marginLeft: '1rem',
                }}>
                  3
                </div>
                <div style={{ fontSize: '3rem' }}>✅</div>
              </div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                marginBottom: '0.75rem',
                color: '#1C1917',
              }}>
                הזמינו ותקבלו אישור
              </h3>
              <p style={{ color: '#78716C', lineHeight: '1.6' }}>
                מלאו פרטים במהירות והעסק יאשר תוך דקות — פשוט וחכם
              </p>
            </Card>
          </div>
        </Section>

        {/* For Businesses */}
        <Section
          title="למה עסקים בוחרים ב-Onovi?"
          description="הפלטפורמה המובילה לניהול תורים ולקוחות"
          spacing="lg"
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.5rem',
            marginBottom: '3rem',
          }}>
            {/* Feature 1 */}
            <Card variant="bordered" padding="lg">
              <div style={{
                fontSize: '3rem',
                marginBottom: '1rem',
              }}>
                📅
              </div>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                marginBottom: '0.5rem',
                color: '#1C1917',
              }}>
                מלאו תורים ריקים
              </h3>
              <p style={{ color: '#78716C', lineHeight: '1.6', fontSize: '0.875rem' }}>
                תורים שמתבטלים או נשארים ריקים מתמלאים אוטומטית על ידי לקוחות חדשים
              </p>
            </Card>

            {/* Feature 2 */}
            <Card variant="bordered" padding="lg">
              <div style={{
                fontSize: '3rem',
                marginBottom: '1rem',
              }}>
                💰
              </div>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                marginBottom: '0.5rem',
                color: '#1C1917',
              }}>
                הגדילו הכנסות
              </h3>
              <p style={{ color: '#78716C', lineHeight: '1.6', fontSize: '0.875rem' }}>
                הפכו ביטולי תורים להזדמנות למכור במחיר מיוחד והגדילו מחזור
              </p>
            </Card>

            {/* Feature 3 */}
            <Card variant="bordered" padding="lg">
              <div style={{
                fontSize: '3rem',
                marginBottom: '1rem',
              }}>
                👥
              </div>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                marginBottom: '0.5rem',
                color: '#1C1917',
              }}>
                צמחו עם לקוחות חדשים
              </h3>
              <p style={{ color: '#78716C', lineHeight: '1.6', fontSize: '0.875rem' }}>
                חשיפה לאלפי לקוחות פוטנציאליים שמחפשים בדיוק את השירות שלכם
              </p>
            </Card>

            {/* Feature 4 */}
            <Card variant="bordered" padding="lg">
              <div style={{
                fontSize: '3rem',
                marginBottom: '1rem',
              }}>
                ⚙️
              </div>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                marginBottom: '0.5rem',
                color: '#1C1917',
              }}>
                נהלו בקלות
              </h3>
              <p style={{ color: '#78716C', lineHeight: '1.6', fontSize: '0.875rem' }}>
                פאנל ניהול מקצועי לשירותים, תורים והזמנות — הכל במקום אחד
              </p>
            </Card>
          </div>

          <div style={{ textAlign: 'center' }}>
            <Button
              variant="primary"
              size="lg"
              onClick={() => setView('auth')}
              style={{ minWidth: '250px' }}
            >
              💼 התחילו בחינם עכשיו
            </Button>
          </div>
        </Section>
      </div>

      {/* Footer */}
      <footer style={{
        background: 'white',
        borderTop: '1px solid #E7E5E4',
        padding: '2rem 1.5rem',
        marginTop: '4rem',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <div>
            <img
              src="/assets/onovi-logo.png"
              alt="Onovi"
              style={{ height: '32px', marginBottom: '0.5rem' }}
            />
            <p style={{ color: '#78716C', fontSize: '0.875rem' }}>
              התור שלך, בזמן שלך
            </p>
          </div>
          <Button
            variant="secondary"
            size="md"
            onClick={() => setView('auth')}
          >
            התחבר / הרשם
          </Button>
        </div>
      </footer>
    </div>
  );
}
