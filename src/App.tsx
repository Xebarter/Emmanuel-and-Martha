import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Login, { Unauthorized } from './pages/Login';
import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (!isSupabaseConnected) {
      console.warn('Running in offline mode - Supabase is not connected');
      setOfflineMode(true);
    }
  }, []);

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
      bride_name: 'The Bride',
      groom_name: 'The Groom',
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
      <Route path="/" element={
        <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50">
          <HeroSection coupleInfo={safeMetadata.couple} />
          <GallerySection />
          <ContributeSection totalContributions={safeMetadata.counts.total_contributions} />
          <PledgeSection totalPledges={safeMetadata.counts.total_pledges} />
          <MeetingsSection />
          <GuestbookSection />
          <Footer />
        </div>
      } />

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