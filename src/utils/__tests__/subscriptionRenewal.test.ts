
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { processRenewal, retryFailedRenewals } from '../subscriptionRenewal';
import { chromeStorage } from '@/services/chromeStorageService';
import { UserSubscription } from '@/config/subscriptionPlans';
import * as subscriptionUtils from '../subscriptionUtils';

// Mock fetch
global.fetch = vi.fn();

// Mock chromeStorage
vi.mock('@/services/chromeStorageService', () => ({
  chromeStorage: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn()
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

// Mock subscriptionUtils
vi.mock('../subscriptionUtils', () => ({
  updateSubscriptionStatus: vi.fn(),
  checkNeedsRenewal: vi.fn(),
  processPayment: vi.fn(),
  createDefaultUsage: vi.fn(() => ({
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
  }))
}));

describe('subscriptionRenewal', () => {
  let mockSubscription: UserSubscription;
  let mockSuccessResponse: Response;
  let mockErrorResponse: Response;
  
  beforeEach(() => {
    mockSubscription = {
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
    };
    
    // Mock successful API response
    mockSuccessResponse = {
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        success: true,
        subscription: {
          id: 'sub_123',
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 86400000).toISOString()
        },
        payment: {
          id: 'pay_123',
          amount: 9.99,
          status: 'completed',
          provider: 'paypal'
        },
        receipt: {
          receipt_number: 'INV-123',
          receipt_url: '/api/receipts/INV-123'
        }
      })
    } as unknown as Response;
    
    // Mock error API response
    mockErrorResponse = {
      ok: false,
      status: 400,
      json: vi.fn().mockResolvedValue({
        success: false,
        error: 'Payment failed',
        errorDetails: {
          code: 'payment_failed',
          message: 'The payment could not be processed'
        }
      })
    } as unknown as Response;
    
    // Reset mocks
    vi.clearAllMocks();
    vi.mocked(global.fetch).mockReset();
    vi.mocked(subscriptionUtils.checkNeedsRenewal).mockResolvedValue(true);
    vi.mocked(subscriptionUtils.updateSubscriptionStatus).mockImplementation(
      (sub, status, data) => Promise.resolve({ ...sub, ...data, status } as UserSubscription)
    );
    vi.mocked(subscriptionUtils.processPayment).mockResolvedValue(true);
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('processRenewal', () => {
    it('should skip renewal if not needed', async () => {
      vi.mocked(subscriptionUtils.checkNeedsRenewal).mockResolvedValueOnce(false);
      
      const result = await processRenewal(mockSubscription);
      
      expect(result.success).toBe(true);
      expect(global.fetch).not.toHaveBeenCalled();
    });
    
    it('should process successful renewal', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(mockSuccessResponse);
      
      const result = await processRenewal(mockSubscription);
      
      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(subscriptionUtils.processPayment).toHaveBeenCalled();
      expect(subscriptionUtils.updateSubscriptionStatus).toHaveBeenCalledWith(
        expect.anything(),
        'active',
        expect.objectContaining({
          renewalAttempts: 0
        })
      );
    });
    
    it('should handle renewal failure and enter grace period', async () => {
      const mockGraceResponse = {
        ...mockErrorResponse,
        json: vi.fn().mockResolvedValue({
          success: false,
          error: 'Payment failed',
          errorDetails: {
            code: 'payment_failed_grace_period',
            message: 'Payment failed',
            gracePeriodEnd: new Date(Date.now() + 7 * 86400000).toISOString(),
            attemptsCount: 1
          }
        })
      } as unknown as Response;
      
      vi.mocked(global.fetch).mockResolvedValueOnce(mockGraceResponse);
      
      const result = await processRenewal(mockSubscription);
      
      expect(result.success).toBe(false);
      expect(subscriptionUtils.updateSubscriptionStatus).toHaveBeenCalledWith(
        expect.anything(),
        'grace_period',
        expect.objectContaining({
          gracePeriodEndDate: expect.any(String)
        })
      );
    });
    
    it('should retry on temporary network errors', async () => {
      // First attempt fails with network error, second succeeds
      vi.mocked(global.fetch)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockSuccessResponse);
      
      const result = await processRenewal(mockSubscription);
      
      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('retryFailedRenewals', () => {
    it('should do nothing if no failed renewal exists', async () => {
      vi.mocked(chromeStorage.get).mockResolvedValueOnce(null);
      
      await retryFailedRenewals();
      
      expect(global.fetch).not.toHaveBeenCalled();
    });
    
    it('should not retry if less than 1 hour since last attempt', async () => {
      vi.mocked(chromeStorage.get).mockResolvedValueOnce({
        attemptTime: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 minutes ago
      });
      
      await retryFailedRenewals();
      
      expect(global.fetch).not.toHaveBeenCalled();
    });
    
    it('should retry if more than 1 hour since last attempt', async () => {
      vi.mocked(chromeStorage.get)
        .mockResolvedValueOnce({ // For the failed renewal attempt
          subscriptionId: 'sub_123',
          attemptTime: new Date(Date.now() - 120 * 60 * 1000).toISOString() // 2 hours ago
        })
        .mockResolvedValueOnce({ // For the current user data
          subscription: mockSubscription
        });
      
      vi.mocked(global.fetch).mockResolvedValueOnce(mockSuccessResponse);
      
      await retryFailedRenewals();
      
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(chromeStorage.remove).toHaveBeenCalledWith('failed_renewal_attempt');
    });
  });
});
