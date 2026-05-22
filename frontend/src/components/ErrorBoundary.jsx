import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-50 border border-red-200 rounded-2xl text-center">
          <div className="text-4xl mb-3">💥</div>
          <h3 className="font-bold text-red-800 mb-1">Something went wrong</h3>
          <p className="text-sm text-red-600 mb-4">{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()} className="px-5 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700">
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;