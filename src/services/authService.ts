interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

class AuthService {
  private static instance: AuthService;
  private user: UserProfile | null = null;
  private listeners: ((user: UserProfile | null) => void)[] = [];
  private isExtensionEnvironment: boolean;

  private constructor() {
    // Properly check if we're in a Chrome extension environment
    this.isExtensionEnvironment = typeof chrome !== 'undefined' && 
      typeof chrome.identity !== 'undefined' && 
      chrome.identity !== null;
    
    if (this.isExtensionEnvironment) {
      // Only set up Chrome extension specific listeners if we're in an extension
      chrome.identity.onSignInChanged?.addListener((account, signedIn) => {
        if (signedIn) {
          this.handleSignIn(account);
        } else {
          this.handleSignOut();
        }
      });
    } else {
      console.log('Running in non-extension environment - some features may be limited');
    }
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async signInWithGoogle(): Promise<void> {
    try {
      if (!this.isExtensionEnvironment) {
        throw new Error('Google Sign-In is only available in the Chrome extension');
      }

      const token = await this.getGoogleAuthToken();
      if (!token) {
        throw new Error('Failed to get auth token');
      }

      // Get user info from Google
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to get user info');
      }

      const data = await response.json();
      this.user = {
        uid: data.sub,
        email: data.email,
        displayName: data.name,
        photoURL: data.picture
      };

      this.notifyListeners();
      await this.syncUserData();
      console.log('Successfully signed in!');
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      if (this.isExtensionEnvironment) {
        const token = await this.getGoogleAuthToken();
        if (token) {
          await chrome.identity.removeCachedAuthToken({ token });
        }
      }
      
      this.user = null;
      this.notifyListeners();
      console.log('Successfully signed out');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  private async getGoogleAuthToken(): Promise<string> {
    if (!this.isExtensionEnvironment) {
      throw new Error('Google Auth Token is only available in the Chrome extension');
    }

    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        resolve(token);
      });
    });
  }

  private async handleSignIn(account: chrome.identity.AccountInfo) {
    try {
      const token = await this.getGoogleAuthToken();
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to get user info');
      }

      const data = await response.json();
      this.user = {
        uid: data.sub,
        email: data.email,
        displayName: data.name,
        photoURL: data.picture
      };

      this.notifyListeners();
      await this.syncUserData();
    } catch (error) {
      console.error('Error handling sign in:', error);
    }
  }

  private handleSignOut() {
    this.user = null;
    this.notifyListeners();
  }

  private async syncUserData() {
    if (!this.user || !this.isExtensionEnvironment) return;

    try {
      // Sync user data with Chrome storage
      const userData = {
        lastSynced: new Date().toISOString(),
        preferences: await chrome.storage.sync.get('preferences'),
        bookmarks: await chrome.storage.sync.get('bookmarks')
      };

      await chrome.storage.sync.set({
        userData: {
          ...userData,
          uid: this.user.uid,
          email: this.user.email
        }
      });
    } catch (error) {
      console.error('Error syncing user data:', error);
    }
  }

  getCurrentUser(): UserProfile | null {
    return this.user;
  }

  onAuthStateChanged(callback: (user: UserProfile | null) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.user));
  }
}

export const authService = AuthService.getInstance();