import { Heart, MapPin, Calendar, Loader2, DollarSign } from 'lucide-react';
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface CoupleInfo {
  bride_name?: string;
  groom_name?: string;
  names?: string;
  wedding_date: string;
  location?: string;
  venue?: string;
  tagline?: string;
  wedding_time?: string;
}

interface SiteSettings {
  heroSection?: {
    backgroundImageUrl?: string;
    backgroundOverlayOpacity?: number;
    heartIconColor?: string;
    headingText?: string;
    taglineText?: string;
    ctaText?: string;
  };
}

interface HeroSectionProps {
  coupleInfo: CoupleInfo;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface GalleryImage {
  id: string;
  url: string;
  created_at: string;
}

export function HeroSection({ coupleInfo }: HeroSectionProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({});
  const [weddingDetails, setWeddingDetails] = useState<CoupleInfo>(coupleInfo);
  const [loading, setLoading] = useState(true);
  const carouselIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update meta tags for social sharing
  useEffect(() => {
    const updateMetaTags = () => {
      // Update title
      const title = 'John and Priscilla';
      document.title = title;
      
      // Update meta tags
      let metaTitle = document.querySelector('meta[name="title"]');
      if (!metaTitle) {
        metaTitle = document.createElement('meta');
        metaTitle.name = 'title';
        document.head.appendChild(metaTitle);
      }
      metaTitle.content = title;
      
      // Update Open Graph title
      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (!ogTitle) {
        ogTitle = document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title');
        document.head.appendChild(ogTitle);
      }
      ogTitle.content = title;
      
      // Update Twitter title
      let twitterTitle = document.querySelector('meta[property="twitter:title"]');
      if (!twitterTitle) {
        twitterTitle = document.createElement('meta');
        twitterTitle.setAttribute('property', 'twitter:title');
        document.head.appendChild(twitterTitle);
      }
      twitterTitle.content = title;
      
      // Update description
      const description = 'Join us as we celebrate our love';
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.name = 'description';
        document.head.appendChild(metaDescription);
      }
      metaDescription.content = description;
      
      // Update Open Graph description
      let ogDescription = document.querySelector('meta[property="og:description"]');
      if (!ogDescription) {
        ogDescription = document.createElement('meta');
        ogDescription.setAttribute('property', 'og:description');
        document.head.appendChild(ogDescription);
      }
      ogDescription.content = description;
      
      // Update Twitter description
      let twitterDescription = document.querySelector('meta[property="twitter:description"]');
      if (!twitterDescription) {
        twitterDescription = document.createElement('meta');
        twitterDescription.setAttribute('property', 'twitter:description');
        document.head.appendChild(twitterDescription);
      }
      twitterDescription.content = description;
      
      // Update Open Graph image (use first gallery image if available)
      let ogImage = document.querySelector('meta[property="og:image"]');
      if (!ogImage) {
        ogImage = document.createElement('meta');
        ogImage.setAttribute('property', 'og:image');
        document.head.appendChild(ogImage);
      }
      
      // Update Twitter image (use first gallery image if available)
      let twitterImage = document.querySelector('meta[property="twitter:image"]');
      if (!twitterImage) {
        twitterImage = document.createElement('meta');
        twitterImage.setAttribute('property', 'twitter:image');
        document.head.appendChild(twitterImage);
      }
      
      // If we have gallery images, use the first one for social previews
      if (galleryImages.length > 0) {
        ogImage.content = galleryImages[0].url;
        twitterImage.content = galleryImages[0].url;
      } else {
        // Fallback to default image
        ogImage.content = 'https://johnandpriscilla.vercel.app/default-og-image.jpg';
        twitterImage.content = 'https://johnandpriscilla.vercel.app/default-og-image.jpg';
      }
    };
    
    updateMetaTags();
  }, [galleryImages]);

  // Fetch site settings for hero section customization
  useEffect(() => {
    const fetchSiteSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'hero_section');

        if (error) throw error;
        
        // Check if we have data and it's not empty
        if (data && data.length > 0 && data[0].value) {
          setSiteSettings(data[0].value);
        }
      } catch (error) {
        console.error('Error fetching site settings:', error);
        // Continue with default settings if there's an error
      }
    };

    fetchSiteSettings();

    // Set up real-time subscription to site settings
    const subscription = supabase
      .channel('site-settings-changes')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'site_settings',
          filter: 'key=eq.hero_section'
        }, 
        (payload) => {
          if (payload.new?.value) {
            setSiteSettings(payload.new.value);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // Fetch wedding details from site settings
  useEffect(() => {
    const fetchWeddingDetails = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'couple_info');

        if (error) throw error;
        
        if (data && data.length > 0 && data[0].value) {
          setWeddingDetails(prev => ({
            ...prev,
            ...data[0].value,
            // Ensure we have a fallback to the prop values
            wedding_date: data[0].value.wedding_date || coupleInfo.wedding_date,
            location: data[0].value.location || coupleInfo.location,
            venue: data[0].value.venue || coupleInfo.venue,
            tagline: data[0].value.tagline || coupleInfo.tagline,
            wedding_time: data[0].value.wedding_time || coupleInfo.wedding_time
          }));
        } else {
          // Fallback to prop values if there's no data or value is null
          setWeddingDetails(coupleInfo);
        }
      } catch (error) {
        console.error('Error fetching wedding details:', error);
        // Fallback to prop values if there's an error
        setWeddingDetails(coupleInfo);
      } finally {
        setLoading(false);
      }
    };

    fetchWeddingDetails();

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
            setWeddingDetails(prev => ({
              ...prev,
              ...payload.new.value
            }));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [coupleInfo]);

  useEffect(() => {
    if (!weddingDetails.wedding_date) return;
    
    const calculateTimeRemaining = () => {
      // Combine date and time if available
      let weddingDateTime = weddingDetails.wedding_date;
      if (weddingDetails.wedding_time) {
        const [hours, minutes] = weddingDetails.wedding_time.split(':');
        const date = new Date(weddingDateTime);
        date.setHours(parseInt(hours, 10), parseInt(minutes || '0', 10), 0, 0);
        weddingDateTime = date.toISOString();
      }
      
      const weddingDate = new Date(weddingDateTime);
      const now = new Date();

      // If wedding date has passed, set all to zero
      if (weddingDate <= now) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const totalSeconds = Math.floor((weddingDate.getTime() - now.getTime()) / 1000);

      const days = Math.floor(totalSeconds / (24 * 60 * 60));
      const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
      const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
      const seconds = totalSeconds % 60;

      setTimeRemaining({ days, hours, minutes, seconds });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [weddingDetails.wedding_date, weddingDetails.wedding_time]);


  // Fetch gallery images
  useEffect(() => {
    const loadGalleryImages = async () => {
      try {
        // Importing galleryService here to avoid potential SSR issues
        const { galleryService } = await import('../services/galleryService');
        const images = await galleryService.getGalleryImages();
        if (images.length > 0) {
          // Take only the first 10 images for better performance
          setGalleryImages(images.slice(0, 10));
        }
      } catch (error) {
        console.error('Failed to load gallery images for carousel:', error);
        // Continue without images if there's an error
      }
    };

    loadGalleryImages();
  }, []);

  // Carousel effect
  useEffect(() => {
    if (galleryImages.length <= 1) return;

    const changeImage = () => {
      setCurrentImageIndex(prevIndex => (prevIndex + 1) % galleryImages.length);
    };

    carouselIntervalRef.current = setInterval(changeImage, 5000); // Change image every 5 seconds

    return () => {
      if (carouselIntervalRef.current) {
        clearInterval(carouselIntervalRef.current);
      }
    };
  }, [galleryImages.length]);

  const formatWeddingDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get names - use wedding details from site settings, fallback to prop values
  // Get names - default to 'John and Priscilla' if not specified
  const displayNames = useMemo(() => {
    if (weddingDetails.bride_name && weddingDetails.groom_name) {
      return `${weddingDetails.groom_name} and ${weddingDetails.bride_name}`;
    }
    if (weddingDetails.names) {
      // If names contain "Priscilla and John", change to "John and Priscilla"
      if (weddingDetails.names.includes("Priscilla and John")) {
        return "John and Priscilla";
      }
      return weddingDetails.names;
    }
    return 'John and Priscilla'; // Final fallback
  }, [weddingDetails.bride_name, weddingDetails.groom_name, weddingDetails.names]);

  // Format the wedding date with time if available
  const formatWeddingDateTime = useCallback(() => {
    if (!weddingDetails.wedding_date) return 'TBA';
    
    const date = new Date(weddingDetails.wedding_date);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    
    let formattedDate = date.toLocaleDateString('en-US', options);
    
    if (weddingDetails.wedding_time) {
      const [hours, minutes] = weddingDetails.wedding_time.split(':');
      const timeOptions: Intl.DateTimeFormatOptions = { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      };
      
      date.setHours(parseInt(hours, 10), parseInt(minutes || '0', 10));
      formattedDate += ` at ${date.toLocaleTimeString('en-US', timeOptions)}`;
    }
    
    return formattedDate;
  }, [weddingDetails.wedding_date, weddingDetails.wedding_time]);

  // Display location with improved venue handling
  const displayLocation = useMemo(() => {
    if (weddingDetails.venue && weddingDetails.location) {
      return `${weddingDetails.venue}, ${weddingDetails.location}`;
    }
    return weddingDetails.venue || weddingDetails.location || 'TBA';
  }, [weddingDetails.venue, weddingDetails.location]);
  
  const displayTagline = useMemo(() => {
    return weddingDetails.tagline || 'Join us as we celebrate our love';
  }, [weddingDetails.tagline]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 wedding-font">
      {/* Gallery image carousel background with parallax effect */}
      {galleryImages.length > 0 && (
        <div className="absolute inset-0 z-0">
          {galleryImages.map((image, index) => (
            <div 
              key={image.id}
              className={`absolute inset-0 transition-all duration-[2000ms] ease-in-out ${
                index === currentImageIndex ? 'opacity-100 scale-110' : 'opacity-0 scale-100'
              }`}
              style={{ 
                backgroundImage: `url(${image.url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                filter: 'brightness(1.1) contrast(1.3) saturate(1.3)'
              }}
            />
          ))}
          {/* Enhanced gradient overlay with better visibility */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-rose-950/30 to-purple-950/40"></div>
          {/* Reduced blur for better image clarity */}
          <div className="absolute inset-0 backdrop-blur-[1px]"></div>
        </div>
      )}

      {/* Refined mesh gradient background with reduced opacity */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-600/20 via-fuchsia-600/15 to-purple-600/20 animate-gradient"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(236,72,153,0.2),transparent_50%)] animate-pulse-slow"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(147,51,234,0.15),transparent_50%)] animate-pulse-slower"></div>
      </div>

      {/* Floating elements - hearts and sparkles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => ( // Reduced from 10 to 6 for better mobile performance
          <div
            key={i}
            className={`absolute ${i % 3 === 0 ? 'animate-float-slow' : i % 2 === 0 ? 'animate-float-medium' : 'animate-float-fast'}`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          >
            {i % 4 === 0 ? (
              <div className="w-1 h-1 bg-white rounded-full animate-twinkle" />
            ) : (
              <Heart className={`${i % 3 === 0 ? 'w-4 h-4' : 'w-3 h-3'} text-rose-200/30 fill-rose-200/20`} />
            )}
          </div>
        ))}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-20 text-center"> {/* Adjusted padding for mobile */}
        {/* Luxury heart icon with advanced effects */}
        <div className="mb-6 md:mb-12 flex justify-center animate-float-gentle"> {/* Reduced margin on mobile */}
          <div className="relative group">
            {/* Outer glow rings */}
            <div className="absolute inset-0 bg-gradient-to-r from-rose-400 to-fuchsia-500 blur-3xl opacity-50 rounded-full animate-pulse-glow"></div>
            <div className="absolute -inset-2 bg-gradient-to-r from-rose-300 to-pink-400 blur-2xl opacity-30 rounded-full animate-spin-slow"></div>
            
            {/* Main icon container */}
            <div className="relative p-2 sm:p-3 md:p-6 bg-gradient-to-br from-white/95 to-rose-50/95 backdrop-blur-xl rounded-full shadow-2xl border-2 border-white/50 group-hover:scale-110 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-100/50 to-fuchsia-100/50 rounded-full animate-pulse-subtle"></div>
              <Heart className="relative w-8 h-8 sm:w-10 sm:h-10 md:w-16 md:h-16 text-rose-500 fill-rose-500 drop-shadow-lg group-hover:scale-110 transition-transform duration-300" />
            </div>
          </div>
        </div>

        {/* Main heading with ultra-modern typography */}
        <div className="mb-4 md:mb-8 animate-fade-in-up">
          <h1 className="text-5xl xs:text-6xl sm:text-7xl md:text-9xl lg:text-[12rem] font-bold mb-3 md:mb-4 leading-none tracking-tight" 
            style={{ 
              fontFamily: 'Tangerine, cursive',
              background: 'linear-gradient(135deg, #ffffff 0%, #fecdd3 20%, #fda4af 40%, #fb7185 60%, #f43f5e 80%, #ffffff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 0 80px rgba(251, 113, 133, 0.5)',
              filter: 'drop-shadow(0 4px 20px rgba(244, 63, 94, 0.4))'
            }}>
            {displayNames}
          </h1>
          {/* Decorative line under names */}
          <div className="flex items-center justify-center gap-2 md:gap-3 mt-3 md:mt-6">
            <div className="h-[1px] md:h-[2px] w-8 xs:w-10 sm:w-14 md:w-20 bg-gradient-to-r from-transparent via-white to-rose-300"></div>
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full shadow-lg shadow-rose-300/50"></div>
            <div className="h-[1px] md:h-[2px] w-8 xs:w-10 sm:w-14 md:w-20 bg-gradient-to-l from-transparent via-white to-rose-300"></div>
          </div>
        </div>

        {/* Tagline with elegant styling */}
        <p className="text-sm xs:text-base sm:text-xl md:text-3xl text-white/95 mb-6 md:mb-12 font-light italic max-w-3xl mx-auto leading-relaxed drop-shadow-lg animate-fade-in-up px-2" style={{ animationDelay: '0.2s' }}>
          "{weddingDetails.tagline || 'Join us as we celebrate our love'}"
        </p>
                  
        {/* Enhanced loading state */}
        {loading && (
          <div className="flex justify-center items-center py-6 md:py-8">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xl px-4 py-2 rounded-xl sm:px-6 sm:py-3">
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 animate-spin text-white" />
              <span className="text-white/80 text-xs sm:text-sm md:text-base">Loading wedding details...</span>
            </div>
          </div>
        )}

        {/* Wedding details with modern glassmorphic cards */}
          {loading ? (
            <div className="flex justify-center items-center py-6 md:py-8">
              <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 animate-spin text-white drop-shadow-lg" />
            </div>
          ) : null}

        {/* Ultra-modern countdown timer */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-8 max-w-4xl mx-auto mb-6 sm:mb-8 md:mb-16 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          {[
            { label: 'Days', value: timeRemaining.days },
            { label: 'Hours', value: timeRemaining.hours },
            { label: 'Minutes', value: timeRemaining.minutes },
            { label: 'Seconds', value: timeRemaining.seconds },
          ].map((item) => (
            <div
              key={item.label}
              className="group relative overflow-hidden"
            >
              {/* Animated gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 to-fuchsia-600/20 rounded-2xl sm:rounded-3xl blur-lg sm:blur-xl group-hover:blur-2xl transition-all duration-500"></div>
              
              {/* Main card */}
              <div className="relative bg-white/15 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-2xl p-2 sm:p-3 md:p-8 border border-white/30 group-hover:border-white/50 group-hover:bg-white/25 group-hover:scale-105 transition-all duration-500">
                {/* Shimmer effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                </div>
                
                <div className="relative">
                  <div className="text-2xl xs:text-3xl sm:text-4xl md:text-7xl font-black text-white mb-0.5 sm:mb-1 md:mb-3 drop-shadow-2xl group-hover:scale-110 transition-transform duration-300" style={{
                    textShadow: '0 0 20px rgba(251, 113, 133, 0.8), 0 0 40px rgba(236, 72, 153, 0.5)'
                  }}>
                    {item.value.toString().padStart(2, '0')}
                  </div>
                  <div className="text-[0.5rem] xs:text-[0.6rem] sm:text-xs md:text-base text-white/90 font-bold uppercase tracking-wider drop-shadow-lg">
                    {item.label}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to action with premium styling */}
        <div className="max-w-3xl mx-auto mb-6 sm:mb-8 md:mb-12 animate-fade-in-up px-2" style={{ animationDelay: '0.8s' }}>
          <div className="relative group">
            {/* Glow effect */}
            <div className="absolute -inset-1 sm:-inset-2 md:-inset-4 bg-gradient-to-r from-rose-400 to-fuchsia-500 rounded-lg sm:rounded-xl md:rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
            
            {/* Content card */}
            <div className="relative bg-white/10 backdrop-blur-2xl rounded-lg sm:rounded-xl md:rounded-3xl p-3 sm:p-4 md:p-8 border border-white/20 shadow-2xl">
              <p className="text-white/95 leading-relaxed text-xs sm:text-sm md:text-xl lg:text-2xl font-light drop-shadow-lg">
                Your presence and support mean the world to us as we begin this beautiful journey together.
              </p>
            </div>
          </div>
        </div>

        {/* Elegant decorative divider */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-6 animate-fade-in-up" style={{ animationDelay: '1s' }}>
          <div className="h-[1px] w-8 xs:w-12 sm:w-20 md:w-32 bg-gradient-to-r from-transparent via-white/40 to-white/60"></div>
          <div className="relative">
            <div className="absolute inset-0 bg-white blur-sm opacity-50"></div>
            <Heart className="relative w-2 h-2 sm:w-3 sm:h-3 md:w-5 md:h-5 text-white fill-white drop-shadow-lg animate-pulse-gentle" />
          </div>
          <div className="h-[1px] w-8 xs:w-12 sm:w-20 md:w-32 bg-gradient-to-l from-transparent via-white/40 to-white/60"></div>
        </div>

        {/* Contribute button */}
        <div className="mt-8 animate-fade-in-up" style={{ animationDelay: '1.2s' }}>
          <button
            onClick={() => {
              const contributeSection = document.getElementById('contribute');
              if (contributeSection) {
                contributeSection.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="group relative px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-in-out"
          >
            <span className="relative z-10 flex items-center gap-2">
              Contribute
              <DollarSign className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-rose-400 to-pink-400 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          </button>
        </div>
      </div>

      {/* Advanced CSS animations */}
      <style>{`
        @keyframes float-slow {
          0%, 100% {
            transform: translateY(0px) translateX(0px) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.6;
          }
          90% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(-120vh) translateX(30px) rotate(180deg);
            opacity: 0;
          }
        }
        
        @keyframes float-medium {
          0%, 100% {
            transform: translateY(0px) translateX(0px) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.5;
          }
          90% {
            opacity: 0.5;
          }
          100% {
            transform: translateY(-100vh) translateX(-20px) rotate(-180deg);
            opacity: 0;
          }
        }
        
        @keyframes float-fast {
          0%, 100% {
            transform: translateY(0px) translateX(0px) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.4;
          }
          90% {
            opacity: 0.4;
          }
          100% {
            transform: translateY(-80vh) translateX(40px) rotate(360deg);
            opacity: 0;
          }
        }
        
        @keyframes float-gentle {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes twinkle {
          0%, 100% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            opacity: 1;
            transform: scale(1.5);
          }
        }
        
        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.5;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.1);
          }
        }
        
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes pulse-subtle {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
        }
        
        @keyframes pulse-gentle {
          0%, 100% {
            opacity: 0.8;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.1);
          }
        }
        
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.4;
          }
          50% {
            opacity: 0.6;
          }
        }
        
        @keyframes pulse-slower {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        .animate-float-slow {
          animation: float-slow 12s ease-in-out infinite;
        }
        
        .animate-float-medium {
          animation: float-medium 10s ease-in-out infinite;
        }
        
        .animate-float-fast {
          animation: float-fast 8s ease-in-out infinite;
        }
        
        .animate-float-gentle {
          animation: float-gentle 4s ease-in-out infinite;
        }
        
        .animate-twinkle {
          animation: twinkle 3s ease-in-out infinite;
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }
        
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        
        .animate-pulse-subtle {
          animation: pulse-subtle 4s ease-in-out infinite;
        }
        
        .animate-pulse-gentle {
          animation: pulse-gentle 2s ease-in-out infinite;
        }
        
        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out forwards;
          opacity: 0;
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 8s ease infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 6s ease-in-out infinite;
        }
        
        .animate-pulse-slower {
          animation: pulse-slower 8s ease-in-out infinite;
        }
        
        /* Responsive text sizes */
        @media (min-width: 480px) {
          .xs\\:text-5xl {
            font-size: 3rem;
            line-height: 1;
          }
          
          .xs\\:text-3xl {
            font-size: 1.875rem;
            line-height: 2.25rem;
          }
        }
        
        /* Hide floating elements on small screens for better performance */
        @media (max-width: 640px) {
          .animate-float-slow,
          .animate-float-medium,
          .animate-float-fast {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}