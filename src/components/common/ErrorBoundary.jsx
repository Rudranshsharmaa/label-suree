import React from 'react';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';
import { Button } from './Button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[LabelSure ErrorBoundary Captured Crash]:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[60vh] flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-[#FAF9F5] border border-[#123C2A]/15 shadow-medium text-center space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-[#FBEBEB] text-[#B94A48] flex items-center justify-center mx-auto shadow-xs">
              <AlertCircle className="w-7 h-7" aria-hidden="true" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-[#17231C]">
                Something went wrong
              </h2>
              <p className="text-xs sm:text-sm text-[#47544C] leading-relaxed">
                Something went wrong while rendering this section. Please try again or return to the dashboard.
              </p>
            </div>

            {/* Error Detail in Dev or safe message */}
            {this.state.error && (
              <div className="p-3.5 rounded-xl bg-white border border-[#123C2A]/10 text-left font-mono text-[11px] text-[#B94A48] max-h-32 overflow-y-auto">
                <p className="font-bold">{this.state.error.name}: {this.state.error.message}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={this.handleReset}
                icon={RotateCcw}
                className="w-full sm:w-auto font-bold px-6 shadow-xs"
              >
                Try Again
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={this.handleGoHome}
                icon={Home}
                className="w-full sm:w-auto font-bold px-6"
              >
                Go to Homepage
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
