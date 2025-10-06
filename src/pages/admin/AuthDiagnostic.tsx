import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function AuthDiagnostic() {
  const { user, loading } = useAuth();
  const [dbInfo, setDbInfo] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDbInfo();
  }, []);

  const fetchDbInfo = async () => {
    try {
      // Check authentication status
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session:', session);

      // Try to fetch messages with different approaches
      console.log('Attempting to fetch messages...');
      
      // Method 1: Simple select
      const { data: messages1, error: error1 } = await supabase
        .from('guest_messages')
        .select('*')
        .limit(5);
      
      console.log('Method 1 - Simple select:', { data: messages1, error: error1 });
      
      // Method 2: Select with order
      const { data: messages2, error: error2 } = await supabase
        .from('guest_messages')
        .select('id, guest_id, message, is_approved, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      
      console.log('Method 2 - Ordered select:', { data: messages2, error: error2 });
      
      setMessages(messages1 || messages2 || []);
      if (error1 || error2) {
        setError(`DB Error: ${error1?.message || error2?.message}`);
      }
      
      // Get database info
      const { data: info, error: infoError } = await supabase
        .from('guests')
        .select('count()', { count: 'exact' });
      
      console.log('Guest count info:', { info, infoError });
      
      setDbInfo({
        session,
        messagesMethod1: { data: messages1, error: error1 },
        messagesMethod2: { data: messages2, error: error2 },
        guestCountInfo: { info, infoError }
      });
    } catch (err) {
      console.error('Diagnostic error:', err);
      setError(`Diagnostic error: ${err}`);
    }
  };

  if (loading) {
    return <div className="p-8">Loading authentication info...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Authentication & Database Diagnostic</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <h2 className="text-lg font-semibold mb-2">Authentication Status</h2>
          <p><strong>User:</strong> {user ? `${user.name} (${user.email})` : 'Not authenticated'}</p>
          <p><strong>Role:</strong> {user?.role || 'N/A'}</p>
          <p><strong>User ID:</strong> {user?.id || 'N/A'}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <h2 className="text-lg font-semibold mb-2">Database Info</h2>
          <p><strong>Messages Found:</strong> {messages.length}</p>
          <button 
            onClick={fetchDbInfo}
            className="mt-2 bg-blue-500 hover:bg-blue-700 text-white py-1 px-3 rounded text-sm"
          >
            Refresh
          </button>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow border mb-6">
        <h2 className="text-lg font-semibold mb-2">Raw Diagnostic Data</h2>
        <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
          {JSON.stringify(dbInfo, null, 2)}
        </pre>
      </div>
      
      {messages.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow border">
          <h2 className="text-lg font-semibold mb-2">Messages Found ({messages.length})</h2>
          <div className="space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className="border rounded p-3">
                <p><strong>ID:</strong> {msg.id}</p>
                <p><strong>Guest ID:</strong> {msg.guest_id || 'None'}</p>
                <p><strong>Message:</strong> {msg.message}</p>
                <p><strong>Approved:</strong> {msg.is_approved ? 'Yes' : 'No'}</p>
                <p><strong>Created:</strong> {msg.created_at}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}