import React from 'react';
import logger from '../utils/logger';

/**
 * Error Boundary component for React error handling
 * Catches errors in child components and displays fallback UI
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    logger.error('React Error Boundary caught an error:', {
      error: error.toString(),
      componentStack: errorInfo.componentStack
    });

    this.setState({
      error,
      errorInfo
    });
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          margin: '20px',
          border: '2px solid #ff0000',
          borderRadius: '8px',
          backgroundColor: '#ffe0e0',
          color: '#cc0000',
          fontFamily: 'monospace'
        }}>
          <h2>⚠️ Something went wrong</h2>
          <p>The application encountered an unexpected error.</p>
          
          {process.env.NODE_ENV === 'development' && (
            <>
              <details style={{ marginTop: '10px', whiteSpace: 'pre-wrap' }}>
                <summary>Error Details (Development Only)</summary>
                <p>{this.state.error && this.state.error.toString()}</p>
                <p>{this.state.errorInfo && this.state.errorInfo.componentStack}</p>
              </details>
            </>
          )}

          <button
            onClick={this.resetError}
            style={{
              marginTop: '10px',
              padding: '10px 20px',
              backgroundColor: '#0066cc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
