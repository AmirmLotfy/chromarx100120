import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
}

export const useSubscription = (): SubscriptionHook => {
  const { user } = useAuth();
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
        const userData = await chromeDb.get('user');
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
      const userData = await chromeDb.get('user');
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
      const userData = await chromeDb.get('user');
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

  return {
    isLoading,
    currentPlan,
    usage,
    incrementUsage,
    checkFeatureAccess,
    hasReachedLimit
  };
};