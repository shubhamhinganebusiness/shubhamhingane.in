import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught application render error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 font-sans">
          <div className="max-w-md w-full p-6 bg-white dark:bg-zinc-800 rounded-2xl shadow-xl border border-slate-200 dark:border-zinc-700 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 font-black text-xl">
              !
            </div>
            <h2 className="text-xl font-bold mb-2">Display Error Detected</h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mb-4">
              A temporary component render issue occurred. You can safely reload the view.
            </p>
            <pre className="text-xs text-left bg-slate-100 dark:bg-zinc-900 p-3 rounded-lg overflow-x-auto text-red-600 dark:text-red-400 mb-4 max-h-36">
              {this.state.error?.message || 'Component failed to mount.'}
            </pre>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full py-2.5 px-4 bg-[#ff014f] hover:bg-[#d90042] text-white text-sm font-bold rounded-xl transition shadow-md cursor-pointer"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
