import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'user';
}

export function ProtectedRoute({ children, requiredRole = 'user' }: ProtectedRouteProps) {
  const { isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Redirect to login page, but save the current location they were trying to go to
      navigate('/login', { state: { from: location } });
    } else if (!loading && isAuthenticated && requiredRole === 'admin' && user?.role !== 'admin') {
      // User is logged in but doesn't have the required role
      navigate('/unauthorized');
    }
  }, [isAuthenticated, loading, navigate, location, user, requiredRole]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRole === 'admin' && user?.role !== 'admin') {
    return null;
  }

  return <>{children}</>;
}