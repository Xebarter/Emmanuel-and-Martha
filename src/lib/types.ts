export interface Guest {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  address?: string;
  is_attending?: boolean;
  plus_ones?: number;
  dietary_restrictions?: string[];
  message?: string;
  created_at?: string;
  updated_at?: string;
  // Properties from dashboard display
  name?: string;
  status?: string;
  rsvp_status?: string;
  category?: string;
  plusOne?: boolean;
  dietary?: string;
  attendances?: Array<{
    id: string;
    meeting_id: string;
    status: string;
    meetings?: {
      title: string;
      starts_at: string;
      location: string;
    };
  }>;
}

export interface SiteMetadata {
  couple: {
    bride_name: string;
    groom_name: string;
    names: string;
    wedding_date: string;
    location: string;
    venue: string;
    tagline: string;
  };
  next_meeting: any;
  counts: {
    total_contributions: number;
    total_pledges: number;
    total_guests: number;
    total_meetings: number;
  };
  gallery: any[];
}

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  location: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  starts_at: string;
  ends_at?: string;
  max_attendees?: number;
  is_active?: boolean;
  cover_image_url?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  is_wedding?: boolean;
}