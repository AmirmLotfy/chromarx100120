
import { useState, useEffect } from 'react';
import { chromeDb } from '@/lib/chrome-storage';
import { subscriptionPlans, PlanLimits } from '@/config/subscriptionPlans';
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
        const storedUsage = await chromeDb.get<UsageData>('usage');
        if (storedUsage) {
          setUsage(storedUsage);
        } else {
          // Initialize usage data if it doesn't exist
          await chromeDb.set('usage', usage);
        }
        
        const subscription = await chromeDb.get<StorageSubscription>('user_subscription');
        if (subscription) {
          const endDate = new Date(subscription.endDate);
          const now = new Date();
          
          if (subscription.status === 'active' && endDate > now) {
            setCurrentPlan(subscription.planId);
          } else if (endDate <= now && subscription.planId !== 'free') {
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
          // Initialize subscription if it doesn't exist
          const createdAt = new Date().toISOString();
          await chromeDb.set('user_subscription', {
            planId: 'free',
            status: 'active',
            createdAt,
            endDate: createdAt // No expiration for free plan
          });
          setCurrentPlan('free');
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
      if (hasReachedLimit(type)) {
        const plan = subscriptionPlans.find(p => p.id === currentPlan);
        if (!plan) return false;
        
        const nextPlan = subscriptionPlans.find(p => 
          p.id !== 'free' && 
          p.id !== currentPlan && 
          (p.limits[type] > (plan.limits[type] || 0) || p.limits[type] === -1)
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

      const newUsage = {
        ...usage,
        [type]: (usage[type] || 0) + 1
      };

      await chromeDb.set('usage', newUsage);
      setUsage(newUsage);
      
      const plan = subscriptionPlans.find(p => p.id === currentPlan);
      if (plan) {
        const limit = plan.limits[type];
        if (limit !== -1 && newUsage[type] >= limit * 0.8 && newUsage[type] < limit) {
          const nextPlan = subscriptionPlans.find(p => 
            p.id !== 'free' &&
            p.id !== currentPlan &&
            (p.limits[type] > (plan.limits[type] || 0) || p.limits[type] === -1)
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

      // Case-insensitive search for the feature in the plan's features
      const featureObj = plan.features.find(f => 
        f.name.toLowerCase().includes(feature.toLowerCase())
      );
      
      // If the feature is explicitly listed, return its inclusion status
      if (featureObj) {
        return featureObj.included;
      }
      
      // For features not explicitly listed, check if any similar feature is included
      const similarFeatures = plan.features.filter(f => 
        f.name.toLowerCase().includes(feature.toLowerCase().split(' ')[0])
      );
      
      return similarFeatures.some(f => f.included);
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
      if (limit === -1) return false; // -1 means unlimited
      return (usage[type] || 0) >= limit;
    } catch (error) {
      console.error('Error checking limits:', error);
      return true; // Fail closed - restrict access on error
    }
  };

  const getRemainingQuota = (type: keyof UsageData): number => {
    try {
      const plan = subscriptionPlans.find(p => p.id === currentPlan);
      if (!plan) return 0;

      const limit = plan.limits[type];
      if (limit === -1) return -1; // -1 signifies unlimited
      return Math.max(0, limit - (usage[type] || 0));
    } catch (error) {
      console.error('Error calculating remaining quota:', error);
      return 0;
    }
  };

  const getPlanDetails = () => {
    const plan = subscriptionPlans.find(p => p.id === currentPlan);
    if (!plan) return null;
    
    // Type assertion is needed here since TypeScript can't infer
    // that the shape of plan.limits matches Record<string, number>
    return {
      name: plan.id === 'basic' ? 'Pro' : plan.name,
      limits: Object.fromEntries(
        Object.entries(plan.limits)
      ) as Record<string, number>
    };
  };

  const setSubscriptionPlan = async (planId: string): Promise<void> => {
    try {
      const plan = subscriptionPlans.find(p => p.id === planId);
      if (!plan) throw new Error('Invalid plan ID');
      
      const createdAt = new Date().toISOString();
      const endDate = new Date();
      if (planId !== 'free') {
        // Set 30-day subscription for paid plans
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
      
      await trackSubscriptionEvent(
        currentPlan === 'free' ? 'plan_upgraded' : 
          (planId === 'free' ? 'plan_downgraded' : 'plan_changed'),
        planId
      );
      
      // Reset usage data when downgrading to make sure limits are enforced
      if (planId === 'free' && currentPlan !== 'free') {
        // Reset usage to current plan limits to enforce new restrictions
        const freePlan = subscriptionPlans.find(p => p.id === 'free');
        if (freePlan) {
          const newUsage = {
            bookmarks: Math.min(usage.bookmarks, freePlan.limits.bookmarks),
            tasks: Math.min(usage.tasks, freePlan.limits.tasks),
            notes: Math.min(usage.notes, freePlan.limits.notes),
            aiRequests: Math.min(usage.aiRequests, freePlan.limits.aiRequests)
          };
          await chromeDb.set('usage', newUsage);
          setUsage(newUsage);
        }
      }
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
