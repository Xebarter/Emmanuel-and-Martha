import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { SiteMetadata } from '../lib/types';

export function useMetadata() {
  const [metadata, setMetadata] = useState<SiteMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetadata() {
      try {
        console.log('[useMetadata] Starting fetch...');
        
        // Set a timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          console.warn('[useMetadata] Fetch timeout - using fallback data');
          setMetadata(getFallbackMetadata());
          setLoading(false);
        }, 5000);

        // Fetch data with proper error handling
        const results = await Promise.allSettled([
          supabase.from('meetings')
            .select('*')
            .gte('starts_at', new Date().toISOString())
            .order('starts_at', { ascending: true })
            .limit(1),
          supabase.from('contributions')
            .select('amount')
            .eq('status', 'completed'),
          supabase.from('pledges')
            .select('id', { count: 'exact', head: true }),
          supabase.from('guests')
            .select('id', { count: 'exact', head: true }),
          supabase.from('gallery')
            .select('url')
            .order('created_at', { ascending: false })
            .limit(5)
        ]);

        clearTimeout(timeoutId);

        console.log('[useMetadata] Results:', results);

        // Extract data with fallbacks
        const meetingsData = results[0].status === 'fulfilled' ? results[0].value : null;
        const contributionsData = results[1].status === 'fulfilled' ? results[1].value : null;
        const pledgesData = results[2].status === 'fulfilled' ? results[2].value : null;
        const guestsData = results[3].status === 'fulfilled' ? results[3].value : null;
        const galleryData = results[4].status === 'fulfilled' ? results[4].value : null;

        // Calculate totals with fallbacks
        const totalContributions = contributionsData?.data?.reduce((sum, c: any) =>
          sum + (c.amount || 0), 0) || 0;

        const metadata: SiteMetadata = {
          couple: {
            bride_name: 'Martha',
            groom_name: 'Emmanuel',
            names: 'Emmanuel & Martha',
            wedding_date: '2026-02-14',
            location: 'Kampala, Uganda',
            venue: 'Kampala, Uganda',
            tagline: 'Join us as we celebrate our love'
          },
          next_meeting: meetingsData?.data?.[0] || null,
          counts: {
            total_contributions: totalContributions,
            total_pledges: pledgesData?.count || 0,
            total_guests: guestsData?.count || 0,
            total_meetings: 0
          },
          gallery: galleryData?.data || []
        };

        console.log('[useMetadata] Metadata loaded:', metadata);
        setMetadata(metadata);
        setError(null);
      } catch (err) {
        console.error('[useMetadata] Error:', err);
        // Use fallback data instead of showing error
        setMetadata(getFallbackMetadata());
        setError(null); // Don't show error to user, just use fallback
      } finally {
        setLoading(false);
        console.log('[useMetadata] Loading complete');
      }
    }

    fetchMetadata();
  }, []);

  return { metadata, loading, error };
}

// Fallback metadata for when database is not accessible
function getFallbackMetadata(): SiteMetadata {
  return {
    couple: {
      bride_name: 'Martha',
      groom_name: 'Emmanuel',
      names: 'Emmanuel & Martha',
      wedding_date: '2026-02-14',
      location: 'Kampala, Uganda',
      venue: 'Kampala, Uganda',
      tagline: 'Join us as we celebrate our love'
    },
    next_meeting: null,
    counts: {
      total_contributions: 0,
      total_pledges: 0,
      total_guests: 0,
      total_meetings: 0
    },
    gallery: []
  };
}