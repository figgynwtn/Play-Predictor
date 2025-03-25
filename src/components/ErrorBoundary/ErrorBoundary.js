import React from 'react';
import './ErrorBoundary.css';
import BasicPredictor from '../BasicPredictor/BasicPredictor';

export default class ErrorBoundary extends React.Component {
  state = { 
    hasError: false,
    error: null,
    errorInfo: null 
  };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-content">
            <h3>Advanced Predictor Unavailable</h3>
            <p className="error-message">
              {this.state.error?.message || 'Unknown error occurred'}
            </p>
            {this.props.fallback || <BasicPredictor />}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}