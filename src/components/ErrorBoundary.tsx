import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('WORLD TYCOON Caught Error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050811] text-slate-100 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full p-8 rounded-2xl bg-slate-900/90 border border-rose-500/40 shadow-2xl backdrop-blur-xl text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h1 className="text-2xl font-black tracking-tight text-white uppercase mb-2">
              WORLD TYCOON
            </h1>
            <p className="text-sm font-mono text-rose-300 font-semibold mb-4">
              Simulation Subsystem Alert
            </p>

            <p className="text-xs text-slate-400 mb-6 font-mono leading-relaxed bg-black/40 p-3 rounded-lg border border-slate-800 text-left overflow-auto max-h-32">
              {this.state.error?.message || 'An unexpected state anomaly occurred.'}
            </p>

            <button
              onClick={this.handleReload}
              className="w-full py-3 px-6 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-glow-cyan transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Reboot Command Terminal
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
