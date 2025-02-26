
import { createClient } from '@supabase/supabase-js';
import { Database } from './types';
import { toast } from 'sonner';

const supabaseUrl = 'https://hkpgkogqxnamvlptxhat.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrcGdrb2dxeG5hbXZscHR4aGF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk5MjkxNzgsImV4cCI6MjA1NTUwNTE3OH0.LebUJNQy2LoZZytuXnbdG7MB25hfht1CYKZHSFhgd7A';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Helper function to get the current session
export const getCurrentSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error.message);
    return null;
  }
  return session;
};

// Helper function to get the current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting user:', error.message);
    return null;
  }
  return user;
};

// Website-specific message handlers
const handleWebsiteMessage = async (event: MessageEvent) => {
  // Only accept messages from our extension
  if (event.origin !== 'chrome-extension://your-extension-id') return;

  switch (event.data.type) {
    case 'EXTENSION_CONNECTED':
      toast.success('Chrome extension connected');
      break;
    case 'SYNC_REQUEST':
      const session = await getCurrentSession();
      window.postMessage({ 
        type: 'SYNC_RESPONSE', 
        payload: { session } 
      }, '*');
      break;
    case 'SUBSCRIPTION_UPDATE':
      // Handle subscription updates from extension
      if (event.data.payload?.subscription) {
        await setupSubscriptionListeners(event.data.payload.subscription.user_id);
      }
      break;
    default:
      console.log('Unknown message type:', event.data.type);
  }
};

// Set up website message listeners
if (typeof window !== 'undefined') {
  window.addEventListener('message', handleWebsiteMessage);
}

// Listen for extension-specific events
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'CHECK_AUTH_STATUS') {
      getCurrentSession().then(session => {
        sendResponse({ isAuthenticated: !!session });
      });
      return true; // Required for async response
    }
  });
}

// Set up real-time subscription listeners
export const setupSubscriptionListeners = (userId: string) => {
  const channel = supabase
    .channel('subscription_updates')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'subscriptions',
        filter: `user_id=eq.${userId}`
      },
      async (payload) => {
        console.log('Subscription updated:', payload);
        // Update local storage with new subscription data
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', userId)
          .single();
          
        if (subscription) {
          // Notify both website and extension of subscription changes
          window.postMessage({ 
            type: 'SUBSCRIPTION_UPDATED', 
            payload: subscription 
          }, '*');
          
          if (typeof chrome !== 'undefined' && chrome.storage) {
            await chrome.storage.local.set({ user_subscription: subscription });
          }
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Export cleanup function for components to use
export const cleanupListeners = () => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('message', handleWebsiteMessage);
  }
};
