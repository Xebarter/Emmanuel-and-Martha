import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabase: SupabaseClient;
let isSupabaseConnected = false;

// In development, don't require Supabase connection
if (import.meta.env.PROD) {
  isSupabaseConnected = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}

try {
  // Only create Supabase client if environment variables are present
  if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
    isSupabaseConnected = true;

    // Test the connection in development
    if (import.meta.env.MODE === 'development') {
      // Assume offline until proven otherwise
      isSupabaseConnected = false;
      (async () => {
        try {
          const { error } = await supabase.from('guests').select('*').limit(1);
          if (!error) {
            console.log('Successfully connected to Supabase');
            isSupabaseConnected = true;
          } else {
            console.warn('Supabase connection test failed:', error);
          }
        } catch (error) {
          console.warn('Supabase connection test failed:', error);
        }
      })();
    }
  } else {
    console.warn('Supabase environment variables not found. Running in offline mode.');
    // Create a mock client that will fail all operations
    supabase = {
      // @ts-ignore - Mock implementation
      auth: {
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
        signInWithPassword: () => Promise.resolve({ error: new Error('Supabase not connected') }),
        signOut: () => Promise.resolve({ error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null })
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: new Error('Supabase not connected') })
          })
        })
      })
    } as unknown as SupabaseClient;
  }
} catch (error) {
  console.warn('Supabase initialization failed, running in offline mode:', error);
}

export { supabase, isSupabaseConnected };

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          full_name: string;
          phone: string | null;
          role: 'admin' | 'finance' | 'events' | 'viewer';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      guests: {
        Row: {
          id: string;
          full_name: string;
          phone: string;
          email: string | null;
          message: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['guests']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['guests']['Insert']>;
      };
      meetings: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          location: string;
          starts_at: string;
          ends_at: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['meetings']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['meetings']['Insert']>;
      };
      attendances: {
        Row: {
          id: string;
          meeting_id: string;
          guest_id: string | null;
          name: string;
          phone: string;
          email: string | null;
          status: 'registered' | 'attended' | 'cancelled';
          registered_at: string;
        };
        Insert: Omit<Database['public']['Tables']['attendances']['Row'], 'id' | 'registered_at'>;
        Update: Partial<Database['public']['Tables']['attendances']['Insert']>;
      };
      contributions: {
        Row: {
          id: string;
          guest_id: string | null;
          amount: number;
          currency: string;
          pesapal_reference: string | null;
          pesapal_transaction_id: string | null;
          status: 'pending' | 'completed' | 'failed';
          metadata: Record<string, unknown>;
          created_at: string;
          contributor_name: string | null;
          contributor_email: string | null;
          contributor_phone: string | null;
          message: string | null;
        };
        Insert: Omit<Database['public']['Tables']['contributions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['contributions']['Insert']>;
      };
      pledges: {
        Row: {
          id: string;
          guest_id: string | null;
          type: 'money' | 'item';
          item_description: string | null;
          amount: number | null;
          quantity: number | null;
          status: 'pending' | 'fulfilled' | 'cancelled';
          phone: string;
          notes: string | null;
          created_at: string;
          fulfilled_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['pledges']['Row'], 'id' | 'created_at' | 'fulfilled_at'>;
        Update: Partial<Database['public']['Tables']['pledges']['Insert']>;
      };
      guest_messages: {
        Row: {
          id: string;
          guest_id: string | null;
          message: string;
          approved: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['guest_messages']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['guest_messages']['Insert']>;
      };
      uploads: {
        Row: {
          id: string;
          guest_id: string | null;
          filename: string;
          url: string;
          bucket: string;
          metadata: Record<string, unknown>;
          uploaded_at: string;
        };
        Insert: Omit<Database['public']['Tables']['uploads']['Row'], 'id' | 'uploaded_at'>;
        Update: Partial<Database['public']['Tables']['uploads']['Insert']>;
      };
      site_settings: {
        Row: {
          key: string;
          value: Record<string, unknown>;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['site_settings']['Row'], 'updated_at'>;
        Update: Partial<Database['public']['Tables']['site_settings']['Insert']>;
      };
    };
  };
};
