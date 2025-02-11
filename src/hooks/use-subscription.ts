
import { useState, useEffect } from 'react';
import { chromeDb } from '@/lib/chrome-storage';
import { PlanLimits, subscriptionPlans } from '@/config/subscriptionPlans';
import { toast } from 'sonner';

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
        const storedUsage = await chromeDb.get('usage');
        if (storedUsage) {
          setUsage(storedUsage);
        }
        setCurrentPlan('free'); // Default to free plan
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
    const plan = subscriptionPlans.find(p => p.id === currentPlan);
    if (!plan) return false;

    const featureObj = plan.features.find(f => f.name === feature);
    return featureObj?.included || false;
  };

  const hasReachedLimit = (type: keyof UsageData): boolean => {
    const plan = subscriptionPlans.find(p => p.id === currentPlan);
    if (!plan) return true;

    const limit = plan.limits[type];
    if (limit === -1) return false; // Unlimited
    return (usage[type] || 0) >= limit;
  };

  const setSubscriptionPlan = async (planId: string): Promise<void> => {
    try {
      const plan = subscriptionPlans.find(p => p.id === planId);
      if (!plan) throw new Error('Invalid plan ID');

      await chromeDb.set('subscription', {
        planId,
        status: 'active',
        createdAt: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      });

      setCurrentPlan(planId);
    } catch (error) {
      console.error('Error setting subscription plan:', error);
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
