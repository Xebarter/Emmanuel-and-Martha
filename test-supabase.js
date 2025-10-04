// This script tests the Supabase connection directly using Node.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Configure dotenv
dotenv.config();

async function testSupabaseConnection() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  const nodeEnv = process.env.NODE_ENV || 'development';

  console.log('Environment:', nodeEnv);
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing Supabase environment variables');
    console.log('Please make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file');
    process.exit(1);
  }

  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase Key:', supabaseKey ? '***' + supabaseKey.slice(-4) : 'Not set');

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  try {
    console.log('\n1. Testing authentication...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError) throw authError;
    console.log('✅ Authentication successful');

    console.log('\n2. Testing database connection...');
    const { data: tablesData, error: tablesError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public')
      .limit(5);
    
    if (tablesError) throw tablesError;
    console.log('✅ Database connection successful');
    console.log('   Found tables:', tablesData.map(t => t.tablename).join(', '));

    console.log('\n3. Testing storage connection...');
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      if (bucketsError) throw bucketsError;
      console.log('✅ Storage connection successful');
      console.log('   Found buckets:', buckets.map(b => b.name).join(', '));
    } catch (storageError) {
      console.warn('⚠️  Storage connection warning:', storageError.message);
      console.log('   Continuing with other tests...');
    }

  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    
    if (error.message.includes('getaddrinfo ENOTFOUND')) {
      console.error('   This usually means the URL is incorrect or there are network issues');
      console.error('   Please check if the Supabase URL is correct and your internet connection is working');
    } else if (error.message.includes('Invalid API key') || error.message.includes('invalid JWT')) {
      console.error('   The provided Supabase anon key is invalid');
      console.error('   Please verify your VITE_SUPABASE_ANON_KEY in the .env file');
    } else if (error.message.includes('permission denied')) {
      console.error('   The provided credentials do not have sufficient permissions');
      console.error('   Check your Supabase RLS policies and database permissions');
    } else if (error.message.includes('self signed certificate')) {
      console.error('   SSL certificate verification failed');
      console.error('   This might happen if you\'re behind a corporate proxy or using a self-signed certificate');
    } else {
      console.error('   Error details:', error);
    }
    
    console.log('\nTroubleshooting steps:');
    console.log('1. Verify your Supabase project is active at https://app.supabase.com');
    console.log('2. Check your .env file for correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    console.log('3. Ensure your network allows outbound connections to Supabase');
    console.log('4. Try accessing the Supabase URL in your browser');
    
    process.exit(1);
  }
}

// Run the test
testSupabaseConnection()
  .then(() => console.log('\n✅ All tests completed successfully!'))
  .catch(err => {
    console.error('\n❌ Test failed with error:', err);
    process.exit(1);
  });
