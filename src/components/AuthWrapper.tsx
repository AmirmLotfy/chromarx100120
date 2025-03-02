
import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

interface AuthWrapperProps {
  children: ReactNode;
}

/**
 * A wrapper component that checks if the user is authenticated
 * and redirects to the login page if not.
 */
const AuthWrapper = ({ children }: AuthWrapperProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  // Show nothing while checking authentication status
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // If not loading and we have a user, render children
  return user ? <>{children}</> : null;
};

export default AuthWrapper;
