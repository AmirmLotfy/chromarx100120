
import { toast } from "sonner";

// Cache durations
const TOKEN_REFRESH_THRESHOLD = 10 * 60 * 1000; // 10 minutes in milliseconds
const USER_CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

// Token storage keys
const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const TOKEN_EXPIRY_KEY = 'auth_token_expiry';
const USER_INFO_KEY = 'auth_user_info';
const USER_INFO_TIMESTAMP_KEY = 'auth_user_info_timestamp';

// Auth state
let cachedUserInfo: any = null;
let refreshTokenPromise: Promise<string | null> | null = null;

interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

/**
 * Check if running in Chrome extension context
 */
export function isExtensionContext(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.identity;
}

/**
 * Get auth tokens (access and refresh) using chrome.identity
 */
export async function getAuthTokens(interactive: boolean = false): Promise<AuthTokens | null> {
  if (!isExtensionContext()) {
    console.warn('Not in Chrome extension context');
    return null;
  }

  try {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive }, async (token) => {
        if (chrome.runtime.lastError) {
          console.error('Error getting auth token:', chrome.runtime.lastError.message);
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (!token) {
          resolve(null);
          return;
        }

        // Get token info to check expiration
        try {
          const tokenInfo = await getTokenInfo(token);
          const expiresAt = Date.now() + (tokenInfo.expires_in * 1000);
          
          // Store tokens
          await storeTokens({
            accessToken: token,
            // In Chrome extensions, the refresh token is managed by the browser,
            // but we'll set the expiry for our auto-refresh logic
            expiresAt 
          });
          
          resolve({
            accessToken: token,
            expiresAt
          });
        } catch (error) {
          console.error('Error checking token info:', error);
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Error in getAuthTokens:', error);
    return null;
  }
}

/**
 * Store auth tokens in secure storage
 */
async function storeTokens(tokens: AuthTokens): Promise<void> {
  if (!isExtensionContext()) return;
  
  const storage = chrome.storage.local;
  
  await new Promise<void>((resolve) => {
    storage.set({
      [ACCESS_TOKEN_KEY]: tokens.accessToken,
      [TOKEN_EXPIRY_KEY]: tokens.expiresAt || 0
    }, () => resolve());
  });
}

/**
 * Clear stored auth tokens
 */
async function clearTokens(): Promise<void> {
  if (!isExtensionContext()) return;
  
  const storage = chrome.storage.local;
  
  await new Promise<void>((resolve) => {
    storage.remove([
      ACCESS_TOKEN_KEY,
      REFRESH_TOKEN_KEY,
      TOKEN_EXPIRY_KEY,
      USER_INFO_KEY,
      USER_INFO_TIMESTAMP_KEY
    ], () => resolve());
  });
  
  // Also clear cached user info
  cachedUserInfo = null;
}

/**
 * Get token info to check expiration
 */
async function getTokenInfo(token: string): Promise<any> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`
    );
    
    if (!response.ok) {
      throw new Error(`Token info request failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting token info:', error);
    throw error;
  }
}

/**
 * Get the current access token, refreshing if necessary
 */
export async function getAccessToken(forceRefresh: boolean = false): Promise<string | null> {
  if (!isExtensionContext()) {
    return null;
  }
  
  try {
    // Get the stored token and expiry time
    const storage = chrome.storage.local;
    const data = await new Promise<any>((resolve) => {
      storage.get([ACCESS_TOKEN_KEY, TOKEN_EXPIRY_KEY], (result) => resolve(result));
    });
    
    const token = data[ACCESS_TOKEN_KEY];
    const expiryTime = data[TOKEN_EXPIRY_KEY] || 0;
    
    // If we have a valid token that's not about to expire, return it
    if (
      token && 
      !forceRefresh && 
      expiryTime > Date.now() + TOKEN_REFRESH_THRESHOLD
    ) {
      return token;
    }
    
    // Need to refresh the token
    if (refreshTokenPromise) {
      // Return existing refresh promise if there's already one in progress
      return refreshTokenPromise;
    }
    
    // Create a new refresh token promise
    refreshTokenPromise = (async () => {
      try {
        // For Chrome extensions, we need to remove the existing token and get a new one
        if (token) {
          await new Promise<void>((resolve, reject) => {
            chrome.identity.removeCachedAuthToken({ token }, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });
        }
        
        // Get a new token
        const tokens = await getAuthTokens(false);
        return tokens?.accessToken || null;
      } catch (error) {
        console.error('Error refreshing token:', error);
        // Clear tokens on refresh failure
        await clearTokens();
        return null;
      } finally {
        refreshTokenPromise = null;
      }
    })();
    
    return refreshTokenPromise;
  } catch (error) {
    console.error('Error in getAccessToken:', error);
    return null;
  }
}

/**
 * Check if the user is currently authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAccessToken();
  return !!token;
}

/**
 * Sign in the user
 */
export async function signIn(): Promise<boolean> {
  try {
    // Get auth token with interactive flag set to true
    const tokens = await getAuthTokens(true);
    
    if (!tokens) {
      toast.error("Authentication failed");
      return false;
    }
    
    toast.success("Successfully signed in");
    return true;
  } catch (error) {
    console.error('Error signing in:', error);
    toast.error(`Sign in failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

/**
 * Sign out the user
 */
export async function signOut(): Promise<boolean> {
  if (!isExtensionContext()) {
    return false;
  }
  
  try {
    // Get the current token
    const token = await getAccessToken();
    
    if (token) {
      // Revoke the token
      await new Promise<void>((resolve, reject) => {
        chrome.identity.removeCachedAuthToken({ token }, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      });
      
      // Clear saved tokens
      await clearTokens();
    }
    
    toast.success("Successfully signed out");
    return true;
  } catch (error) {
    console.error('Error signing out:', error);
    toast.error(`Sign out failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

/**
 * Get the user information
 */
export async function getUserInfo(forceRefresh: boolean = false): Promise<any | null> {
  if (!isExtensionContext()) {
    return null;
  }
  
  try {
    // Check if we have cached user info and it's not a forced refresh
    if (cachedUserInfo && !forceRefresh) {
      return cachedUserInfo;
    }
    
    // Check if we have stored user info that's not expired
    const storage = chrome.storage.local;
    const data = await new Promise<any>((resolve) => {
      storage.get([USER_INFO_KEY, USER_INFO_TIMESTAMP_KEY], (result) => resolve(result));
    });
    
    const storedUserInfo = data[USER_INFO_KEY];
    const timestamp = data[USER_INFO_TIMESTAMP_KEY] || 0;
    
    // If we have stored user info and it's not expired or forced refresh, use it
    if (
      storedUserInfo && 
      !forceRefresh && 
      Date.now() - timestamp < USER_CACHE_DURATION
    ) {
      cachedUserInfo = storedUserInfo;
      return storedUserInfo;
    }
    
    // Get a fresh access token
    const token = await getAccessToken(forceRefresh);
    
    if (!token) {
      return null;
    }
    
    // Fetch user info
    const response = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`User info request failed: ${response.status}`);
    }
    
    const userInfo = await response.json();
    
    // Store the user info
    await new Promise<void>((resolve) => {
      storage.set({
        [USER_INFO_KEY]: userInfo,
        [USER_INFO_TIMESTAMP_KEY]: Date.now()
      }, () => resolve());
    });
    
    // Update cache
    cachedUserInfo = userInfo;
    
    return userInfo;
  } catch (error) {
    console.error('Error getting user info:', error);
    return null;
  }
}

/**
 * Setup an automatic token refresh mechanism
 */
export function setupAutoTokenRefresh(refreshIntervalMs: number = 55 * 60 * 1000): () => void {
  let intervalId: any = null;
  
  const refresh = async () => {
    try {
      // Get the stored token expiry time
      const storage = chrome.storage.local;
      const data = await new Promise<any>((resolve) => {
        storage.get([TOKEN_EXPIRY_KEY], (result) => resolve(result));
      });
      
      const expiryTime = data[TOKEN_EXPIRY_KEY] || 0;
      
      // Only refresh if token will expire soon
      if (expiryTime && expiryTime < Date.now() + TOKEN_REFRESH_THRESHOLD) {
        await getAccessToken(true); // Force refresh
      }
    } catch (error) {
      console.error('Error in auto token refresh:', error);
    }
  };
  
  // Start the interval
  intervalId = setInterval(refresh, refreshIntervalMs);
  
  // Return a cleanup function
  return () => {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
}
