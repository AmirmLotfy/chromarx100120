
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { storage } from './chrome-utils';

const supabaseUrl = 'https://hkpgkogqxnamvlptxhat.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrcGdrb2dxeG5hbXZscHR4aGF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk5MjkxNzgsImV4cCI6MjA1NTUwNTE3OH0.LebUJNQy2LoZZytuXnbdG7MB25hfht1CYKZHSFhgd7A';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const signInWithGoogle = async () => {
  try {
    // Get the current window dimensions for centered popup
    const width = 600;
    const height = 600;
    const left = screen.width / 2 - width / 2;
    const top = screen.height / 2 - height / 2;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: chrome.identity.getRedirectURL(),
        queryParams: {
          prompt: 'select_account'
        }
      }
    });

    if (error) throw error;

    // Store user data in Chrome storage
    if (data?.user) {
      await storage.set('currentUser', {
        id: data.user.id,
        email: data.user.email,
        displayName: data.user.user_metadata?.full_name,
        photoURL: data.user.user_metadata?.avatar_url,
        getIdToken: async () => (await supabase.auth.getSession())?.data?.session?.access_token || null
      });
      
      toast.success('Successfully signed in!');
    }

    return data;
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    toast.error(error.message || 'Failed to sign in with Google');
    throw error;
  }
};

export const signOut = async () => {
  try {
    await supabase.auth.signOut();
    await storage.remove('currentUser');
    toast.success('Successfully signed out');
  } catch (error: any) {
    console.error('Error signing out:', error);
    toast.error(error.message || 'Failed to sign out');
    throw error;
  }
};

// Listen for auth state changes
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session?.user) {
    await storage.set('currentUser', {
      id: session.user.id,
      email: session.user.email,
      displayName: session.user.user_metadata?.full_name,
      photoURL: session.user.user_metadata?.avatar_url,
      getIdToken: async () => session.access_token
    });
  } else if (event === 'SIGNED_OUT') {
    await storage.remove('currentUser');
  }
});
