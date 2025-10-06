import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function MessagesTest() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guests, setGuests] = useState<any[]>([]);

  useEffect(() => {
    testMessageFetching();
    fetchGuests();
  }, []);

  const fetchGuests = async () => {
    try {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .limit(5);
      
      if (error) throw error;
      setGuests(data || []);
    } catch (err) {
      console.error('Error fetching guests:', err);
    }
  };

  const testMessageFetching = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Test 1: Fetch messages directly
      console.log('Test 1: Fetching messages directly');
      const { data: messagesData, error: messagesError } = await supabase
        .from('guest_messages')
        .select('*')
        .limit(10);
      
      if (messagesError) {
        console.error('Messages fetch error:', messagesError);
        setError(`Messages fetch error: ${messagesError.message}`);
        return;
      }
      
      console.log('Messages data:', messagesData);
      setMessages(messagesData || []);
      
      // Test 2: Check if we have guest data
      if (messagesData && messagesData.length > 0) {
        const guestIds = messagesData
          .map(msg => msg.guest_id)
          .filter(id => id !== null);
        
        if (guestIds.length > 0) {
          console.log('Test 2: Fetching guest data for messages');
          const { data: guestsData, error: guestsError } = await supabase
            .from('guests')
            .select('*')
            .in('id', guestIds);
          
          if (guestsError) {
            console.error('Guests fetch error:', guestsError);
            setError(`Guests fetch error: ${guestsError.message}`);
          } else {
            console.log('Guests data:', guestsData);
          }
        }
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError(`Unexpected error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const insertSampleMessage = async () => {
    try {
      setLoading(true);
      
      // Get a guest to associate with the message
      let guestId = null;
      if (guests.length > 0) {
        guestId = guests[0].id;
      } else {
        // Create a sample guest if none exist
        const { data: newGuest, error: guestError } = await supabase
          .from('guests')
          .insert({
            full_name: 'Test Guest',
            phone: '+1234567890',
            email: 'test@example.com'
          })
          .select()
          .single();
        
        if (guestError) throw guestError;
        guestId = newGuest.id;
      }
      
      // Insert sample message
      const { data, error } = await supabase
        .from('guest_messages')
        .insert({
          guest_id: guestId,
          message: 'This is a test message to verify the dashboard is working correctly.',
          is_approved: false
        })
        .select();
      
      if (error) throw error;
      
      console.log('Sample message inserted:', data);
      testMessageFetching(); // Refresh the list
    } catch (err) {
      console.error('Error inserting sample message:', err);
      setError(`Error inserting sample message: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const clearAllMessages = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('guest_messages')
        .delete()
        .neq('id', ''); // Delete all messages
      
      if (error) throw error;
      
      console.log('All messages cleared');
      testMessageFetching(); // Refresh the list
    } catch (err) {
      console.error('Error clearing messages:', err);
      setError(`Error clearing messages: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Messages Test</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <div className="mb-4 flex space-x-2">
        <button 
          onClick={testMessageFetching}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Refresh Messages
        </button>
        
        <button 
          onClick={insertSampleMessage}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Insert Sample Message
        </button>
        
        <button 
          onClick={clearAllMessages}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          Clear All Messages
        </button>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Available Guests</h2>
        {guests.length === 0 ? (
          <p>No guests found</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {guests.map(guest => (
              <div key={guest.id} className="border rounded p-3">
                <p><strong>{guest.full_name}</strong></p>
                <p>Phone: {guest.phone}</p>
                <p>Email: {guest.email || 'N/A'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2">Loading messages...</p>
        </div>
      ) : (
        <div>
          <p className="mb-4">Found {messages.length} messages</p>
          
          {messages.length === 0 ? (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
              <p>No messages found in the database.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="border rounded-lg p-4">
                  <p><strong>ID:</strong> {message.id}</p>
                  <p><strong>Guest ID:</strong> {message.guest_id || 'None'}</p>
                  <p><strong>Message:</strong> {message.message}</p>
                  <p><strong>Approved:</strong> {message.is_approved ? 'Yes' : 'No'}</p>
                  <p><strong>Created:</strong> {message.created_at}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}