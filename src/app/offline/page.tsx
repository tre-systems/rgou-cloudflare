'use client';

import { Wifi, WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-md mx-auto text-center">
        <div className="mb-8">
          <WifiOff className="h-24 w-24 text-slate-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">You&apos;re Offline</h1>
          <p className="text-slate-300 text-lg">No internet connection detected</p>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-3">Royal Game of Ur</h2>
          <p className="text-slate-300 mb-4">
            This ancient Mesopotamian board game is available offline! You can still play against
            the AI opponent even without an internet connection.
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-slate-400">
            <Wifi className="h-4 w-4" />
            <span>Reconnect to sync your progress</span>
          </div>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
        >
          Try Again
        </button>

        <div className="mt-6 text-sm text-slate-400">
          <p>Game data is stored locally and will sync when you&apos;re back online.</p>
        </div>
      </div>
    </div>
  );
}
