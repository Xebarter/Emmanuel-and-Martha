import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  loading: boolean;
  error: string | null;
  retryFn?: () => void;
}

export function LoadingState({ loading, error, retryFn }: LoadingStateProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50">
      {/* Loading state visualization */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-40 bg-gray-200 rounded-lg"></div>
          <div className="h-20 bg-gray-200 rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-64 bg-gray-200 rounded-lg"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>

        {/* Error and Debug Panel */}
        <div className="mt-8 max-w-lg mx-auto bg-white/80 backdrop-blur rounded-lg shadow-md p-6">
          <Loader2 className="w-12 h-12 animate-spin text-rose-500 mx-auto mb-4" />
          <p className="text-gray-600 text-center mb-4">
            {loading ? "Loading wedding information..." : "Waiting for data..."}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="text-sm text-left text-gray-700 bg-gray-50 p-3 rounded">
            <div><strong>Status:</strong> {loading ? 'Loading...' : error ? 'Error' : 'Waiting for data'}</div>
            <div><strong>Last Update:</strong> {new Date().toLocaleTimeString()}</div>
          </div>

          {error && retryFn && (
            <div className="mt-4 text-center">
              <button
                onClick={retryFn}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded transition-colors"
              >
                Retry Loading
              </button>
            </div>
          )}

          <details className="mt-4 text-xs text-left text-gray-600">
            <summary className="cursor-pointer">Debug Information</summary>
            <pre className="overflow-x-auto text-xs mt-2 bg-black text-white p-2 rounded">
              {JSON.stringify({
                timestamp: new Date().toISOString(),
                loading,
                error,
                retryAvailable: !!retryFn
              }, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
}