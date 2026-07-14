import { Component, type ErrorInfo, type ReactNode } from 'react';
import { captureException } from '@/lib/observability';

type Props = { children: ReactNode };
type State = { failed: boolean };

export default class AppErrorBoundary extends Component<Props, State> {
  override state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    captureException(error, { componentStack: errorInfo.componentStack });
  }

  override render() {
    if (!this.state.failed) return this.props.children;

    return (
      <main
        className="min-h-screen bg-[#151613] px-6 py-16 text-[#eee7d8]"
        data-testid="global-error"
      >
        <div className="mx-auto flex max-w-md flex-col gap-5">
          <h1 className="display-title text-4xl">The game hit a problem.</h1>
          <p className="text-[#aca99e]">
            Reload the game to continue. Your saved game stays on this device.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-fit rounded-md bg-[#c7a65d] px-4 py-2 font-semibold text-[#191a17] hover:bg-[#e2ca91]"
            data-testid="global-error-reset"
          >
            Reload game
          </button>
        </div>
      </main>
    );
  }
}
