import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  t: Record<string, string>;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  // Explicitly declare props to avoid type errors in some environments
  readonly props: Props;
  
  public state: State = {
    hasError: false
  };

  constructor(props: Props) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const { t } = this.props;
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-slate-800 p-8 rounded-xl border border-red-500/30 shadow-2xl max-w-md w-full text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">{t['errorBoundaryTitle'] || 'Something went wrong'}</h1>
                <p className="text-slate-400 mb-8">{t['errorBoundaryDesc'] || 'The application encountered an unexpected error.'}</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                    <RefreshCw className="w-5 h-5" />
                    {t['reloadApp'] || 'Reload Application'}
                </button>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}