// Test script to verify Supabase connection
const { createClient } = require('@supabase/supabase-js');

// Make sure to add your Supabase credentials here
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://yenpspssxhehstcdnqlf.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllbnBzcHNzeGhlaHN0Y2RucWxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNDg2MDAsImV4cCI6MjA3NDkyNDYwMH0.1TlC8WaHsruMbxrr5rf5JM-q_ANfCS6Mx2SwiO6Hy-c';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('Testing Supabase connection...');
  console.log('URL:', supabaseUrl);
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('gallery')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection error:', error);
      return;
    }
    
    console.log('Connection successful!');
    console.log('Test query result:', data);
  } catch (error) {
    console.error('Network or other error:', error);
  }
}

testConnection();