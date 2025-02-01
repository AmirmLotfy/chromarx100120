import { useState, useEffect } from 'react';
import { useFirebase } from '@/contexts/FirebaseContext';
import { toast } from 'sonner';

interface UsageData {
  bookmarks: number;
  tasks: number;
  notes: number;
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
  const { user } = useFirebase();
  const [isLoading, setIsLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState('basic');
  const [usage, setUsage] = useState<UsageData>({
    bookmarks: 0,
    tasks: 0,
    notes: 0
  });

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { [`subscription_${user.id}`]: subscriptionData } = await chrome.storage.sync.get(`subscription_${user.id}`);
        
        if (subscriptionData) {
          setCurrentPlan(subscriptionData.planId);
          setUsage(subscriptionData.usage || {
            bookmarks: 0,
            tasks: 0,
            notes: 0
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
      const { [`subscription_${user.id}`]: subscriptionData } = await chrome.storage.sync.get(`subscription_${user.id}`);
      const newUsage = {
        ...usage,
        [type]: (usage[type] || 0) + 1
      };
      
      await chrome.storage.sync.set({
        [`subscription_${user.id}`]: {
          ...subscriptionData,
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
      const { [`subscription_${user.id}`]: subscriptionData } = await chrome.storage.sync.get(`subscription_${user.id}`);
      return subscriptionData?.features?.includes(feature) || false;
    } catch (error) {
      console.error('Error checking feature access:', error);
      return false;
    }
  };

  const hasReachedLimit = (type: keyof UsageData): boolean => {
    const limits = {
      basic: {
        bookmarks: 100,
        tasks: 50,
        notes: 25
      },
      pro: {
        bookmarks: -1, // unlimited
        tasks: -1,
        notes: -1
      }
    };
    
    const currentLimits = limits[currentPlan as keyof typeof limits] || limits.basic;
    const limit = currentLimits[type];
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