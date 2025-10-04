// src/hooks/useMetadata.ts
import { useEffect, useState } from 'react';
import { supabase, isSupabaseConnected } from '../lib/supabase';

interface CoupleInfo {
  bride_name: string;
  groom_name: string;
  wedding_date: string;
  venue: string;
  tagline?: string;
}

interface Counts {
  total_contributions: number;
  total_pledges: number;
  total_meetings: number;
  total_guests: number;
}

interface Metadata {
  couple: CoupleInfo;
  counts: Counts;
}

// Default metadata for offline mode
const defaultMetadata: Metadata = {
  couple: {
    bride_name: 'Bride',
    groom_name: 'Groom',
    wedding_date: new Date().toISOString(),
    venue: 'Wedding Venue',
    tagline: 'Celebrating Our Love'
  },
  counts: {
    total_contributions: 0,
    total_pledges: 0,
    total_meetings: 0,
    total_guests: 0
  }
};

export function useMetadata() {
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [loading, setLoading] = useState(!isSupabaseConnected);
  
  // If not connected to Supabase, return default metadata immediately
  if (!isSupabaseConnected) {
    return { 
      metadata: defaultMetadata, 
      loading: false,
      error: null 
    };
  }

  useEffect(() => {
    let isMounted = true;

    const loadMetadata = async () => {
      console.log("[useMetadata] Loading metadata...");
      
      // If not connected to Supabase, use default metadata
      if (!isSupabaseConnected) {
        console.log("[useMetadata] Using default metadata (offline mode)");
        if (isMounted) {
          setMetadata({
            couple: {
              bride_name: 'Bride',
              groom_name: 'Groom',
              wedding_date: new Date().toISOString(),
              venue: 'Wedding Venue',
              tagline: 'Celebrating Our Love'
            },
            counts: {
              total_contributions: 0,
              total_pledges: 0,
              total_meetings: 0,
              total_guests: 0
            }
          });
          setLoading(false);
        }
        return;
      }

      // Try to fetch from Supabase if online
      try {
        console.log("[useMetadata] Fetching metadata from Supabase.");
        const { data, error } = await supabase
          .from("wedding_metadata")
          .select("*")
          .single();

        if (error) throw error;

        if (isMounted) {
          console.log("[useMetadata] Data fetched from Supabase:", data);
          setMetadata(data as Metadata);
        }
      } catch (error) {
        console.warn("[useMetadata] Using default metadata due to error:", error);
        if (isMounted) {
          setMetadata({
            couple: {
              bride_name: 'Bride',
              groom_name: 'Groom',
              wedding_date: new Date().toISOString(),
              venue: 'Wedding Venue',
              tagline: 'Celebrating Our Love'
            },
            counts: {
              total_contributions: 0,
              total_pledges: 0,
              total_meetings: 0,
              total_guests: 0
            }
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadMetadata();

    return () => {
      isMounted = false;
    };
  }, []);
  return { metadata, loading, error };
}
