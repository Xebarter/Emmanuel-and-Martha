import { Heart, MapPin, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CoupleInfo } from '../lib/types';

interface HeroSectionProps {
  coupleInfo: CoupleInfo;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function HeroSection({ coupleInfo }: HeroSectionProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const weddingDate = new Date(coupleInfo.wedding_date);
      const now = new Date();

      const totalSeconds = Math.max(0, Math.floor((weddingDate.getTime() - now.getTime()) / 1000));

      const days = Math.floor(totalSeconds / (24 * 60 * 60));
      const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
      const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
      const seconds = totalSeconds % 60;

      setTimeRemaining({ days, hours, minutes, seconds });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [coupleInfo.wedding_date]);

  const formatWeddingDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get names - support both formats
  const displayNames = coupleInfo.names ||
    (coupleInfo.bride_name && coupleInfo.groom_name
      ? `${coupleInfo.groom_name} & ${coupleInfo.bride_name}`
      : 'Our Wedding');

  const displayLocation = coupleInfo.location || coupleInfo.venue || 'TBA';
  const displayTagline = coupleInfo.tagline || 'Join us as we celebrate our love';

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 wedding-font">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(251,191,36,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(244,114,182,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(251,113,133,0.15),transparent_50%)]"></div>
      </div>

      {/* Floating hearts decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          >
            <Heart className="w-4 h-4 text-rose-300 opacity-40" />
          </div>
        ))}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 text-center">
        {/* Heart icon with glow effect */}
        <div className="mb-10 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-rose-400 blur-2xl opacity-30 rounded-full"></div>
            <div className="relative p-5 bg-white/80 backdrop-blur-sm rounded-full shadow-2xl border border-rose-100">
              <Heart className="w-14 h-14 text-rose-500 fill-rose-500 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Main heading with elegant typography */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 bg-clip-text text-transparent mb-6 leading-tight" style={{ fontFamily: 'Tangerine, cursive' }}>
          {displayNames}
        </h1>

        {/* Tagline */}
        <p className="text-xl md:text-2xl text-gray-700 mb-8 font-light italic max-w-2xl mx-auto">
          "{displayTagline}"
        </p>

        {/* Wedding details with icons */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-12 text-gray-600">
          <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm px-6 py-3 rounded-full shadow-md border border-rose-100">
            <Calendar className="w-5 h-5 text-rose-500" />
            <span className="font-medium">{formatWeddingDate(coupleInfo.wedding_date)}</span>
          </div>
          <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm px-6 py-3 rounded-full shadow-md border border-rose-100">
            <MapPin className="w-5 h-5 text-rose-500" />
            <span className="font-medium">{displayLocation}</span>
          </div>
        </div>

        {/* Countdown timer with modern cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto mb-12">
          {[
            { label: 'Days', value: timeRemaining.days },
            { label: 'Hours', value: timeRemaining.hours },
            { label: 'Minutes', value: timeRemaining.minutes },
            { label: 'Seconds', value: timeRemaining.seconds },
          ].map((item, index) => (
            <div
              key={item.label}
              className="group bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 md:p-8 border border-rose-100 hover:shadow-2xl hover:scale-105 transition-all duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="text-4xl md:text-6xl font-bold bg-gradient-to-br from-rose-500 to-pink-500 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">
                {item.value.toString().padStart(2, '0')}
              </div>
              <div className="text-xs md:text-sm text-gray-600 font-semibold uppercase tracking-wider">
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* Call to action text */}
        <div className="max-w-2xl mx-auto">
          <p className="text-gray-700 leading-relaxed text-lg">
            Your presence and support mean the world to us as we begin this beautiful journey together.
          </p>
        </div>

        {/* Decorative divider */}
        <div className="mt-12 flex items-center justify-center gap-4">
          <div className="h-px w-24 bg-gradient-to-r from-transparent to-rose-300"></div>
          <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
          <div className="h-px w-24 bg-gradient-to-l from-transparent to-rose-300"></div>
        </div>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
            opacity: 0;
          }
          50% {
            opacity: 0.4;
          }
          100% {
            transform: translateY(-100px) translateX(20px);
            opacity: 0;
          }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}