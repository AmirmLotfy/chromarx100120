
import { chromeDb } from '@/lib/chrome-storage';
import { retryWithBackoff } from '@/utils/retryUtils';
import { toast } from 'sonner';

export class StorageService {
  private static instance: StorageService;
  private cache = new Map<string, unknown>();
  private isExtension: boolean;
  private localStoragePrefix = 'chromarx_';

  private constructor() {
    // Check if we're running in a Chrome extension context
    this.isExtension = typeof chrome !== 'undefined' && !!chrome.storage && !!chrome.storage.sync;
    console.log('StorageService initialized in', this.isExtension ? 'extension' : 'web', 'mode');
  }

  static getInstance(): StorageService {
    if (!this.instance) {
      this.instance = new StorageService();
    }
    return this.instance;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.cache.has(key)) {
        return this.cache.get(key) as T;
      }

      if (!this.isExtension) {
        // If not in extension, use localStorage as fallback
        const stored = localStorage.getItem(this.localStoragePrefix + key);
        const value = stored ? JSON.parse(stored) : null;
        if (value !== null) {
          this.cache.set(key, value);
        }
        return value as T;
      }

      const result = await chrome.storage.sync.get(key);
      const value = result[key] || null;
      
      if (value !== null) {
        this.cache.set(key, value);
      }
      return value as T;
    } catch (error) {
      console.error(`Error reading ${key} from storage:`, error);
      toast.error(`Failed to read ${key} from storage`);
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      if (!this.isExtension) {
        // If not in extension, use localStorage as fallback
        localStorage.setItem(this.localStoragePrefix + key, JSON.stringify(value));
        this.cache.set(key, value);
        return;
      }

      await chrome.storage.sync.set({ [key]: value });
      this.cache.set(key, value);
    } catch (error) {
      console.error(`Error writing ${key} to storage:`, error);
      toast.error(`Failed to write ${key} to storage`);
      throw error;
    }
  }

  async update<T extends Record<string, any>>(key: string, value: Partial<T>): Promise<void> {
    try {
      const current = await this.get<T>(key) || {} as T;
      const updated = { ...current, ...value };
      await this.set(key, updated);
    } catch (error) {
      console.error(`Error updating ${key} in storage:`, error);
      toast.error(`Failed to update ${key} in storage`);
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      if (!this.isExtension) {
        localStorage.removeItem(this.localStoragePrefix + key);
        this.cache.delete(key);
        return;
      }

      await chrome.storage.sync.remove(key);
      this.cache.delete(key);
    } catch (error) {
      console.error(`Error removing ${key} from storage:`, error);
      toast.error(`Failed to remove ${key} from storage`);
      throw error;
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
  
  // Add a method to populate test data for the web preview
  async populateTestData(): Promise<void> {
    if (this.isExtension) {
      console.log('Not populating test data in extension mode');
      return;
    }
    
    console.log('Populating test data for web preview');
    
    // Sample user data
    await this.set('user', {
      id: 'test-user-id',
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: null
    });
    
    // Sample subscription data
    await this.set('user_subscription', {
      planId: 'basic',
      status: 'active',
      createdAt: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
    });
    
    // Sample settings
    await this.set('settings', {
      dataCollection: true,
      experimentalFeatures: false,
      geminiApiKey: 'sample-api-key',
      paypal: {
        clientId: 'sample-client-id',
        secretKey: 'sample-secret-key'
      }
    });
    
    // Sample usage metrics
    await this.set('usage', {
      bookmarks: 42,
      notes: 15,
      aiRequests: 78,
      tasks: 23
    });
    
    // Sample payment history for SubscriptionHistoryPage
    await this.set('payment_history_test-user-id', {
      payments: [
        {
          id: 'pay-123456',
          created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          order_id: 'order-123456789',
          plan_id: 'basic',
          amount: 9.99,
          status: 'completed',
          provider: 'paypal'
        },
        {
          id: 'pay-789012',
          created_at: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
          order_id: 'order-987654321',
          plan_id: 'basic',
          amount: 9.99,
          status: 'completed',
          provider: 'credit_card'
        }
      ]
    });
    
    // Sample webhook config for PayPalWebhookConfigPage
    await this.set('paypal_webhook_config', {
      webhook_id: 'WH-123456789',
      event_types: [
        'PAYMENT.SALE.COMPLETED',
        'BILLING.SUBSCRIPTION.CREATED',
        'BILLING.SUBSCRIPTION.CANCELLED',
        'BILLING.SUBSCRIPTION.EXPIRED'
      ],
      url: 'https://hkpgkogqxnamvlptxhat.supabase.co/functions/v1/paypal-webhook',
      active: true
    });
    
    toast.success('Test data populated for web preview');
  }
}

export const storage = StorageService.getInstance();

// Auto-populate test data if we're not in extension context
if (typeof window !== 'undefined' && 
    (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.sync)) {
  // Delay to ensure toast system is initialized
  setTimeout(() => {
    storage.populateTestData();
  }, 1000);
}
