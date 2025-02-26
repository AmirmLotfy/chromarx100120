
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/stores/authStore';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { chromeDb } from '@/lib/chrome-storage';

interface AuthProviderProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export const AuthProvider = ({ children, requireAuth = false }: AuthProviderProps) => {
  const { user, isLoading, initialized } = useAuth();
  const navigate = useNavigate();

  // Listen for auth state changes from Supabase
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (event === 'SIGNED_IN') {
        // Sync auth state with extension storage
        await chromeDb.set('auth_session', session);
        toast.success('Successfully signed in');
      } else if (event === 'SIGNED_OUT') {
        // Clear auth data from extension storage
        await chromeDb.remove('auth_session');
        await chromeDb.remove('user_subscription');
        toast.success('Successfully signed out');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Listen for extension messages
  useEffect(() => {
    const handleExtensionMessage = async (event: MessageEvent) => {
      if (event.source !== window) return;
      
      if (event.data.type === 'CHROMARX_SIGN_OUT') {
        await supabase.auth.signOut();
        navigate('/auth', { replace: true });
      }
    };

    window.addEventListener('message', handleExtensionMessage);
    return () => window.removeEventListener('message', handleExtensionMessage);
  }, [navigate]);

  useEffect(() => {
    if (!initialized) return;

    if (requireAuth && !isLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, isLoading, initialized, requireAuth, navigate]);

  if (!initialized || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (requireAuth && !user) {
    return null;
  }

  return <>{children}</>;
};

export default AuthProvider;
