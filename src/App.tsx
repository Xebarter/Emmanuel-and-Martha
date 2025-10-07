import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Login, { Unauthorized } from './pages/Login';
import { useState, useEffect, useRef } from 'react';
import { isSupabaseConnected } from './lib/supabase';
import { AdminRoutes } from './routes/AdminRoutes';

// Public pages
import { useMetadata } from './hooks/useMetadata';
import { HeroSection } from './components/HeroSection';
import { GallerySection } from './components/GallerySection';
import { ContributeSection } from './components/ContributeSection';
import { PledgeSection } from './components/PledgeSection';
import { MeetingsSection } from './components/MeetingsSection';
import { GuestbookSection } from './components/GuestbookSection';
import { Footer } from './components/Footer';

// Payment pages
import CallbackPage from './pages/Callback';
import CancelPage from './pages/Cancel';
import IPNPage from './pages/IPN';

// Main App component with routing
function AppContent() {
  console.log('[AppContent] Rendering...');
  const { metadata, loading, error: metadataError } = useMetadata();
  const { loading: authLoading, isAuthenticated } = useAuth();
  const [offlineMode, setOfflineMode] = useState(!isSupabaseConnected);
  const location = useLocation();
  const navigate = useNavigate();
  const homeRef = useRef<HTMLDivElement>(null);

  // Update meta tags for SEO and social sharing
  useEffect(() => {
    // Update basic meta tags
    document.title = 'John and Priscilla';
    
    // Update or create meta tags
    const updateMetaTag = (selector: string, attribute: string, value: string, isProperty = false) => {
      let tag = document.querySelector(selector);
      if (!tag) {
        tag = document.createElement('meta');
        if (isProperty) {
          tag.setAttribute('property', attribute);
        } else {
          tag.setAttribute('name', attribute);
        }
        document.head.appendChild(tag);
      }
      tag.setAttribute(isProperty ? 'property' : 'name', attribute);
      tag.content = value;
    };

    // Update all relevant meta tags
    updateMetaTag('meta[name="title"]', 'title', 'John and Priscilla');
    updateMetaTag('meta[name="description"]', 'description', 'Join us as we celebrate our love');
    
    // Open Graph tags
    updateMetaTag('meta[property="og:title"]', 'og:title', 'John and Priscilla', true);
    updateMetaTag('meta[property="og:description"]', 'og:description', 'Join us as we celebrate our love', true);
    updateMetaTag('meta[property="og:type"]', 'og:type', 'website', true);
    updateMetaTag('meta[property="og:url"]', 'og:url', 'https://johnandpriscilla.vercel.app/', true);
    updateMetaTag('meta[property="og:image"]', 'og:image', 'https://johnandpriscilla.vercel.app/og-image.jpg', true);
    
    // Twitter tags
    updateMetaTag('meta[property="twitter:card"]', 'twitter:card', 'summary_large_image', true);
    updateMetaTag('meta[property="twitter:title"]', 'twitter:title', 'John and Priscilla', true);
    updateMetaTag('meta[property="twitter:description"]', 'twitter:description', 'Join us as we celebrate our love', true);
    updateMetaTag('meta[property="twitter:image"]', 'twitter:image', 'https://johnandpriscilla.vercel.app/og-image.jpg', true);
    
    // Update image tags if we have gallery data
    if (metadata?.gallery && metadata.gallery.length > 0) {
      const imageUrl = metadata.gallery[0].url;
      updateMetaTag('meta[property="og:image"]', 'og:image', imageUrl, true);
      updateMetaTag('meta[property="twitter:image"]', 'twitter:image', imageUrl, true);
    } else {
      // Fallback image
      const fallbackImageUrl = 'https://johnandpriscilla.vercel.app/og-image.svg';
      updateMetaTag('meta[property="og:image"]', 'og:image', fallbackImageUrl, true);
      updateMetaTag('meta[property="twitter:image"]', 'twitter:image', fallbackImageUrl, true);
    }
  }, [metadata]);

  useEffect(() => {
    if (!isSupabaseConnected) {
      console.warn('Running in offline mode - Supabase is not connected');
      setOfflineMode(true);
    }
  }, []);

  // Handle scrolling to sections
  useEffect(() => {
    // Check if we're on a section route
    const sectionRoutes = ['/contribute', '/pledge', '/meetings', '/guestbook'];
    if (sectionRoutes.includes(location.pathname)) {
      // Navigate to home page with hash
      const sectionMap: Record<string, string> = {
        '/contribute': '#contribute',
        '/pledge': '#pledge',
        '/meetings': '#meetings',
        '/guestbook': '#guestbook'
      };
      
      const hash = sectionMap[location.pathname];
      navigate(`/${hash}`, { replace: true });
    }
    
    // Scroll to section if hash is present
    if (location.hash) {
      // Use requestAnimationFrame to ensure DOM is ready
      const scrollToIntendedSection = () => {
        const element = document.querySelector(location.hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        } else {
          // If element is not found, try again after a short delay
          setTimeout(() => {
            const delayedElement = document.querySelector(location.hash);
            if (delayedElement) {
              delayedElement.scrollIntoView({ behavior: 'smooth' });
            }
          }, 500);
        }
      };
      
      // Try to scroll immediately
      if (document.readyState === 'loading') {
        // If document is still loading, wait for it to complete
        window.addEventListener('DOMContentLoaded', scrollToIntendedSection);
      } else {
        // If document is already loaded, scroll immediately
        requestAnimationFrame(scrollToIntendedSection);
      }
    }
  }, [location, navigate]);

  console.log('[AppContent] States:', {
    metadataLoading: loading,
    authLoading,
    hasError: !!metadataError,
    hasMetadata: !!metadata,
    isAuthenticated,
    offlineMode,
    timestamp: new Date().toISOString()
  });

  // Show loading state while initializing (only if we're not in offline mode)
  if ((loading || authLoading) && !offlineMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error state if there's an error
  if (metadataError && !offlineMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-rose-100">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load</h2>
            <p className="text-gray-600 mb-4 text-sm">
              {typeof metadataError === 'string'
                ? metadataError
                : metadataError?.message || 'An error occurred while loading the application'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Provide default metadata if none exists (fallback for development)
  const safeMetadata = metadata || {
    couple: {
      bride_name: 'Priscilla',
      groom_name: 'John',
      wedding_date: new Date().toISOString(),
      venue: 'Beautiful Venue',
      tagline: 'Celebrating Our Love'
    },
    counts: {
      total_contributions: 0,
      total_pledges: 0,
      total_meetings: 0,
      total_guests: 0
    }
  };

  return (
    <Routes>
      {/* Public routes */}
      <Route path="*" element={
        <div ref={homeRef} className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50">
          <HeroSection coupleInfo={safeMetadata.couple} />
          <GallerySection />
          <div id="contribute">
            <ContributeSection totalContributions={safeMetadata.counts.total_contributions} />
          </div>
          <div id="pledge">
            <PledgeSection totalPledges={safeMetadata.counts.total_pledges} />
          </div>
          <div id="meetings">
            <MeetingsSection />
          </div>
          <div id="guestbook">
            <GuestbookSection />
          </div>
          <Footer />
        </div>
      } />

      {/* Section routes that redirect to homepage sections */}
      <Route path="/contribute" element={<Navigate to="/#contribute" replace />} />
      <Route path="/pledge" element={<Navigate to="/#pledge" replace />} />
      <Route path="/meetings" element={<Navigate to="/#meetings" replace />} />
      <Route path="/guestbook" element={<Navigate to="/#guestbook" replace />} />

      {/* Payment routes */}
      <Route path="/callback" element={<CallbackPage />} />
      <Route path="/cancel" element={<CancelPage />} />
      <Route path="/ipn" element={<IPNPage />} />

      {/* Auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Admin routes - accessible via both /admin and /dashboard */}
      <Route path="/admin/*" element={<AdminRoutes />} />
      
      <Route path="/dashboard/*" element={<AdminRoutes />} />

      {/* Catch all other routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}


// Main App component
function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <AppContent />
    </div>
  );
}

export default App;