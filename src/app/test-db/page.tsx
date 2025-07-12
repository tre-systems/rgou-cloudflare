'use client';

import { useState } from 'react';
import { testDatabaseConnection } from '../actions';

type TestResult = {
  success?: boolean;
  error?: string;
  details?: unknown;
  message?: string;
  gameCount?: number;
  environment?: string;
};

export default function TestDatabasePage() {
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTestConnection = async () => {
    setLoading(true);
    try {
      const testResult = await testDatabaseConnection();
      setResult(testResult);
    } catch (error) {
      setResult({ error: 'Failed to test connection', details: error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-3xl font-bold text-white mb-8">Database Connection Test</h1>

        <button
          onClick={handleTestConnection}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 mb-6"
        >
          {loading ? 'Testing...' : 'Test Database Connection'}
        </button>

        {result && (
          <div className="bg-slate-800/50 rounded-lg p-6 text-left">
            <h2 className="text-xl font-semibold text-white mb-3">Test Results:</h2>
            <pre className="text-sm text-slate-300 whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
