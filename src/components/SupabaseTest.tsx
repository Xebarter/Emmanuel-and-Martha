import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { galleryService } from '../services/galleryService';

export function SupabaseTest() {
  const [status, setStatus] = useState<string>('Checking Supabase connection...');
  const [error, setError] = useState<string | null>(null);
  const [tables, setTables] = useState<string[]>([]);
  const [buckets, setBuckets] = useState<string[]>([]);

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test basic Supabase connection
        setStatus('Connecting to Supabase...');
        const { data: authData, error: authError } = await supabase.auth.getSession();
        
        if (authError) throw authError;
        
        setStatus('Checking database tables...');
        // Test database access
        const { data: tablesData, error: tablesError } = await supabase
          .from('pg_tables')
          .select('tablename')
          .eq('schemaname', 'public');
          
        if (tablesError) throw tablesError;
        
        setTables(tablesData.map((t: any) => t.tablename));
        
        // Test storage access
        setStatus('Checking storage buckets...');
        const { data: bucketsData, error: bucketsError } = await supabase.storage.listBuckets();
        
        if (bucketsError) throw bucketsError;
        
        setBuckets(bucketsData.map((b: any) => b.name));
        
        // Test gallery service
        setStatus('Testing gallery service...');
        const galleryImages = await galleryService.getGalleryImages();
        
        setStatus('Connection successful!');
        
      } catch (err: any) {
        console.error('Connection test failed:', err);
        setError(err.message || 'Unknown error occurred');
        setStatus('Connection failed');
      }
    };
    
    testConnection();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Supabase Connection Test</h2>
      
      <div className="mb-6 p-4 bg-gray-50 rounded">
        <p className="font-medium">Status: <span className={error ? 'text-red-600' : 'text-green-600'}>{status}</span></p>
        {error && (
          <div className="mt-2 p-3 bg-red-50 text-red-700 rounded">
            <p className="font-medium">Error:</p>
            <pre className="mt-1 text-sm overflow-x-auto">{error}</pre>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Database Tables</h3>
          {tables.length > 0 ? (
            <ul className="bg-gray-50 p-3 rounded">
              {tables.map((table) => (
                <li key={table} className="py-1 px-2 hover:bg-gray-100 rounded">
                  {table}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No tables found or couldn't access database</p>
          )}
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-2">Storage Buckets</h3>
          {buckets.length > 0 ? (
            <ul className="bg-gray-50 p-3 rounded">
              {buckets.map((bucket) => (
                <li key={bucket} className="py-1 px-2 hover:bg-gray-100 rounded">
                  {bucket}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No buckets found or couldn't access storage</p>
          )}
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 rounded">
        <h3 className="font-medium text-blue-800">Troubleshooting Tips</h3>
        <ul className="mt-2 text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>Check if your Supabase URL and anon key are correct in the .env file</li>
          <li>Make sure you've run the SQL setup script in Supabase</li>
          <li>Verify that the 'gallery' bucket exists in Storage</li>
          <li>Check your internet connection and CORS settings in Supabase</li>
        </ul>
      </div>
    </div>
  );
}
