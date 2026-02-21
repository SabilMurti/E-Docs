import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)] p-4">
          <div className="max-w-md w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-2xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-[var(--color-error-light)] rounded-full flex items-center justify-center">
              <AlertTriangle size={32} className="text-[var(--color-error)]" />
            </div>
            <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
              Something went wrong
            </h1>
            <p className="text-[var(--color-text-secondary)] mb-6">
              Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-accent-hover)]"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
