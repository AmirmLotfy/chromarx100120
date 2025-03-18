
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  trackSubscriptionEvent,
  calculateSubscriptionAnalytics,
  predictChurnRisk,
  getChurnReductionRecommendations
} from '../subscriptionAnalytics';
import { chromeStorage } from '@/services/chromeStorageService';

// Mock chromeStorage
vi.mock('@/services/chromeStorageService', () => ({
  chromeStorage: {
    get: vi.fn(),
    set: vi.fn(),
  }
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}));

describe('subscriptionAnalytics', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('trackSubscriptionEvent', () => {
    it('should add an event to storage', async () => {
      // Setup
      vi.mocked(chromeStorage.get).mockResolvedValue([]);
      vi.mocked(chromeStorage.set).mockResolvedValue(undefined);
      
      const metadata = { planId: 'pro', source: 'test' };
      
      // Execute
      await trackSubscriptionEvent('subscription_created', metadata);
      
      // Verify
      expect(chromeStorage.get).toHaveBeenCalledWith('subscription_events');
      expect(chromeStorage.set).toHaveBeenCalledWith('subscription_events', [
        expect.objectContaining({
          event: 'subscription_created',
          metadata,
          timestamp: expect.any(String)
        })
      ]);
    });
    
    it('should append to existing events', async () => {
      // Setup
      const existingEvents = [
        { event: 'viewed_pricing_page', timestamp: '2023-01-01T00:00:00Z', metadata: {} }
      ];
      vi.mocked(chromeStorage.get).mockResolvedValue(existingEvents);
      vi.mocked(chromeStorage.set).mockResolvedValue(undefined);
      
      // Execute
      await trackSubscriptionEvent('subscription_renewed');
      
      // Verify
      expect(chromeStorage.set).toHaveBeenCalledWith('subscription_events', [
        ...existingEvents,
        expect.objectContaining({
          event: 'subscription_renewed',
          timestamp: expect.any(String)
        })
      ]);
    });
  });
  
  describe('calculateSubscriptionAnalytics', () => {
    it('should calculate analytics from payment history and events', async () => {
      // Setup
      const mockPaymentHistory = [
        {
          id: 'payment_1',
          amount: 9.99,
          status: 'completed',
          type: 'initial'
        },
        {
          id: 'payment_2',
          amount: 9.99,
          status: 'completed',
          type: 'renewal'
        },
        {
          id: 'payment_3',
          amount: 9.99,
          status: 'failed',
          type: 'renewal'
        }
      ];
      
      const mockEvents = [
        { event: 'subscription_created', timestamp: '2023-01-01T00:00:00Z', metadata: {} },
        { event: 'payment_failed', timestamp: '2023-03-01T00:00:00Z', metadata: {} },
        { event: 'plan_upgraded', timestamp: '2023-02-01T00:00:00Z', metadata: {} }
      ];
      
      const mockUserData = {
        subscription: {
          planId: 'pro',
          status: 'active',
          createdAt: '2023-01-01T00:00:00Z',
          currentPeriodEnd: '2023-04-01T00:00:00Z',
          usage: {
            bookmarks: 10,
            tasks: 5
          }
        }
      };
      
      // Properly mock the chromeStorage.get function to return promises
      vi.mocked(chromeStorage.get).mockImplementation((key: string) => {
        if (key === 'payment_history') return Promise.resolve(mockPaymentHistory);
        if (key === 'subscription_events') return Promise.resolve(mockEvents);
        if (key === 'user') return Promise.resolve(mockUserData);
        return Promise.resolve(null);
      });
      
      vi.mocked(chromeStorage.set).mockResolvedValue(undefined);
      
      // Execute
      const analytics = await calculateSubscriptionAnalytics();
      
      // Verify
      expect(analytics).not.toBeNull();
      expect(analytics?.totalRevenue).toBe(19.98); // 2 completed payments
      expect(analytics?.upgrades).toBe(1);
      expect(analytics?.renewalRate).toBe(0.5); // 1/2 renewal payments successful
      expect(analytics?.activeSubscriptions).toBe(1);
      expect(chromeStorage.set).toHaveBeenCalledWith('subscription_analytics', expect.any(Object));
    });
    
    it('should handle empty data', async () => {
      // Setup
      vi.mocked(chromeStorage.get).mockResolvedValue([]);
      vi.mocked(chromeStorage.set).mockResolvedValue(undefined);
      
      // Execute
      const analytics = await calculateSubscriptionAnalytics();
      
      // Verify
      expect(analytics).not.toBeNull();
      expect(analytics?.totalRevenue).toBe(0);
      expect(analytics?.upgrades).toBe(0);
    });
  });
  
  describe('predictChurnRisk', () => {
    it('should calculate churn risk based on subscription status', async () => {
      // Setup
      const mockUserData = {
        subscription: {
          planId: 'pro',
          status: 'active',
          cancelAtPeriodEnd: true, // Major risk factor
          createdAt: '2023-01-01T00:00:00Z',
          currentPeriodEnd: '2023-04-01T00:00:00Z',
          usage: {
            bookmarks: 10,
            tasks: 5
          }
        }
      };
      
      vi.mocked(chromeStorage.get).mockImplementation((key: string) => {
        if (key === 'user') return Promise.resolve(mockUserData);
        if (key === 'subscription_events') return Promise.resolve([]);
        return Promise.resolve(null);
      });
      
      // Execute
      const risk = await predictChurnRisk();
      
      // Verify
      expect(risk).toBeGreaterThan(0.5); // High risk due to cancelAtPeriodEnd
    });
    
    it('should return 0 for free users', async () => {
      // Setup
      const mockUserData = {
        subscription: {
          planId: 'free',
          status: 'active',
          createdAt: '2023-01-01T00:00:00Z',
          currentPeriodEnd: '2023-04-01T00:00:00Z',
          usage: {}
        }
      };
      
      vi.mocked(chromeStorage.get).mockImplementation((key: string) => {
        if (key === 'user') return Promise.resolve(mockUserData);
        return Promise.resolve(null);
      });
      
      // Execute
      const risk = await predictChurnRisk();
      
      // Verify
      expect(risk).toBe(0);
    });
  });
  
  describe('getChurnReductionRecommendations', () => {
    it('should provide recommendations based on churn risk', async () => {
      // Mock predictChurnRisk to return high risk
      vi.mock('../subscriptionAnalytics', async (importOriginal) => {
        const actual = await importOriginal();
        return {
          ...actual,
          predictChurnRisk: vi.fn().mockResolvedValue(0.8)
        };
      });
      
      // Execute
      const recommendations = await getChurnReductionRecommendations();
      
      // Verify
      expect(recommendations.length).toBeGreaterThan(0);
    });
  });
});
