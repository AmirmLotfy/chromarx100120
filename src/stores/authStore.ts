
import { create } from 'zustand';
import { supabase, getCurrentSession, getCurrentUser } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  initialized: false,

  initialize: async () => {
    try {
      const [session, user] = await Promise.all([
        getCurrentSession(),
        getCurrentUser()
      ]);

      set({ 
        session, 
        user, 
        isLoading: false, 
        initialized: true 
      });

      // Listen for auth state changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        const user = session?.user ?? null;
        set({ user, session });

        if (event === 'SIGNED_OUT') {
          // Clear any local data if needed
          toast.success('Signed out successfully');
        } else if (event === 'SIGNED_IN') {
          toast.success('Signed in successfully');
        }
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ isLoading: false, initialized: true });
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      set({ isLoading: true });
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error) {
      toast.error('Failed to sign in');
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signUp: async (email: string, password: string) => {
    try {
      set({ isLoading: true });
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      toast.success('Check your email to confirm your account');
    } catch (error) {
      toast.error('Failed to sign up');
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true });
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      toast.error('Failed to sign out');
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));

// Initialize auth state when the store is first used
if (typeof window !== 'undefined') {
  useAuth.getState().initialize();
}

