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
  }>({
    wedding_date: undefined,
    wedding_time: undefined,
    location: undefined,
    venue: undefined,
  });
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
    const weddingSubscription = supabase
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
      
    // Set up real-time subscription to meetings
    const meetingsSubscription = supabase
      .channel('meetings-changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meetings'
        },
        (payload) => {
          // Refresh meetings when any change occurs
          fetchMeetings();
        }
      )
      .subscribe();

    return () => {
      weddingSubscription.unsubscribe();
      meetingsSubscription.unsubscribe();
    };
  }, []);
  
  const fetchWeddingDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'couple_info');

      if (error) throw error;
      
      if (data && data.length > 0 && data[0].value) {
        setWeddingDetails({
          wedding_date: data[0].value.wedding_date,
          wedding_time: data[0].value.wedding_time,
          location: data[0].value.location,
          venue: data[0].value.venue
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

      // Check if guest already exists
      let guestId = null;
      const { data: existingGuest } = await supabase
        .from('guests')
        .select('id')
        .eq('phone', normalizedPhone)
        .maybeSingle();

      if (existingGuest) {
        guestId = existingGuest.id;
      } else {
        // Insert new guest record
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

      // Check if attendance record already exists
      const { data: existingAttendance, error: attendanceCheckError } = await supabase
        .from('attendances')
        .select('id')
        .eq('meeting_id', selectedMeeting.id)
        .eq('guest_id', guestId)
        .maybeSingle();

      // If attendance already exists, show success message
      if (existingAttendance) {
        setSubmitMessage({
          type: 'success',
          text: 'You are already registered for this meeting! We look forward to seeing you.',
        });
        reset();
        setSelectedMeeting(null);
        setIsSubmitting(false);
        return;
      }

      // If there was an error checking for existing attendance (other than not found), throw it
      if (attendanceCheckError && attendanceCheckError.code !== 'PGRST116') {
        throw attendanceCheckError;
      }

      // Insert new attendance record
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
      timeZone: 'Africa/Kampala' // Add explicit time zone
    });
  };

  if (loading) {
    return (
      <section id="meetings" className="py-20 bg-gradient-to-br from-purple-950 via-purple-900 to-purple-800">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-400" />
        </div>
      </section>
    );
  }

  return (
    <section id="meetings" className="py-20 md:py-24 bg-gradient-to-br from-purple-950 via-purple-900 to-purple-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-4xl md:text-6xl font-serif font-extrabold text-amber-100 mb-4 md:mb-6 tracking-tight">
            Upcoming Gatherings
          </h2>
          <div className="flex items-center justify-center gap-3 md:gap-4 mb-4">
            <div className="h-px w-12 md:w-20 bg-gradient-to-r from-transparent via-purple-400 to-amber-400"></div>
            <Calendar className="w-5 h-5 text-amber-400" />
            <div className="h-px w-12 md:w-20 bg-gradient-to-l from-transparent via-purple-400 to-amber-400"></div>
          </div>
          <p className="text-lg md:text-xl text-amber-200 max-w-3xl mx-auto leading-relaxed">
            Join us in the sacred moments leading to our eternal union
          </p>
        </div>

        {getAllEvents().length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 text-purple-500 mx-auto mb-4" />
            <p className="text-amber-200 text-xl font-medium">No forthcoming gatherings or sacred events unveiled</p>
            <p className="text-amber-300 text-base mt-2">Return anon for revelations</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {getAllEvents().map((meeting) => (
              <div
                key={meeting.id}
                className={`bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border-2 p-8 hover:shadow-3xl transition-all duration-500 ${
                  (meeting as any).is_wedding 
                    ? 'border-amber-400/50 ring-4 ring-amber-500/20 bg-gradient-to-br from-amber-900/20' 
                    : 'border-purple-600/30'
                }`}
              >
                <div className="mb-6">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-4 ${
                    (meeting as any).is_wedding 
                      ? 'bg-amber-500/90 text-amber-900 shadow-lg' 
                      : 'bg-purple-500/20 text-amber-200 border border-purple-400/30'
                  }`}>
                    {(meeting as any).is_wedding ? (
                      <Heart className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                    {(meeting as any).is_wedding ? 'The Sacred Union' : `${getTimeUntilMeeting(meeting.starts_at)} hence`}
                  </div>
                  <h3 className="text-3xl font-bold text-amber-100 mb-3 tracking-tight">{meeting.title}</h3>
                  {meeting.description && (
                    <p className="text-amber-300 mb-6 leading-relaxed">{meeting.description}</p>
                  )}
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-4 text-amber-200">
                    <Calendar className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span className="text-base leading-relaxed">
                      {formatDateTime(meeting.starts_at)}
                      {(meeting as any).is_wedding && (
                        <span className="ml-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/90 text-amber-900 border border-amber-400 shadow-md">
                          <Heart className="w-3 h-3 mr-1" />
                          Eternal Vow
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-start gap-4 text-amber-200">
                    <MapPin className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span className="text-base leading-relaxed">{meeting.location}</span>
                  </div>
                </div>

                {!meeting.is_wedding && (
                  <button
                    onClick={() => setSelectedMeeting(meeting)}
                    className="w-full bg-gradient-to-r from-purple-600 via-purple-500 to-amber-500 text-white py-4 rounded-xl font-serif font-semibold text-lg tracking-wide hover:from-purple-700 hover:via-purple-600 hover:to-amber-600 transition-all duration-300 shadow-xl hover:shadow-2xl flex items-center justify-center gap-3 transform hover:-translate-y-1"
                  >
                    <Users className="w-5 h-5" />
                    Reserve Thy Place
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedMeeting && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedMeeting(null)}
        >
          <div
            className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl max-w-lg w-full p-8 md:p-10 border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-3xl font-bold text-amber-100">Reserve Attendance</h3>
              <button
                onClick={() => setSelectedMeeting(null)}
                className="p-3 hover:bg-white/10 rounded-full transition-all duration-200 text-amber-200 hover:text-amber-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-8 p-6 bg-white/5 rounded-2xl border border-white/10">
              <p className="font-serif text-2xl text-amber-100 mb-3 font-semibold">{selectedMeeting.title}</p>
              <p className="text-base text-amber-300 flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                {formatDateTime(selectedMeeting.starts_at)}
              </p>
              <p className="text-base text-amber-300 flex items-center gap-3">
                <MapPin className="w-5 h-5 text-amber-400" />
                {selectedMeeting.location}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="mb-6">
                <label htmlFor="modal-name" className="block text-sm font-semibold text-amber-100 mb-3 tracking-wide">
                  Thy Full Name *
                </label>
                <input
                  {...register('name')}
                  type="text"
                  id="modal-name"
                  className="w-full px-5 py-4 rounded-2xl border-2 border-purple-600/50 focus:ring-4 focus:ring-amber-500/30 focus:border-amber-400 bg-purple-800/60 text-amber-100 placeholder-purple-300 transition-all duration-200 shadow-inner hover:shadow-lg"
                  placeholder="Thy Noble Name"
                />
                {errors.name && <p className="text-rose-400 text-sm mt-2 font-medium">{errors.name.message}</p>}
              </div>

              <div className="mb-6">
                <label htmlFor="modal-phone" className="block text-sm font-semibold text-amber-100 mb-3 tracking-wide">
                  Herald's Call (Phone) *
                </label>
                <input
                  {...register('phone')}
                  type="tel"
                  id="modal-phone"
                  className="w-full px-5 py-4 rounded-2xl border-2 border-purple-600/50 focus:ring-4 focus:ring-amber-500/30 focus:border-amber-400 bg-purple-800/60 text-amber-100 placeholder-purple-300 transition-all duration-200 shadow-inner hover:shadow-lg"
                  placeholder="+256 700 000 000"
                />
                {errors.phone && <p className="text-rose-400 text-sm mt-2 font-medium">{errors.phone.message}</p>}
              </div>

              <div className="mb-8">
                <label htmlFor="modal-email" className="block text-sm font-semibold text-amber-100 mb-3 tracking-wide">
                  Missive (Email, Optional)
                </label>
                <input
                  {...register('email')}
                  type="email"
                  id="modal-email"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  placeholder="guest@example.com"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
              </div>

              {submitMessage && (
                <div
                  className={`mb-8 p-6 rounded-2xl border-2 shadow-xl ${
                    submitMessage.type === 'success'
                      ? 'bg-amber-900/50 text-amber-100 border-amber-400/50'
                      : 'bg-rose-900/50 text-rose-100 border-rose-400/50'
                  }`}
                >
                  {submitMessage.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-purple-600 via-purple-500 to-amber-500 text-white py-5 rounded-2xl font-serif font-semibold text-lg tracking-wide hover:from-purple-700 hover:via-purple-600 hover:to-amber-600 transition-all duration-300 shadow-2xl hover:shadow-3xl disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3 transform hover:-translate-y-0.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sealing Thy Covenant...
                  </>
                ) : (
                  'Seal Thy Attendance'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}