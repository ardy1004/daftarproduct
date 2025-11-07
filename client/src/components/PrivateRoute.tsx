
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Session, User } from '@supabase/supabase-js';

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

const PrivateRoute = ({ children, requiredRole }: PrivateRouteProps) => {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Session check error:', error);
          if (isMounted) {
            setSession(null);
            setUser(null);
            setIsLoading(false);
          }
          return;
        }

        if (isMounted) {
          setSession(data.session);
          setUser(data.session?.user || null);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Unexpected error during session check:', error);
        if (isMounted) {
          setSession(null);
          setUser(null);
          setIsLoading(false);
        }
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);

      if (isMounted) {
        setSession(session);
        setUser(session?.user || null);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!session || !user) {
    // Save the attempted location for redirect after login
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Check role-based access if required
  if (requiredRole) {
    // For now, we'll assume all authenticated users are admins
    // In a real app, you'd check user roles from a database
    const userRole = user.user_metadata?.role || 'user';
    if (userRole !== requiredRole && userRole !== 'admin') {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-card rounded-xl border border-border p-8 text-center shadow-lg">
            <h2 className="text-2xl font-bold text-foreground mb-4">Akses Ditolak</h2>
            <p className="text-muted-foreground mb-6">
              Anda tidak memiliki izin untuk mengakses halaman ini.
            </p>
            <Navigate to="/" replace />
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default PrivateRoute;
