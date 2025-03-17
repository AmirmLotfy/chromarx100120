
import { useState, useEffect } from 'react';
import { chromeDb } from '@/lib/chrome-storage';
import { subscriptionPlans, PlanLimits } from '@/config/subscriptionPlans';
import { toast } from 'sonner';
import { localStorageClient as supabase } from '@/lib/local-storage-client';
import { useAuth } from '@/hooks/useAuth';
import { checkSubscriptionStatus } from '@/utils/chromeUtils';

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
  isAutoRenewEnabled: boolean;
  setAutoRenew: (enabled: boolean) => Promise<boolean>;
  expirationDate: Date | null;
}

interface StorageSubscription {
  planId: string;
  status: string;
  createdAt: string;
  endDate: string;
  autoRenew?: boolean;
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
  const [isAutoRenewEnabled, setIsAutoRenewEnabled] = useState(true);
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      try {
        // First try to get data from Supabase if user is logged in
        if (user?.id) {
          const status = await checkSubscriptionStatus(user.id);
          
          if (status) {
            // Update local state with Supabase data
            setCurrentPlan(status.subscription.plan_id || 'free');
            setIsAutoRenewEnabled(!status.subscription.cancel_at_period_end);
            
            if (status.subscription.current_period_end) {
              setExpirationDate(new Date(status.subscription.current_period_end));
            }
            
            // Update usage data
            setUsage({
              bookmarks: status.usageLimits.bookmarks.used,
              tasks: status.usageLimits.tasks.used,
              notes: status.usageLimits.notes.used,
              aiRequests: status.usageLimits.aiRequests.used
            });
            
            // Also update local storage for offline access
            const createdAt = status.subscription.current_period_start || new Date().toISOString();
            const endDate = status.subscription.current_period_end || new Date().toISOString();
            
            await chromeDb.set('user_subscription', {
              planId: status.subscription.plan_id,
              status: status.subscription.status,
              createdAt,
              endDate,
              autoRenew: !status.subscription.cancel_at_period_end
            });
            
            await chromeDb.set('usage', {
              bookmarks: status.usageLimits.bookmarks.used,
              tasks: status.usageLimits.tasks.used,
              notes: status.usageLimits.notes.used,
              aiRequests: status.usageLimits.aiRequests.used
            });
            
            setIsLoading(false);
            return;
          }
        }
        
        // Fallback to local storage if Supabase data not available
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
          
          setExpirationDate(endDate);
          setIsAutoRenewEnabled(subscription.autoRenew !== false);
          
          if (subscription.status === 'active' && endDate > now) {
            setCurrentPlan(subscription.planId);
          } else if (endDate <= now && subscription.planId !== 'free') {
            setCurrentPlan('free');
            await chromeDb.set('user_subscription', {
              planId: 'free',
              status: 'expired',
              createdAt: subscription.createdAt,
              endDate: subscription.endDate,
              autoRenew: false
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
            endDate: createdAt, // No expiration for free plan
            autoRenew: false
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
  }, [user?.id]);

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

      // Update local storage
      await chromeDb.set('usage', newUsage);
      setUsage(newUsage);
      
      // Also increment in Supabase if user is logged in
      if (user?.id) {
        try {
          const { error } = await supabase
            .from('usage_statistics')
            .upsert(
              {
                user_id: user.id,
                [`${type === 'aiRequests' ? 'api_calls' : type}_used`]: newUsage[type]
              },
              { onConflict: 'user_id' }
            );
            
          if (error) {
            console.error('Error updating usage in Supabase:', error);
          }
        } catch (supabaseError) {
          console.error('Error with Supabase usage update:', supabaseError);
        }
      }
      
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
        autoRenew: planId !== 'free' && isAutoRenewEnabled
      };

      // Update in local storage
      await chromeDb.set('user_subscription', subscriptionData);
      setCurrentPlan(planId);
      setExpirationDate(endDate);
      
      // Also update in Supabase if user is logged in
      if (user?.id) {
        try {
          const { error } = await supabase
            .from('subscriptions')
            .upsert({
              user_id: user.id,
              plan_id: planId,
              status: 'active',
              current_period_start: createdAt,
              current_period_end: endDate.toISOString(),
              cancel_at_period_end: !isAutoRenewEnabled
            });
            
          if (error) {
            console.error('Error updating subscription in Supabase:', error);
          }
        } catch (supabaseError) {
          console.error('Error with Supabase subscription update:', supabaseError);
        }
      }
      
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

  const setAutoRenew = async (enabled: boolean): Promise<boolean> => {
    try {
      setIsAutoRenewEnabled(enabled);
      
      // Update locally
      const subscription = await chromeDb.get<StorageSubscription>('user_subscription');
      if (subscription) {
        await chromeDb.set('user_subscription', {
          ...subscription,
          autoRenew: enabled
        });
      }
      
      // Update in Supabase if user is logged in
      if (user?.id) {
        try {
          const { error } = await supabase
            .from('subscriptions')
            .update({
              cancel_at_period_end: !enabled
            })
            .eq('user_id', user.id);
            
          if (error) {
            console.error('Error updating auto-renewal in Supabase:', error);
            return false;
          }
        } catch (supabaseError) {
          console.error('Error with Supabase auto-renewal update:', supabaseError);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error setting auto-renewal:', error);
      return false;
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
    getPlanDetails,
    isAutoRenewEnabled,
    setAutoRenew,
    expirationDate
  };
};
