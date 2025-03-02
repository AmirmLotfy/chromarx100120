
import { useState, useEffect } from 'react';
import { chromeDb } from '@/lib/chrome-storage';
import { subscriptionPlans } from '@/config/subscriptionPlans';
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
  getRemainingQuota: (type: keyof UsageData) => number;
  getPlanDetails: () => {
    name: string;
    limits: Record<string, number>;
  } | null;
}

interface StorageSubscription {
  planId: string;
  status: string;
  createdAt: string;
  endDate: string;
}

// Helper function for tracking subscription analytics
const trackSubscriptionEvent = async (eventName: string, planId: string) => {
  try {
    // Store subscription events for analytics
    const events = await chromeDb.get<any[]>('subscription_events') || [];
    events.push({
      event: eventName,
      planId,
      timestamp: new Date().toISOString()
    });
    await chromeDb.set('subscription_events', events);
  } catch (error) {
    console.error('Error tracking subscription event:', error);
  }
};

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
        // Fetch actual usage data
        const storedUsage = await chromeDb.get<UsageData>('usage');
        if (storedUsage) {
          setUsage(storedUsage);
        }
        
        // Fetch current subscription plan
        const subscription = await chromeDb.get<StorageSubscription>('user_subscription');
        if (subscription) {
          // Check if subscription is still valid
          const endDate = new Date(subscription.endDate);
          const now = new Date();
          
          if (subscription.status === 'active' && endDate > now) {
            setCurrentPlan(subscription.planId);
          } else if (endDate <= now && subscription.planId !== 'free') {
            // Subscription expired - revert to free plan
            setCurrentPlan('free');
            await chromeDb.set('user_subscription', {
              planId: 'free',
              status: 'expired',
              createdAt: subscription.createdAt,
              endDate: subscription.endDate
            });
            toast.info("Your subscription has expired. You've been moved to the Free plan.");
          } else {
            setCurrentPlan(subscription.planId || 'free');
          }
        } else {
          setCurrentPlan('free'); // Default to free plan
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
      // Immediately check if the user has reached their limit
      if (hasReachedLimit(type)) {
        const plan = subscriptionPlans.find(p => p.id === currentPlan);
        if (!plan) return false;
        
        const nextPlan = subscriptionPlans.find(p => 
          p.id !== 'free' && p.limits[type] > (plan.limits[type] || 0)
        );
        
        if (nextPlan) {
          toast.error(
            `You've reached your ${type} limit. Upgrade to ${nextPlan.name} for more.`, 
            {
              action: {
                label: "Upgrade",
                onClick: () => window.location.href = "/subscription"
              }
            }
          );
        } else {
          toast.error(`You've reached your ${type} limit.`);
        }
        return false;
      }

      // If not limited, increment the usage
      const newUsage = {
        ...usage,
        [type]: (usage[type] || 0) + 1
      };

      await chromeDb.set('usage', newUsage);
      setUsage(newUsage);
      
      // Check if approaching limit (80% capacity)
      const plan = subscriptionPlans.find(p => p.id === currentPlan);
      if (plan) {
        const limit = plan.limits[type];
        if (limit !== -1 && newUsage[type] >= limit * 0.8 && newUsage[type] < limit) {
          const nextPlan = subscriptionPlans.find(p => 
            p.id !== 'free' && p.limits[type] > (plan.limits[type] || 0)
          );
          
          if (nextPlan) {
            toast.warning(
              `You're approaching your ${type} limit. Consider upgrading to ${nextPlan.name}.`,
              {
                action: {
                  label: "Upgrade",
                  onClick: () => window.location.href = "/subscription"
                }
              }
            );
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      return false;
    }
  };

  const checkFeatureAccess = async (feature: string): Promise<boolean> => {
    try {
      const plan = subscriptionPlans.find(p => p.id === currentPlan);
      if (!plan) return false;

      const featureObj = plan.features.find(f => f.name.toLowerCase().includes(feature.toLowerCase()));
      return featureObj?.included || false;
    } catch (error) {
      console.error('Error checking feature access:', error);
      return false;
    }
  };

  const hasReachedLimit = (type: keyof UsageData): boolean => {
    try {
      const plan = subscriptionPlans.find(p => p.id === currentPlan);
      if (!plan) return true;

      const limit = plan.limits[type];
      if (limit === -1) return false; // Unlimited
      return (usage[type] || 0) >= limit;
    } catch (error) {
      console.error('Error checking limits:', error);
      return true; // Default to limited for safety
    }
  };

  const getRemainingQuota = (type: keyof UsageData): number => {
    try {
      const plan = subscriptionPlans.find(p => p.id === currentPlan);
      if (!plan) return 0;

      const limit = plan.limits[type];
      if (limit === -1) return -1; // Unlimited
      return Math.max(0, limit - (usage[type] || 0));
    } catch (error) {
      console.error('Error calculating remaining quota:', error);
      return 0;
    }
  };

  const getPlanDetails = () => {
    const plan = subscriptionPlans.find(p => p.id === currentPlan);
    if (!plan) return null;
    
    return {
      name: plan.id === 'basic' ? 'Pro' : plan.name,
      limits: plan.limits
    };
  };

  const setSubscriptionPlan = async (planId: string): Promise<void> => {
    try {
      const plan = subscriptionPlans.find(p => p.id === planId);
      if (!plan) throw new Error('Invalid plan ID');
      
      // Update subscription
      const createdAt = new Date().toISOString();
      const endDate = new Date();
      // Set expiration 30 days from now for paid plans
      if (planId !== 'free') {
        endDate.setDate(endDate.getDate() + 30);
      }

      const subscriptionData: StorageSubscription = {
        planId,
        status: 'active',
        createdAt,
        endDate: endDate.toISOString(),
      };

      await chromeDb.set('user_subscription', subscriptionData);
      setCurrentPlan(planId);
      
      // Track the subscription change
      await trackSubscriptionEvent(
        planId === 'free' ? 'plan_downgraded' : 'plan_upgraded',
        planId
      );
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
    setSubscriptionPlan,
    getRemainingQuota,
    getPlanDetails
  };
};
