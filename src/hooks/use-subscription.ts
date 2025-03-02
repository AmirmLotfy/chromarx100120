
import { useState, useEffect } from 'react';
import { chromeDb } from '@/lib/chrome-storage';
import { toast } from 'sonner';

// Define subscription limits for each plan
const planLimits = {
  'free': {
    bookmarks: 50,
    tasks: 30,
    notes: 30,
    aiRequests: 10
  },
  'pro': {
    bookmarks: -1, // -1 means unlimited
    tasks: -1,
    notes: -1,
    aiRequests: -1
  }
};

// Define features available for each plan
const planFeatures = {
  'free': [
    'Basic bookmark management',
    'Basic analytics',
    'Limited AI features',
    'Community support'
  ],
  'pro': [
    'Basic bookmark management',
    'Basic analytics',
    'Limited AI features',
    'Community support',
    'Advanced bookmark management',
    'Full AI capabilities',
    'Priority support',
    'Cloud backup'
  ]
};

interface UsageData {
  bookmarks: number;
  tasks: number;
  notes: number;
  aiRequests: number;
}

interface SubscriptionHook {
  isLoading: boolean;
  currentPlan: string;
  usage: UsageData;
  incrementUsage: (type: keyof UsageData) => Promise<boolean>;
  checkFeatureAccess: (feature: string) => Promise<boolean>;
  hasReachedLimit: (type: keyof UsageData) => boolean;
  setSubscriptionPlan: (planId: string) => Promise<void>;
}

interface StorageSubscription {
  planId: string;
  status: string;
  createdAt: string;
  endDate: string;
}

export const useSubscription = (): SubscriptionHook => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState('free');
  const [usage, setUsage] = useState<UsageData>({
    bookmarks: 0,
    tasks: 0,
    notes: 0,
    aiRequests: 0
  });

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      try {
        // Fetch current subscription
        const subscription = await chromeDb.get<StorageSubscription>('user_subscription');
        if (subscription && subscription.status === 'active') {
          setCurrentPlan(subscription.planId);
        } else {
          setCurrentPlan('free'); // Default to free plan
        }
        
        // Fetch usage data
        const storedUsage = await chromeDb.get<UsageData>('usage');
        if (storedUsage) {
          setUsage(storedUsage);
        }
      } catch (error) {
        console.error('Error fetching subscription data:', error);
        toast.error('Failed to load subscription data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptionData();
  }, []);

  const incrementUsage = async (type: keyof UsageData): Promise<boolean> => {
    try {
      // Check if the user has reached their limit
      if (hasReachedLimit(type)) {
        toast.error(`You've reached your ${type} limit. Please upgrade your plan.`);
        return false;
      }
      
      const newUsage = {
        ...usage,
        [type]: (usage[type] || 0) + 1
      };

      await chromeDb.set('usage', newUsage);
      setUsage(newUsage);
      return true;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      return false;
    }
  };

  const checkFeatureAccess = async (feature: string): Promise<boolean> => {
    return planFeatures[currentPlan as keyof typeof planFeatures].includes(feature);
  };

  const hasReachedLimit = (type: keyof UsageData): boolean => {
    const limits = planLimits[currentPlan as keyof typeof planLimits];
    if (!limits) return true;
    
    const limit = limits[type];
    if (limit === -1) return false; // Unlimited
    return (usage[type] || 0) >= limit;
  };

  const setSubscriptionPlan = async (planId: string): Promise<void> => {
    try {
      if (planId !== 'free' && planId !== 'pro') {
        throw new Error('Invalid plan ID');
      }

      const subscriptionData: StorageSubscription = {
        planId,
        status: 'active',
        createdAt: new Date().toISOString(),
        // Set end date to 30 days from now for Pro plan
        endDate: planId === 'pro' 
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() 
          : new Date().toISOString(),
      };

      await chromeDb.set('user_subscription', subscriptionData);
      setCurrentPlan(planId);
      
      // Reset usage counters when upgrading to pro
      if (planId === 'pro') {
        const resetUsage: UsageData = {
          bookmarks: 0,
          tasks: 0,
          notes: 0,
          aiRequests: 0
        };
        await chromeDb.set('usage', resetUsage);
        setUsage(resetUsage);
      }
      
      toast.success(`Successfully ${planId === 'free' ? 'downgraded to Free' : 'upgraded to Pro'} plan`);
    } catch (error) {
      console.error('Error setting subscription plan:', error);
      toast.error('Failed to update subscription');
      throw error;
    }
  };

  return {
    isLoading,
    currentPlan,
    usage,
    incrementUsage,
    checkFeatureAccess,
    hasReachedLimit,
    setSubscriptionPlan
  };
};
