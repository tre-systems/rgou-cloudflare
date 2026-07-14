import { Wifi, WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="max-w-md mx-auto text-center">
        <WifiOff className="mx-auto mb-4 h-24 w-24 text-slate-400" aria-hidden="true" />
        <h1 className="text-3xl font-bold text-white mb-2">You&apos;re Offline</h1>
        <p className="mb-8 text-lg text-slate-300">No internet connection detected.</p>
        <div className="bg-slate-800/50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-3">Royal Game of Ur</h2>
          <p className="text-slate-300 mb-4">The game and AI remain available offline.</p>
          <div className="flex items-center justify-center space-x-2 text-sm text-slate-400">
            <Wifi className="h-4 w-4" aria-hidden="true" />
            <span>Your game and statistics remain stored locally</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
