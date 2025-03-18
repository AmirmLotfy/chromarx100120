
import { useState, useEffect, useCallback } from 'react';
import { chromeStorage } from "@/services/chromeStorageService";
import { toast } from 'sonner';
import { 
  UserSubscription,
  subscriptionPlans,
  getPlanById
} from "@/config/subscriptionPlans";
import { withErrorHandling } from "@/utils/errorUtils";
import { createNamespacedLogger } from "@/utils/loggerUtils";
import { 
  setAutoRenew as setAutoRenewUtils,
  cancelSubscription as cancelSubscriptionUtils,
  updatePaymentMethod as updatePaymentMethodUtils,
  changeBillingCycle as changeBillingCycleUtils,
  resetMonthlyUsage,
  createDefaultUsage,
  queueOfflineAction,
  processOfflineActions,
  changePlan as changePlanUtils
} from "@/utils/subscriptionUtils";
import { processRenewal, retryFailedRenewals } from "@/utils/subscriptionRenewal";
import { t, formatCurrency } from "@/utils/i18n";
import { useOfflineDetector } from "./use-offline-detector";

// Set up a namespaced logger
const logger = createNamespacedLogger("useSubscription");

interface UseSubscriptionReturn {
  subscription: UserSubscription | null;
  currentPlan: string;
  loading: boolean;
  error: Error | null;
  cancelSubscription: (immediate?: boolean) => Promise<{success: boolean; error?: any}>;
  updatePaymentMethod: (paymentMethod: {
    type: 'card' | 'paypal';
    lastFour?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
  }) => Promise<{success: boolean; error?: any}>;
  setAutoRenew: (autoRenew: boolean) => Promise<{success: boolean; error?: any}>;
  changeBillingCycle: (cycle: 'monthly' | 'yearly') => Promise<{success: boolean; error?: any}>;
  changePlan: (planId: string) => Promise<{success: boolean; error?: any; proratedAmount?: number}>;
  getInvoiceUrl: (paymentId: string) => string;
  getPaymentHistory: () => Promise<any[]>;
  getRemainingUsage: () => Promise<Record<string, number> | null>;
  getUsagePercentages: () => Promise<Record<string, number> | null>;
  isSubscriptionActive: () => boolean;
  isInGracePeriod: () => boolean;
  daysUntilExpiration: () => number | null;
  isProPlan: () => boolean;
  isTrialActive: () => boolean;
  checkSubscriptionStatus: (subscription?: UserSubscription) => Promise<void>;
  refreshSubscription: () => Promise<void>;
  isOffline: boolean;
}

export const useSubscription = (): UseSubscriptionReturn => {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string>("free"); // For compatibility
  const { isOffline, reconnected } = useOfflineDetector();
  
  // Refresh subscription data when coming back online
  useEffect(() => {
    if (reconnected) {
      processOfflineActions().then(() => refreshSubscription());
    }
  }, [reconnected]);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setLoading(true);
        
        // Get user data including subscription details
        const userData = await chromeStorage.get('user') || {};
        const sub = (userData as any)?.subscription;
        
        if (sub) {
          setSubscription(sub as UserSubscription);
          setCurrentPlan(sub.planId);
          
          // Check subscription status and handle renewals if needed
          // Only perform online operations if we're actually online
          if (!isOffline) {
            await checkSubscriptionStatus(sub as UserSubscription);
            await checkMonthlyReset(sub as UserSubscription);
            await retryFailedRenewals();
          }
        } else {
          // Default to free plan if no subscription found
          const defaultSub: UserSubscription = {
            planId: 'free',
            status: 'active',
            createdAt: new Date().toISOString(),
            endDate: new Date().toISOString(),
            currentPeriodStart: new Date().toISOString(),
            currentPeriodEnd: new Date().toISOString(),
            cancelAtPeriodEnd: false,
            autoRenew: false,
            billingCycle: 'monthly',
            usage: createDefaultUsage()
          };
          
          // Save the default subscription
          await chromeStorage.set('user', {
            ...(userData as Record<string, any>),
            subscription: defaultSub
          });
          setSubscription(defaultSub);
          setCurrentPlan('free');
        }
      } catch (err) {
        console.error('Error fetching subscription:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchSubscription();
    
    // Set up a periodic check for subscription status
    // Every hour for active subscriptions to catch auto-renewals
    // Every day for free users to check for resets
    const checkInterval = setInterval(() => {
      if (subscription && !isOffline) {
        checkSubscriptionStatus(subscription);
        checkMonthlyReset(subscription);
      }
    }, 60 * 60 * 1000); // 1 hour
    
    return () => clearInterval(checkInterval);
  }, [isOffline]);

  // Check if we need to reset monthly usage (first day of month)
  const checkMonthlyReset = async (sub: UserSubscription) => {
    if (!sub) return;
    
    try {
      // Get the last reset date from storage
      const lastReset = await chromeStorage.get<string>('last_monthly_reset');
      const now = new Date();
      
      // If no last reset or it was a different month, reset the counters
      if (!lastReset || new Date(lastReset).getMonth() !== now.getMonth()) {
        await resetMonthlyUsage();
        await chromeStorage.set('last_monthly_reset', now.toISOString());
        
        // Refresh the subscription to get updated usage values
        await refreshSubscription();
        
        logger.info('Monthly usage counters reset');
      }
    } catch (error) {
      logger.error('Error checking monthly reset:', error);
    }
  };

  // Check subscription status and handle expiration, renewals, etc.
  const checkSubscriptionStatus = async (sub?: UserSubscription) => {
    if (!sub) return;
    
    const now = new Date();
    const currentPeriodEnd = new Date(sub.currentPeriodEnd);
    
    // Skip free plans
    if (sub.planId === 'free') return;
    
    // Check if subscription is expired
    if (currentPeriodEnd < now) {
      if (sub.autoRenew && !sub.cancelAtPeriodEnd) {
        // Try to renew the subscription
        const { success, subscription: updatedSub } = await processRenewal(sub);
        
        if (success && updatedSub) {
          setSubscription(updatedSub);
        }
      } else if (sub.cancelAtPeriodEnd) {
        // If auto-renew is off and subscription is expired, downgrade to free
        const defaultUsage = createDefaultUsage({
          bookmarks: sub.usage?.bookmarks || 0,
          tasks: sub.usage?.tasks || 0,
          notes: sub.usage?.notes || 0
        });
        
        // Create a properly typed object for the expired subscription
        const updatedSub: UserSubscription = {
          ...sub,
          planId: 'free',
          status: 'expired',
          usage: defaultUsage
        };
        
        const userData = await chromeStorage.get('user') || {};
        await chromeStorage.set('user', {
          ...(userData as Record<string, any>),
          subscription: updatedSub
        });
        
        setSubscription(updatedSub);
        setCurrentPlan('free');
        
        // Notify user
        toast.info('Your Pro subscription has expired. You have been downgraded to the Free plan.', {
          duration: 10000,
          action: {
            label: 'Resubscribe',
            onClick: () => window.location.href = '/plans'
          }
        });
      }
    } 
    // Check if subscription is in grace period and grace period is over
    else if (sub.status === 'grace_period' && sub.gracePeriodEndDate) {
      const gracePeriodEnd = new Date(sub.gracePeriodEndDate);
      
      if (gracePeriodEnd < now) {
        // Grace period over, downgrade to free
        const defaultUsage = createDefaultUsage({
          bookmarks: sub.usage?.bookmarks || 0,
          tasks: sub.usage?.tasks || 0,
          notes: sub.usage?.notes || 0
        });
        
        const updatedSub: UserSubscription = {
          ...sub,
          planId: 'free',
          status: 'expired',
          usage: defaultUsage
        };
        
        const userData = await chromeStorage.get('user') || {};
        await chromeStorage.set('user', {
          ...(userData as Record<string, any>),
          subscription: updatedSub
        });
        
        setSubscription(updatedSub);
        setCurrentPlan('free');
        
        // Notify user
        toast.info('Your grace period has ended. You have been downgraded to the Free plan.', {
          duration: 10000,
          action: {
            label: 'Resubscribe',
            onClick: () => window.location.href = '/plans'
          }
        });
      } else {
        // Still in grace period, try renewal again if we haven't tried too many times
        if ((sub.renewalAttempts || 0) < 3) {
          const { success, subscription: updatedSub } = await processRenewal(sub);
          
          if (success && updatedSub) {
            setSubscription(updatedSub);
          }
        }
      }
    }
    // Check if subscription is nearing expiration (3 days) and should be renewed
    else if (sub.autoRenew && 
             !sub.cancelAtPeriodEnd && 
             currentPeriodEnd.getTime() - now.getTime() < 3 * 24 * 60 * 60 * 1000) {
      
      // Notify user of upcoming renewal if we're within 3 days but more than 1 day away
      const daysRemaining = Math.ceil((currentPeriodEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      
      if (daysRemaining > 1) {
        // Show notification only once per day - check if we've already notified today
        const lastNotificationKey = `renewal_notification_${daysRemaining}`;
        const lastNotification = await chromeStorage.get<string>(lastNotificationKey);
        
        if (!lastNotification) {
          toast.info(`Your Pro subscription will renew in ${daysRemaining} days`, {
            duration: 8000
          });
          
          // Mark as notified
          await chromeStorage.set(lastNotificationKey, now.toISOString());
        }
      }
      
      // If within 24 hours of expiration, process the renewal
      if (currentPeriodEnd.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
        const { success, subscription: updatedSub } = await processRenewal(sub);
        
        if (success && updatedSub) {
          setSubscription(updatedSub);
        }
      }
    }
  };
  
  // Refresh subscription data from storage
  const refreshSubscription = async () => {
    return withErrorHandling(
      async () => {
        const userData = await chromeStorage.get('user');
        if ((userData as any)?.subscription) {
          setSubscription((userData as any).subscription);
          setCurrentPlan((userData as any).subscription.planId);
        }
      },
      {
        errorMessage: 'Failed to refresh subscription data',
        showError: false,
        rethrow: false
      }
    );
  };

  // Set auto-renew status
  const setAutoRenew = useCallback(async (autoRenew: boolean) => {
    try {
      if (!subscription) return { success: false, error: 'No subscription found' };
      
      // If offline, queue the action for later
      if (isOffline) {
        const queued = await queueOfflineAction('change_auto_renew', { autoRenew });
        return { success: queued, error: queued ? undefined : 'Failed to queue offline action' };
      }
      
      const result = await setAutoRenewUtils(autoRenew);
      
      if (result) {
        // Refresh subscription data
        await refreshSubscription();
      }
      
      return { success: result };
    } catch (err) {
      logger.error('Error setting auto-renew:', err);
      return { success: false, error: err };
    }
  }, [subscription, isOffline]);

  // Cancel subscription
  const cancelSubscription = useCallback(async (immediate: boolean = false) => {
    try {
      if (!subscription) return { success: false, error: 'No subscription found' };
      
      // If offline, queue the action for later
      if (isOffline) {
        const queued = await queueOfflineAction('cancel', { immediate });
        return { success: queued, error: queued ? undefined : 'Failed to queue offline action' };
      }
      
      const result = await cancelSubscriptionUtils(immediate);
      
      if (result) {
        // Refresh subscription data
        await refreshSubscription();
      }
      
      return { success: result };
    } catch (err) {
      logger.error('Error canceling subscription:', err);
      return { success: false, error: err };
    }
  }, [subscription, isOffline]);

  // Update payment method
  const updatePaymentMethod = useCallback(async (paymentMethod: {
    type: 'card' | 'paypal';
    lastFour?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
  }) => {
    try {
      if (!subscription) return { success: false, error: 'No subscription found' };
      
      // Payment method updates should not be queued when offline
      // as they typically require direct online verification
      if (isOffline) {
        toast.error("Cannot update payment method while offline");
        return { success: false, error: 'Device is offline' };
      }
      
      const result = await updatePaymentMethodUtils(paymentMethod);
      
      if (result) {
        // Refresh subscription data
        await refreshSubscription();
        
        // If in grace period, try renewal again
        if (subscription.status === 'grace_period') {
          try {
            // Get fresh subscription data
            const userData = await chromeStorage.get('user');
            if ((userData as any)?.subscription) {
              const { success } = await processRenewal((userData as any).subscription);
              if (success) {
                toast.success(t('subscription.billing.renewal_success'));
              }
            }
          } catch (error) {
            logger.error('Failed to renew with new payment method:', error);
            toast.error('Failed to renew subscription with new payment method. We will try again later.');
          }
        }
      }
      
      return { success: result };
    } catch (err) {
      logger.error('Error updating payment method:', err);
      return { success: false, error: err };
    }
  }, [subscription, isOffline]);

  // Change billing cycle
  const changeBillingCycle = useCallback(async (cycle: 'monthly' | 'yearly') => {
    try {
      if (!subscription) return { success: false, error: 'No subscription found' };
      
      // If offline, queue the action for later
      if (isOffline) {
        const queued = await queueOfflineAction('change_billing_cycle', { cycle });
        return { success: queued, error: queued ? undefined : 'Failed to queue offline action' };
      }
      
      const result = await changeBillingCycleUtils(cycle);
      
      if (result) {
        // Refresh subscription data
        await refreshSubscription();
      }
      
      return { success: result };
    } catch (err) {
      logger.error('Error changing billing cycle:', err);
      return { success: false, error: err };
    }
  }, [subscription, isOffline]);
  
  // Change plan with proration support
  const changePlan = useCallback(async (planId: string) => {
    try {
      if (!subscription) return { success: false, error: 'No subscription found' };
      
      // If offline, queue the action for later
      if (isOffline) {
        const queued = await queueOfflineAction('change_plan', { planId });
        return { success: queued, error: queued ? undefined : 'Failed to queue offline action' };
      }
      
      const result = await changePlanUtils(planId);
      
      if (result.success) {
        // Refresh subscription data
        await refreshSubscription();
      }
      
      return result;
    } catch (err) {
      logger.error('Error changing plan:', err);
      return { success: false, error: err };
    }
  }, [subscription, isOffline]);

  // Get invoice/receipt PDF URL
  const getInvoiceUrl = useCallback((paymentId: string) => {
    return `/api/invoices/${paymentId}`;
  }, []);

  // Get payment history
  const getPaymentHistory = useCallback(async () => {
    return withErrorHandling(
      async () => {
        const history = await chromeStorage.get<any[]>('payment_history') || [];
        return history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },
      {
        errorMessage: 'Failed to fetch payment history',
        showError: false,
        rethrow: false,
        log: true
      }
    );
  }, []);

  // Get remaining usage
  const getRemainingUsage = useCallback(async () => {
    if (!subscription) return null;
    
    const planLimits = getPlanById(subscription.planId)?.limits;
    if (!planLimits) return null;
    
    const remaining: Record<string, number> = {};
    
    Object.keys(planLimits).forEach(key => {
      const limitKey = key as keyof typeof planLimits;
      const limit = planLimits[limitKey];
      const used = subscription.usage[limitKey] || 0;
      
      remaining[key] = limit === -1 ? -1 : Math.max(0, limit - used);
    });
    
    return remaining;
  }, [subscription]);

  // Get usage percentages for each limit type
  const getUsagePercentages = useCallback(async () => {
    if (!subscription) return null;
    
    const planLimits = getPlanById(subscription.planId)?.limits;
    if (!planLimits) return null;
    
    const percentages: Record<string, number> = {};
    
    Object.keys(planLimits).forEach(key => {
      const limitKey = key as keyof typeof planLimits;
      const limit = planLimits[limitKey];
      const used = subscription.usage[limitKey] || 0;
      
      percentages[key] = limit === -1 ? 0 : Math.min(100, Math.round((used / limit) * 100));
    });
    
    return percentages;
  }, [subscription]);

  // Check if subscription is currently active
  const isSubscriptionActive = useCallback(() => {
    if (!subscription) return false;
    
    return ['active', 'grace_period'].includes(subscription.status);
  }, [subscription]);

  // Check if subscription is in grace period
  const isInGracePeriod = useCallback(() => {
    if (!subscription) return false;
    
    return subscription.status === 'grace_period';
  }, [subscription]);

  // Calculate days until subscription expires
  const daysUntilExpiration = useCallback(() => {
    if (!subscription) return null;
    
    const now = new Date();
    const endDate = subscription.status === 'grace_period' && subscription.gracePeriodEndDate
      ? new Date(subscription.gracePeriodEndDate)
      : new Date(subscription.currentPeriodEnd);
    
    if (endDate < now) return 0;
    
    return Math.ceil((endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  }, [subscription]);

  // Check if current plan is Pro
  const isProPlan = useCallback(() => {
    if (!subscription) return false;
    
    return subscription.planId === 'pro' && isSubscriptionActive();
  }, [subscription]);

  // Check if subscription is in trial period (if implemented)
  const isTrialActive = useCallback(() => {
    // We don't have trials in our current implementation
    return false;
  }, [subscription]);

  return {
    subscription,
    currentPlan,
    loading,
    error,
    cancelSubscription,
    updatePaymentMethod,
    setAutoRenew,
    changeBillingCycle,
    changePlan,
    getInvoiceUrl,
    getPaymentHistory,
    getRemainingUsage,
    getUsagePercentages,
    checkSubscriptionStatus,
    refreshSubscription,
    isSubscriptionActive,
    isInGracePeriod,
    daysUntilExpiration,
    isProPlan,
    isTrialActive,
    isOffline
  };
};

export default useSubscription;
