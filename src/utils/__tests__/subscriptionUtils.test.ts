
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  resetMonthlyUsage, 
  checkNeedsRenewal, 
  setAutoRenew,
  createDefaultUsage,
  updateSubscriptionStatus
} from '../subscriptionUtils';
import { chromeStorage } from '@/services/chromeStorageService';
import { UserSubscription } from '@/config/subscriptionPlans';

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
    error: vi.fn()
  }
}));

describe('subscriptionUtils', () => {
  let mockUser: { subscription: UserSubscription };
  
  beforeEach(() => {
    // Setup mock data
    mockUser = {
      subscription: {
        planId: 'pro',
        status: 'active',
        createdAt: '2023-01-01T00:00:00Z',
        endDate: '2024-01-01T00:00:00Z',
        currentPeriodStart: '2023-01-01T00:00:00Z',
        currentPeriodEnd: '2023-02-01T00:00:00Z',
        cancelAtPeriodEnd: false,
        autoRenew: true,
        billingCycle: 'monthly',
        usage: {
          bookmarks: 10,
          bookmarkImports: 5,
          bookmarkCategorization: 3,
          bookmarkSummaries: 2,
          keywordExtraction: 1,
          tasks: 8,
          taskEstimation: 4,
          notes: 7,
          noteSentimentAnalysis: 2,
          aiRequests: 15
        }
      }
    };
    
    // Reset mocks
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('resetMonthlyUsage', () => {
    it('should reset all usage counters to zero', async () => {
      vi.mocked(chromeStorage.get).mockResolvedValue(mockUser);
      vi.mocked(chromeStorage.set).mockResolvedValue(undefined);
      
      const result = await resetMonthlyUsage();
      
      expect(result).toBe(true);
      expect(chromeStorage.set).toHaveBeenCalledWith('user', {
        subscription: {
          ...mockUser.subscription,
          usage: {
            bookmarks: 0,
            bookmarkImports: 0,
            bookmarkCategorization: 0,
            bookmarkSummaries: 0,
            keywordExtraction: 0,
            tasks: 0,
            taskEstimation: 0,
            notes: 0,
            noteSentimentAnalysis: 0,
            aiRequests: 0
          }
        }
      });
    });
    
    it('should handle case with no subscription', async () => {
      vi.mocked(chromeStorage.get).mockResolvedValue({});
      
      const result = await resetMonthlyUsage();
      
      expect(result).toBe(false);
      expect(chromeStorage.set).not.toHaveBeenCalled();
    });
  });
  
  describe('checkNeedsRenewal', () => {
    it('should return true if subscription is expired', async () => {
      const expiredSub = {
        ...mockUser.subscription,
        currentPeriodEnd: new Date(Date.now() - 86400000).toISOString() // 1 day ago
      };
      
      const result = await checkNeedsRenewal(expiredSub);
      
      expect(result).toBe(true);
    });
    
    it('should return true if in grace period', async () => {
      const graceSub = {
        ...mockUser.subscription,
        status: 'grace_period' as 'active' | 'inactive' | 'canceled' | 'expired' | 'past_due' | 'grace_period'
      };
      
      const result = await checkNeedsRenewal(graceSub);
      
      expect(result).toBe(true);
    });
    
    it('should return true if within 24 hours of expiration with auto-renew on', async () => {
      const almostExpiredSub = {
        ...mockUser.subscription,
        currentPeriodEnd: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
        autoRenew: true,
        cancelAtPeriodEnd: false
      };
      
      const result = await checkNeedsRenewal(almostExpiredSub);
      
      expect(result).toBe(true);
    });
    
    it('should return false if not close to expiration', async () => {
      const validSub = {
        ...mockUser.subscription,
        currentPeriodEnd: new Date(Date.now() + 7 * 86400000).toISOString() // 7 days from now
      };
      
      const result = await checkNeedsRenewal(validSub);
      
      expect(result).toBe(false);
    });
  });
  
  describe('createDefaultUsage', () => {
    it('should create default usage object with all properties set to 0', () => {
      const usage = createDefaultUsage();
      
      expect(usage).toEqual({
        bookmarks: 0,
        bookmarkImports: 0,
        bookmarkCategorization: 0,
        bookmarkSummaries: 0,
        keywordExtraction: 0,
        tasks: 0,
        taskEstimation: 0,
        notes: 0,
        noteSentimentAnalysis: 0,
        aiRequests: 0
      });
    });
    
    it('should merge with existing usage values', () => {
      const existing = {
        bookmarks: 5,
        notes: 10
      };
      
      const usage = createDefaultUsage(existing);
      
      expect(usage.bookmarks).toBe(5);
      expect(usage.notes).toBe(10);
      expect(usage.aiRequests).toBe(0);
      expect(usage.bookmarkImports).toBe(0);
    });
  });
  
  describe('updateSubscriptionStatus', () => {
    it('should update subscription status with proper defaults', async () => {
      vi.mocked(chromeStorage.get).mockResolvedValue(mockUser);
      vi.mocked(chromeStorage.set).mockResolvedValue(undefined);
      
      const now = new Date();
      const result = await updateSubscriptionStatus(mockUser.subscription, 'active', {
        gracePeriodEndDate: now.toISOString(),
      });
      
      expect(result).not.toBeNull();
      expect(chromeStorage.set).toHaveBeenCalled();
      expect(result?.status).toBe('active');
      expect(result?.gracePeriodEndDate).toBe(now.toISOString());
      expect(result?.usage).toBeDefined();
    });
    
    it('should handle non-existent subscription', async () => {
      vi.mocked(chromeStorage.get).mockResolvedValue({});
      
      const result = await updateSubscriptionStatus(mockUser.subscription, 'canceled');
      
      expect(result).toBeNull();
    });
  });
});
