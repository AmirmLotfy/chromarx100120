import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSubscription } from '../use-subscription';
import { chromeStorage } from '@/services/chromeStorageService';
import * as subscriptionUtils from '@/utils/subscriptionUtils';
import * as subscriptionRenewal from '@/utils/subscriptionRenewal';
import { UserSubscription } from '@/config/subscriptionPlans';

// Mock dependencies
vi.mock('@/services/chromeStorageService', () => ({
  chromeStorage: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn()
  }
}));

vi.mock('@/utils/subscriptionUtils', () => ({
  resetMonthlyUsage: vi.fn().mockResolvedValue(true),
  setAutoRenew: vi.fn(),
  cancelSubscription: vi.fn(),
  updatePaymentMethod: vi.fn(),
  changeBillingCycle: vi.fn(),
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

vi.mock('@/utils/subscriptionRenewal', () => ({
  processRenewal: vi.fn(),
  retryFailedRenewals: vi.fn()
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn()
  }
}));

describe('useSubscription', () => {
  let mockSubscription: UserSubscription;
  
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
    
    // Reset mocks
    vi.clearAllMocks();
    vi.mocked(chromeStorage.get).mockResolvedValue({
      subscription: mockSubscription
    });
    vi.mocked(subscriptionRenewal.processRenewal).mockResolvedValue({ 
      success: true,
      subscription: mockSubscription
    });
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  it('should load subscription data on init', async () => {
    const { result, rerender } = renderHook(() => useSubscription());
    
    // Initial loading state
    expect(result.current.loading).toBe(true);
    
    // Wait for data to load
    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.subscription).toEqual(mockSubscription);
    expect(result.current.currentPlan).toBe('pro');
    expect(chromeStorage.get).toHaveBeenCalledWith('user');
  });
  
  it('should create a default subscription if none exists', async () => {
    vi.mocked(chromeStorage.get).mockResolvedValueOnce({});
    
    const { result } = renderHook(() => useSubscription());
    
    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.subscription).not.toBeNull();
    expect(result.current.currentPlan).toBe('free');
    expect(chromeStorage.set).toHaveBeenCalled();
  });
  
  it('should check if subscription is active', async () => {
    const { result } = renderHook(() => useSubscription());
    
    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.isSubscriptionActive()).toBe(true);
    
    // Change to inactive status
    act(() => {
      result.current.subscription!.status = 'expired';
    });
    
    expect(result.current.isSubscriptionActive()).toBe(false);
  });
  
  it('should properly detect grace period', async () => {
    vi.mocked(chromeStorage.get).mockResolvedValueOnce({
      subscription: {
        ...mockSubscription,
        status: 'grace_period'
      }
    });
    
    const { result } = renderHook(() => useSubscription());
    
    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.isInGracePeriod()).toBe(true);
  });
  
  it('should call setAutoRenew correctly', async () => {
    vi.mocked(subscriptionUtils.setAutoRenew).mockResolvedValueOnce(true);
    
    const { result } = renderHook(() => useSubscription());
    
    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    await act(async () => {
      const response = await result.current.setAutoRenew(true);
      expect(response.success).toBe(true);
    });
    
    expect(subscriptionUtils.setAutoRenew).toHaveBeenCalledWith(true);
  });
  
  it('should calculate days until expiration', async () => {
    // Mock current date to a fixed point
    const originalDate = global.Date;
    const mockDate = new Date('2023-01-15T00:00:00Z');
    
    // Use a better approach for mocking Date
    global.Date = class extends originalDate {
      constructor(...args: any[]) {
        if (args.length === 0) {
          super(mockDate.getTime());
          return;
        }
        super(...args);
      }
      
      static now() {
        return mockDate.getTime();
      }
    } as any;
    
    const { result } = renderHook(() => useSubscription());
    
    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.daysUntilExpiration()).toBe(17); // Between Jan 15 and Feb 1
    
    // Restore original Date
    global.Date = originalDate;
  });
});
