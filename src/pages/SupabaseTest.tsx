import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function SupabaseTest() {
  const [connectionStatus, setConnectionStatus] = useState<string>('Checking...');
  const [sessionStatus, setSessionStatus] = useState<string>('Checking...');
  const [testResults, setTestResults] = useState<any>(null);
  const [envVars, setEnvVars] = useState<any>({});
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // Check environment variables
    setEnvVars({
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing',
      storageBucket: import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'gallery (default)'
    });

    const testSupabase = async () => {
      try {
        // Test basic connection by checking if the URL is valid
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        if (!supabaseUrl) {
          setConnectionStatus('❌ VITE_SUPABASE_URL is not set in environment variables');
          return;
        }

        // Try to parse the URL
        try {
          new URL(supabaseUrl);
        } catch (e) {
          setConnectionStatus(`❌ Invalid Supabase URL: ${supabaseUrl}`);
          return;
        }

        // Test basic connection
        const { data, error } = await supabase
          .from('gallery')
          .select('id')
          .limit(1);
        
        if (error) {
          setConnectionStatus(`Failed: ${error.message}`);
        } else {
          setConnectionStatus('✅ Connected successfully');
        }
      } catch (error: any) {
        setConnectionStatus(`Error: ${error.message}`);
      }

      try {
        // Test session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          setSessionStatus(`Session error: ${error.message}`);
        } else if (session) {
          setSessionStatus(`✅ Authenticated as: ${session.user.email}`);
        } else {
          setSessionStatus('⚠️ No active session');
        }
      } catch (error: any) {
        setSessionStatus(`Session check error: ${error.message}`);
      }
    };

    testSupabase();
  }, []);

  const runTestQuery = async () => {
    try {
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .limit(5);
      
      if (error) throw error;
      
      setTestResults({
        success: true,
        data
      });
    } catch (error: any) {
      setTestResults({
        success: false,
        error: error.message
      });
    }
  };

  const testStorage = async () => {
    try {
      // List buckets to test storage access
      const { data, error } = await supabase.storage.listBuckets();
      
      if (error) throw error;
      
      setTestResults({
        success: true,
        storage: data
      });
    } catch (error: any) {
      setTestResults({
        success: false,
        storageError: error.message
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Supabase Connection Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Connection Status</h2>
          <p className={connectionStatus.includes('✅') ? 'text-green-600' : connectionStatus.includes('❌') ? 'text-red-600' : 'text-yellow-600'}>
            {connectionStatus}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Session Status</h2>
          <p className={sessionStatus.includes('✅') ? 'text-green-600' : sessionStatus.includes('⚠️') ? 'text-yellow-600' : 'text-red-600'}>
            {sessionStatus}
          </p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-2">Environment Variables</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="font-medium">Supabase URL:</span>
            <span className={envVars.supabaseUrl ? 'text-green-600' : 'text-red-600'}>
              {envVars.supabaseUrl || 'Not set'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Supabase Key:</span>
            <span className={envVars.supabaseKey?.includes('✅') ? 'text-green-600' : 'text-red-600'}>
              {envVars.supabaseKey || 'Not set'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Storage Bucket:</span>
            <span>{envVars.storageBucket}</span>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-2">Auth Context</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="font-medium">isAuthenticated:</span>
            <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
              {isAuthenticated ? 'true' : 'false'}
            </span>
          </div>
          {user ? (
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="font-medium">User ID:</span>
                <span className="font-mono text-sm">{user.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Email:</span>
                <span>{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Name:</span>
                <span>{user.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Role:</span>
                <span>{user.role}</span>
              </div>
            </div>
          ) : (
            <p className="text-red-600">No user data available</p>
          )}
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Test Queries</h2>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={runTestQuery}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Test Database Query
          </button>
          
          <button 
            onClick={testStorage}
            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
          >
            Test Storage Access
          </button>
        </div>
        
        {testResults && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Results:</h3>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60 text-xs">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </div>
        )}
      </div>
      
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Need help?</strong> If you're seeing connection errors, check that:
            </p>
            <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside space-y-1">
              <li>Your Supabase project URL is correct in the .env file</li>
              <li>Your Supabase project exists and is active</li>
              <li>You're logged in as an administrator</li>
              <li>You have restarted the development server after changing environment variables</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}