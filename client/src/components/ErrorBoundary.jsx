import { Component } from 'react';

/**
 * Error Boundary - Catches React errors and prevents white screen
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);

    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          backgroundColor: '#FEF2F2',
          border: '1px solid #FCA5A5',
          borderRadius: '8px',
          margin: '20px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ color: '#991B1B', marginBottom: '12px' }}>משהו השתבש</h2>
          <p style={{ color: '#7F1D1D', marginBottom: '20px' }}>
            {this.state.error?.message || 'אירעה שגיאה בלתי צפויה'}
          </p>
          <button
            onClick={this.handleReset}
            style={{
              padding: '12px 24px',
              backgroundColor: '#DC2626',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            נסה שוב
          </button>
          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <details style={{ marginTop: '20px', textAlign: 'left' }}>
              <summary style={{ cursor: 'pointer', color: '#991B1B' }}>
                פרטים טכניים (development only)
              </summary>
              <pre style={{
                backgroundColor: '#FEE2E2',
                padding: '12px',
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '12px',
                color: '#7F1D1D'
              }}>
                {this.state.error?.toString()}
                {'\n\n'}
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
