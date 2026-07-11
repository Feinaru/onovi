import React from 'react';

/**
 * ErrorBoundary - Catches React render errors and shows friendly fallback
 * Prevents white screen during demo
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '24px',
          background: '#f9fafb'
        }}>
          <div style={{
            maxWidth: '500px',
            padding: '32px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '64px',
              marginBottom: '16px'
            }}>
              ⚠️
            </div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '12px',
              color: '#1f2937'
            }}>
              משהו השתבש
            </h1>
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              marginBottom: '24px',
              lineHeight: '1.6'
            }}>
              רענן את העמוד או חזור למסך הראשי ונסה שוב.
            </p>
            <button
              onClick={this.handleReload}
              style={{
                padding: '12px 24px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#2563eb';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#3b82f6';
              }}
            >
              רענן עמוד
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
