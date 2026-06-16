import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-950 text-white p-6 flex flex-col items-center justify-center">
          <div className="max-w-xl w-full bg-red-950/30 border border-red-700/50 rounded-xl p-6 shadow-2xl">
            <h1 className="text-3xl font-bold text-red-500 mb-4">Something went wrong 🔴</h1>
            <p className="text-gray-300 mb-4 font-semibold">
              The application crashed. Here is the error information:
            </p>
            <div className="bg-black/40 rounded-lg p-4 font-mono text-sm text-red-400 overflow-auto max-h-60 mb-6 border border-red-900/50">
              {this.state.error?.toString()}
            </div>
            {this.state.errorInfo?.componentStack && (
              <details className="cursor-pointer group">
                <summary className="text-gray-400 text-sm hover:text-gray-300 transition-colors mb-2 select-none">
                  Show component stack trace
                </summary>
                <pre className="bg-black/20 rounded p-4 font-mono text-xs text-gray-500 overflow-auto max-h-60 border border-gray-800">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-6 w-full btn bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-all"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
