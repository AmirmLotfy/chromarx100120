
import { useState, useEffect } from 'react';
import { useChromeAuth } from '@/contexts/ChromeAuthContext';
import { chromeDb } from '@/lib/chrome-storage';
import { PlanLimits, subscriptionPlans, UserData } from '@/config/subscriptionPlans';
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
  const { user } = useChromeAuth();
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
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await chromeDb.get<UserData>('user');
        if (userData?.subscription) {
          setCurrentPlan(userData.subscription.planId);
          setUsage(userData.subscription.usage || {
            bookmarks: 0,
            tasks: 0,
            notes: 0,
            aiRequests: 0
          });
        }
      } catch (error) {
        console.error('Error fetching subscription data:', error);
        toast.error('Failed to load subscription data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptionData();
  }, [user]);

  const incrementUsage = async (type: keyof UsageData): Promise<boolean> => {
    if (!user) return false;

    try {
      const userData = await chromeDb.get<UserData>('user');
      if (!userData?.subscription) return false;

      const newUsage = {
        ...usage,
        [type]: (usage[type] || 0) + 1
      };

      await chromeDb.update('user', {
        subscription: {
          ...userData.subscription,
          usage: newUsage
        }
      });

      setUsage(newUsage);
      return true;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      return false;
    }
  };

  const checkFeatureAccess = async (feature: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const userData = await chromeDb.get<UserData>('user');
      if (!userData?.subscription) return false;

      const plan = subscriptionPlans.find(p => p.id === userData.subscription.planId);
      if (!plan) return false;

      const featureObj = plan.features.find(f => f.name === feature);
      return featureObj?.included || false;
    } catch (error) {
      console.error('Error checking feature access:', error);
      return false;
    }
  };

  const hasReachedLimit = (type: keyof UsageData): boolean => {
    const plan = subscriptionPlans.find(p => p.id === currentPlan);
    if (!plan) return true;

    const limit = plan.limits[type];
    if (limit === -1) return false; // Unlimited
    return (usage[type] || 0) >= limit;
  };

  const setSubscriptionPlan = async (planId: string): Promise<void> => {
    if (!user) throw new Error('User must be logged in to set subscription plan');

    try {
      const plan = subscriptionPlans.find(p => p.id === planId);
      if (!plan) throw new Error('Invalid plan ID');

      const userData = await chromeDb.get<UserData>('user');
      await chromeDb.update('user', {
        subscription: {
          planId,
          status: 'active',
          createdAt: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          usage: userData?.subscription?.usage || {
            bookmarks: 0,
            tasks: 0,
            notes: 0,
            aiRequests: 0
          }
        }
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
