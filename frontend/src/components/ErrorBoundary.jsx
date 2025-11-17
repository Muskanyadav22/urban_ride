import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          background: '#ffebee',
          borderRadius: '8px',
          margin: '20px'
        }}>
          <h2 style={{ color: '#c62828' }}>❌ Something went wrong</h2>
          <p style={{ color: '#d32f2f', marginBottom: '15px' }}>
            {this.state.error?.message}
          </p>
          <pre style={{
            textAlign: 'left',
            background: '#fff',
            padding: '15px',
            borderRadius: '4px',
            overflow: 'auto',
            color: '#666',
            fontSize: '12px'
          }}>
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '15px',
              padding: '10px 20px',
              background: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
