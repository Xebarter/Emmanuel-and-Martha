import { Calendar, MapPin, Clock, Users, Loader2, X, Heart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, formatDistanceToNow, differenceInDays, differenceInHours, differenceInMinutes, isAfter } from 'date-fns';
import { supabase } from '../lib/supabase';
import { normalizePhone, formatDateTime } from '../lib/utils';
import { Meeting } from '../lib/types';

const registrationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
});

type RegistrationForm = z.infer<typeof registrationSchema>;

export function MeetingsSection() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [weddingDetails, setWeddingDetails] = useState<{
    wedding_date?: string;
    wedding_time?: string;
    location?: string;
    venue?: string;
  }>({});
  const [loading, setLoading] = useState(true);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
  });

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([
        fetchMeetings(),
        fetchWeddingDetails()
      ]);
    };
    
    fetchData();
    
    // Set up real-time subscription to wedding details
    const subscription = supabase
      .channel('wedding-details-changes')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'site_settings',
          filter: 'key=eq.couple_info'
        }, 
        (payload) => {
          if (payload.new?.value) {
            setWeddingDetails({
              wedding_date: payload.new.value.wedding_date,
              wedding_time: payload.new.value.wedding_time,
              location: payload.new.value.location,
              venue: payload.new.value.venue
            });
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const fetchWeddingDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'couple_info')
        .single();

      if (error) throw error;
      
      if (data?.value) {
        setWeddingDetails({
          wedding_date: data.value.wedding_date,
          wedding_time: data.value.wedding_time,
          location: data.value.location,
          venue: data.value.venue
        });
      }
    } catch (error) {
      console.error('Error fetching wedding details:', error);
    }
  };

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true });

      if (error) throw error;
      setMeetings(data || []);
    } catch (error) {
      console.error('Failed to fetch meetings:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Get the main wedding event as a meeting
  const getWeddingEvent = (): Meeting | null => {
    if (!weddingDetails.wedding_date) return null;
    
    // Combine date and time if available
    let startsAt = weddingDetails.wedding_date;
    if (weddingDetails.wedding_time) {
      const [hours, minutes] = weddingDetails.wedding_time.split(':');
      const date = new Date(weddingDetails.wedding_date);
      date.setHours(parseInt(hours, 10), parseInt(minutes || '0', 10), 0, 0);
      startsAt = date.toISOString();
    }
    
    // Only include if the wedding is in the future
    if (new Date(startsAt) < new Date()) {
      return null;
    }
    
    return {
      id: 'wedding',
      title: 'Wedding Ceremony',
      description: 'Join us as we celebrate our love and commitment',
      location: weddingDetails.location || weddingDetails.venue || 'TBA',
      starts_at: startsAt,
      ends_at: startsAt, // Same as start time for simplicity
      created_at: new Date().toISOString(),
      is_wedding: true
    };
  };
  
  // Combine wedding event with other meetings and sort by date
  const getAllEvents = (): Meeting[] => {
    const events = [...meetings];
    const weddingEvent = getWeddingEvent();
    
    if (weddingEvent) {
      events.unshift(weddingEvent);
    }
    
    return events.sort((a, b) => 
      new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
    );
  };

  const onSubmit = async (data: RegistrationForm) => {
    if (!selectedMeeting) return;

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const normalizedPhone = normalizePhone(data.phone);

      let guestId = null;
      const { data: existingGuest } = await supabase
        .from('guests')
        .select('id')
        .eq('phone', normalizedPhone)
        .maybeSingle();

      if (existingGuest) {
        guestId = existingGuest.id;
      } else {
        const { data: newGuest, error: guestError } = await supabase
          .from('guests')
          .insert({
            full_name: data.name,
            phone: normalizedPhone,
            email: data.email || null,
          })
          .select('id')
          .single();

        if (guestError) throw guestError;
        guestId = newGuest.id;
      }

      const { error: attendanceError } = await supabase
        .from('attendances')
        .insert({
          meeting_id: selectedMeeting.id,
          guest_id: guestId,
          name: data.name,
          phone: normalizedPhone,
          email: data.email || null,
          status: 'registered',
        });

      if (attendanceError) throw attendanceError;

      setSubmitMessage({
        type: 'success',
        text: 'Successfully registered! We look forward to seeing you.',
      });
      reset();
      setSelectedMeeting(null);
    } catch (error) {
      console.error('Registration error:', error);
      setSubmitMessage({
        type: 'error',
        text: 'Failed to register. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTimeUntilMeeting = (startDate: string) => {
    const now = new Date();
    const meetingDate = new Date(startDate);

    const days = differenceInDays(meetingDate, now);
    const hours = differenceInHours(meetingDate, now) % 24;
    const minutes = differenceInMinutes(meetingDate, now) % 60;

    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <section id="meetings" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-rose-500" />
        </div>
      </section>
    );
  }

  return (
    <section id="meetings" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">
            Upcoming Meetings
          </h2>
          <p className="text-lg text-gray-600">
            Join us for our wedding preparation meetings
          </p>
        </div>

        {getAllEvents().length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No upcoming meetings scheduled</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getAllEvents().map((meeting) => (
              <div
                key={meeting.id}
                className={`bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border-2 p-6 hover:shadow-xl transition-all duration-300 ${
                  (meeting as any).is_wedding ? 'border-rose-300 ring-2 ring-rose-100' : 'border-gray-100'
                }`}
              >
                <div className="mb-4">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-3 ${
                    (meeting as any).is_wedding 
                      ? 'bg-rose-500 text-white' 
                      : 'bg-rose-100 text-rose-700'
                  }`}>
                    {(meeting as any).is_wedding ? (
                      <Heart className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                    {(meeting as any).is_wedding ? 'Wedding Day' : `${getTimeUntilMeeting(meeting.starts_at)} away`}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{meeting.title}</h3>
                  {meeting.description && (
                    <p className="text-gray-600 mb-4">{meeting.description}</p>
                  )}
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3 text-gray-700">
                    <Calendar className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{formatDateTime(meeting.starts_at)}</span>
                  </div>
                  <div className="flex items-start gap-3 text-gray-700">
                    <MapPin className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{meeting.location}</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedMeeting(meeting)}
                  className="w-full bg-gradient-to-r from-rose-500 to-rose-600 text-white py-3 rounded-lg font-semibold hover:from-rose-600 hover:to-rose-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <Users className="w-5 h-5" />
                  Register Now
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedMeeting && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedMeeting(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Register for Meeting</h3>
              <button
                onClick={() => setSelectedMeeting(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold text-gray-900 mb-2">{selectedMeeting.title}</p>
              <p className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4" />
                {formatDateTime(selectedMeeting.starts_at)}
              </p>
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {selectedMeeting.location}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="mb-4">
                <label htmlFor="modal-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  {...register('name')}
                  type="text"
                  id="modal-name"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  placeholder="John Doe"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
              </div>

              <div className="mb-4">
                <label htmlFor="modal-phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  {...register('phone')}
                  type="tel"
                  id="modal-phone"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  placeholder="+256700000000"
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
              </div>

              <div className="mb-6">
                <label htmlFor="modal-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email (Optional)
                </label>
                <input
                  {...register('email')}
                  type="email"
                  id="modal-email"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  placeholder="john@example.com"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
              </div>

              {submitMessage && (
                <div
                  className={`mb-4 p-4 rounded-lg ${
                    submitMessage.type === 'success'
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {submitMessage.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-rose-500 to-rose-600 text-white py-3 rounded-lg font-semibold hover:from-rose-600 hover:to-rose-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Registering...
                  </>
                ) : (
                  'Complete Registration'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
