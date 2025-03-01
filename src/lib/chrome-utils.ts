
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface ChromeUser {
  id: string;
  uid: string; // Added for compatibility
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  getIdToken: () => Promise<string>;
}

export interface ChromeStorageData {
  currentUser: ChromeUser | null;
  preferences: Record<string, any>;
  subscriptions: Record<string, any>;
  bookmarks: Record<string, any>;
  installDate: number;
  hasRated: boolean;
  lastRatingPrompt: number;
}

export const getSecret = async (key: string): Promise<string | null> => {
  try {
    const result = await chrome.storage.sync.get(key);
    return result[key] || null;
  } catch (error) {
    console.error(`Error getting secret ${key}:`, error);
    return null;
  }
};

export const storage = {
  async get<T>(key: keyof ChromeStorageData): Promise<T | null> {
    try {
      const result = await chrome.storage.sync.get(key);
      return result[key] || null;
    } catch (error) {
      console.error('Error reading from chrome storage:', error);
      return null;
    }
  },

  async set(key: keyof ChromeStorageData, value: any): Promise<void> {
    try {
      await chrome.storage.sync.set({ [key]: value });
    } catch (error) {
      console.error('Error writing to chrome storage:', error);
      throw error;
    }
  },

  async remove(key: keyof ChromeStorageData): Promise<void> {
    try {
      await chrome.storage.sync.remove(key);
    } catch (error) {
      console.error('Error removing from chrome storage:', error);
      throw error;
    }
  }
};

export const auth = {
  async getCurrentUser(): Promise<ChromeUser | null> {
    try {
      const token = await chrome.identity.getAuthToken({ interactive: false });
      if (!token) return null;

      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token.token}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user info');
      }

      const data = await response.json();
      const user: ChromeUser = {
        id: data.sub,
        uid: data.sub, // Set uid same as id for compatibility
        email: data.email,
        displayName: data.name,
        photoURL: data.picture,
        getIdToken: async () => token.token // Added getIdToken method
      };
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  async signIn(): Promise<ChromeUser> {
    try {
      const token = await chrome.identity.getAuthToken({ interactive: true });
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token.token}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user info');
      }

      const data = await response.json();
      const user: ChromeUser = {
        id: data.sub,
        uid: data.sub,
        email: data.email,
        displayName: data.name,
        photoURL: data.picture,
        getIdToken: async () => token.token
      };

      await storage.set('currentUser', user);
      return user;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  },

  async signOut(): Promise<void> {
    try {
      const token = await chrome.identity.getAuthToken({ interactive: false });
      if (token) {
        await chrome.identity.removeCachedAuthToken({ token: token.token });
      }
      await storage.remove('currentUser');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }
};

// Add helper for checking if the extension is installed on this browser
export const checkExtensionInstalled = async (): Promise<boolean> => {
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};

// Add helper for generating device ID
export const getDeviceId = async (): Promise<string> => {
  try {
    // Try to get from storage first
    const deviceId = localStorage.getItem('deviceId');
    if (deviceId) return deviceId;
    
    // Generate new one if not exists
    const newDeviceId = crypto.randomUUID();
    localStorage.setItem('deviceId', newDeviceId);
    return newDeviceId;
  } catch (error) {
    console.error("Error generating device ID:", error);
    // Fallback
    return `device-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
};

// Add device info
export const getDeviceInfo = async (): Promise<{
  deviceId: string;
  deviceName: string;
  deviceType: string;
  browser: string;
}> => {
  const deviceId = await getDeviceId();
  
  // Get device name using navigator info
  const userAgent = navigator.userAgent;
  let deviceName = 'Unknown Device';
  let deviceType = 'desktop';
  let browser = 'unknown';
  
  // Detect browser
  if (userAgent.indexOf('Chrome') > -1) {
    browser = 'chrome';
  } else if (userAgent.indexOf('Firefox') > -1) {
    browser = 'firefox';
  } else if (userAgent.indexOf('Safari') > -1) {
    browser = 'safari';
  } else if (userAgent.indexOf('Edge') > -1 || userAgent.indexOf('Edg') > -1) {
    browser = 'edge';
  }
  
  // Detect device type
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
    deviceType = 'mobile';
    
    if (/iPad|Tablet/i.test(userAgent)) {
      deviceType = 'tablet';
    }
  }
  
  // Create device name
  const platform = navigator.platform || 'Unknown';
  deviceName = `${browser.charAt(0).toUpperCase() + browser.slice(1)} on ${platform}`;
  
  return {
    deviceId,
    deviceName,
    deviceType,
    browser
  };
};

// Add function to register device with backend
export const registerDevice = async (): Promise<boolean> => {
  try {
    const user = await auth.getCurrentUser();
    if (!user) return false;
    
    const deviceInfo = await getDeviceInfo();
    
    // Check if device already registered
    const { data: existingDevice } = await supabase
      .from('devices')
      .select('*')
      .eq('device_id', deviceInfo.deviceId)
      .eq('user_id', user.id)
      .single();
    
    if (existingDevice) {
      // Update device status
      await supabase
        .from('devices')
        .update({
          is_online: true,
          last_active: new Date().toISOString()
        })
        .eq('device_id', deviceInfo.deviceId);
    } else {
      // Register new device
      await supabase
        .from('devices')
        .insert({
          device_id: deviceInfo.deviceId,
          device_name: deviceInfo.deviceName,
          device_type: deviceInfo.deviceType,
          user_id: user.id,
          is_online: true
        });
    }
    
    // Set up device status update on window events
    window.addEventListener('beforeunload', async () => {
      try {
        await supabase
          .from('devices')
          .update({
            is_online: false,
            last_active: new Date().toISOString()
          })
          .eq('device_id', deviceInfo.deviceId);
      } catch (error) {
        // Silently fail, since we're unloading anyway
      }
    });
    
    // Heartbeat to update device status periodically
    setInterval(async () => {
      if (navigator.onLine) {
        try {
          await supabase
            .from('devices')
            .update({
              is_online: true,
              last_active: new Date().toISOString()
            })
            .eq('device_id', deviceInfo.deviceId);
        } catch (error) {
          console.error("Error updating device status:", error);
        }
      }
    }, 1000 * 60 * 5); // Every 5 minutes
    
    return true;
  } catch (error) {
    console.error("Error registering device:", error);
    return false;
  }
};
