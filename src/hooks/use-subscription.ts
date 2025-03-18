
import { useState, useEffect, useCallback } from 'react';
import { chromeStorage } from "@/services/chromeStorageService";
import { toast } from 'sonner';
import { 
  UserSubscription,
  subscriptionPlans,
  updatePaymentMethod as updatePaymentMethodUtils,
  setAutoRenew as setAutoRenewUtils,
  cancelSubscription as cancelSubscriptionUtils,
  changeBillingCycle as changeBillingCycleUtils,
  resetMonthlyUsage as resetMonthlyUsageUtils,
  checkNeedsRenewal as checkNeedsRenewalUtils,
  getPlanById
} from "@/config/subscriptionPlans";

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
}

export const useSubscription = (): UseSubscriptionReturn => {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string>("free"); // For compatibility

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
          await checkSubscriptionStatus(sub as UserSubscription);
          
          // Check if we need to reset monthly usage (first day of month)
          await checkMonthlyReset(sub as UserSubscription);
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
            usage: {
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
            }
          };
          
          // Save the default subscription
          await chromeStorage.set('user', {
            ...userData,
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
      if (subscription) {
        checkSubscriptionStatus(subscription);
        checkMonthlyReset(subscription);
      }
    }, 60 * 60 * 1000); // 1 hour
    
    return () => clearInterval(checkInterval);
  }, []);

  // Check if we need to reset monthly usage (first day of month)
  const checkMonthlyReset = async (sub: UserSubscription) => {
    if (!sub) return;
    
    try {
      // Get the last reset date from storage
      const lastReset = await chromeStorage.get<string>('last_monthly_reset');
      const now = new Date();
      
      // If no last reset or it was a different month, reset the counters
      if (!lastReset || new Date(lastReset).getMonth() !== now.getMonth()) {
        await resetMonthlyUsageUtils();
        await chromeStorage.set('last_monthly_reset', now.toISOString());
        
        // Refresh the subscription to get updated usage values
        await refreshSubscription();
        
        console.log('Monthly usage counters reset');
      }
    } catch (error) {
      console.error('Error checking monthly reset:', error);
    }
  };

  // Check subscription status and handle expiration, renewals, etc.
  const checkSubscriptionStatus = async (sub: UserSubscription) => {
    if (!sub) return;
    
    const now = new Date();
    const currentPeriodEnd = new Date(sub.currentPeriodEnd);
    
    // Skip free plans
    if (sub.planId === 'free') return;
    
    // Check if subscription is expired
    if (currentPeriodEnd < now) {
      if (sub.autoRenew && !sub.cancelAtPeriodEnd) {
        // Try to renew the subscription
        try {
          await processRenewal(sub);
        } catch (error) {
          console.error('Failed to renew subscription:', error);
          
          // If renewal failed, put subscription in grace period
          const gracePeriod = new Date(now);
          gracePeriod.setDate(gracePeriod.getDate() + 7); // 7-day grace period
          
          const updatedSub = {
            ...sub,
            status: 'grace_period' as const,
            gracePeriodEndDate: gracePeriod.toISOString(),
            renewalAttempts: (sub.renewalAttempts || 0) + 1,
            lastRenewalAttempt: now.toISOString()
          };
          
          const userData = await chromeStorage.get('user') || {};
          await chromeStorage.set('user', {
            ...userData,
            subscription: updatedSub
          });
          
          setSubscription(updatedSub);
          
          // Notify user
          toast.error('We were unable to renew your subscription. Please update your payment method.', {
            duration: 10000,
            action: {
              label: 'Update Payment',
              onClick: () => window.location.href = '/subscription'
            }
          });
        }
      } else if (sub.cancelAtPeriodEnd) {
        // If auto-renew is off and subscription is expired, downgrade to free
        const updatedSub = {
          ...sub,
          planId: 'free',
          status: 'expired' as const,
          usage: sub.usage
        };
        
        const userData = await chromeStorage.get('user') || {};
        await chromeStorage.set('user', {
          ...userData,
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
        const updatedSub = {
          ...sub,
          planId: 'free',
          status: 'expired' as const,
          usage: sub.usage
        };
        
        const userData = await chromeStorage.get('user') || {};
        await chromeStorage.set('user', {
          ...userData,
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
          try {
            await processRenewal(sub);
          } catch (error) {
            console.error('Failed to renew subscription in grace period:', error);
            
            // Update renewal attempts
            const updatedSub = {
              ...sub,
              renewalAttempts: (sub.renewalAttempts || 0) + 1,
              lastRenewalAttempt: now.toISOString()
            };
            
            const userData = await chromeStorage.get('user') || {};
            await chromeStorage.set('user', {
              ...userData,
              subscription: updatedSub
            });
            
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
        try {
          await processRenewal(sub);
        } catch (error) {
          console.error('Failed to renew subscription proactively:', error);
          // We'll try again later, no need to change status yet
        }
      }
    }
  };
  
  // Refresh subscription data from storage
  const refreshSubscription = async () => {
    try {
      const userData = await chromeStorage.get('user');
      if ((userData as any)?.subscription) {
        setSubscription((userData as any).subscription);
        setCurrentPlan((userData as any).subscription.planId);
      }
    } catch (error) {
      console.error('Error refreshing subscription:', error);
    }
  };
  
  // Process subscription renewal
  const processRenewal = async (sub: UserSubscription) => {
    try {
      // Check if a renewal is actually needed
      const needsRenewal = await checkNeedsRenewalUtils();
      if (!needsRenewal) {
        console.log('No renewal needed at this time');
        return false;
      }
      
      // Call the renewal endpoint
      const response = await fetch('https://tfqkwbvusjhcmbkxnpnt.supabase.co/functions/v1/process-renewal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscriptionId: `sub_${Date.now()}`,
          billingCycle: sub.billingCycle,
          retryAttempt: sub.renewalAttempts || 0
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Renewal failed with status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Get the plan details
        const plan = subscriptionPlans.find(p => p.id === sub.planId);
        
        // Update local subscription data
        const updatedSub: UserSubscription = {
          ...sub,
          status: 'active',
          currentPeriodStart: result.subscription.current_period_start,
          currentPeriodEnd: result.subscription.current_period_end,
          renewalAttempts: 0, // Reset renewal attempts
          gracePeriodEndDate: undefined, // Clear grace period
        };
        
        const userData = await chromeStorage.get('user') || {};
        await chromeStorage.set('user', {
          ...userData,
          subscription: updatedSub
        });
        
        setSubscription(updatedSub);
        
        // Save payment to history
        const paymentHistory = await chromeStorage.get<any[]>('payment_history') || [];
        const amount = sub.billingCycle === 'yearly' 
          ? plan?.pricing.yearly || 49.99 
          : plan?.pricing.monthly || 4.99;
          
        paymentHistory.push({
          id: result.payment.id,
          orderId: result.payment.id,
          planId: sub.planId,
          amount: amount,
          status: result.payment.status,
          provider: result.payment.provider,
          autoRenew: sub.autoRenew,
          createdAt: result.payment.created_at,
          type: 'renewal',
          billingCycle: sub.billingCycle,
          receiptUrl: result.receipt.receipt_url,
          invoicePdf: result.receipt.invoice_pdf
        });
        
        await chromeStorage.set('payment_history', paymentHistory);
        
        // Notify user of successful renewal
        toast.success('Your subscription has been automatically renewed', {
          description: `Your ${sub.billingCycle} subscription has been renewed successfully.`,
          action: {
            label: 'View Receipt',
            onClick: () => window.open(result.receipt.receipt_url, '_blank')
          }
        });
        
        return true;
      } else {
        // Handle failed renewal
        if (result.errorDetails?.code === 'payment_failed_grace_period') {
          // Enter grace period
          const updatedSub = {
            ...sub,
            status: 'grace_period' as const,
            gracePeriodEndDate: result.errorDetails.gracePeriodEnd,
            renewalAttempts: result.errorDetails.attemptsCount || 1
          };
          
          const userData = await chromeStorage.get('user') || {};
          await chromeStorage.set('user', {
            ...userData,
            subscription: updatedSub
          });
          
          setSubscription(updatedSub);
          
          // Notify user
          toast.error('Your payment method failed. Your subscription is now in a grace period.', {
            duration: 10000,
            action: {
              label: 'Update Payment',
              onClick: () => window.location.href = '/subscription'
            }
          });
        } else {
          // Regular payment failure, will retry
          const updatedSub = {
            ...sub,
            renewalAttempts: (sub.renewalAttempts || 0) + 1,
            lastRenewalAttempt: new Date().toISOString()
          };
          
          const userData = await chromeStorage.get('user') || {};
          await chromeStorage.set('user', {
            ...userData,
            subscription: updatedSub
          });
          
          setSubscription(updatedSub);
          
          // Only notify on first attempt
          if (!sub.renewalAttempts) {
            toast.error('There was an issue processing your renewal. We will try again.', {
              duration: 8000,
              action: {
                label: 'Update Payment',
                onClick: () => window.location.href = '/subscription'
              }
            });
          }
        }
        
        throw new Error(result.error || 'Renewal failed');
      }
    } catch (err) {
      console.error('Error processing renewal:', err);
      throw err;
    }
  };

  // Set auto-renew status
  const setAutoRenew = useCallback(async (autoRenew: boolean) => {
    try {
      if (!subscription) return { success: false, error: 'No subscription found' };
      
      const result = await setAutoRenewUtils(autoRenew);
      
      if (result) {
        // Refresh subscription data
        await refreshSubscription();
      }
      
      return { success: result };
    } catch (err) {
      console.error('Error setting auto-renew:', err);
      return { success: false, error: err };
    }
  }, [subscription]);

  // Cancel subscription
  const cancelSubscription = useCallback(async (immediate: boolean = false) => {
    try {
      if (!subscription) return { success: false, error: 'No subscription found' };
      
      const result = await cancelSubscriptionUtils(immediate);
      
      if (result) {
        // Refresh subscription data
        await refreshSubscription();
      }
      
      return { success: result };
    } catch (err) {
      console.error('Error canceling subscription:', err);
      return { success: false, error: err };
    }
  }, [subscription]);

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
              await processRenewal((userData as any).subscription);
              toast.success('Subscription renewed successfully with your new payment method');
            }
          } catch (error) {
            console.error('Failed to renew with new payment method:', error);
            toast.error('Failed to renew subscription with new payment method. We will try again later.');
          }
        }
      }
      
      return { success: result };
    } catch (err) {
      console.error('Error updating payment method:', err);
      return { success: false, error: err };
    }
  }, [subscription]);

  // Change billing cycle
  const changeBillingCycle = useCallback(async (cycle: 'monthly' | 'yearly') => {
    try {
      if (!subscription) return { success: false, error: 'No subscription found' };
      
      const result = await changeBillingCycleUtils(cycle);
      
      if (result) {
        // Refresh subscription data
        await refreshSubscription();
      }
      
      return { success: result };
    } catch (err) {
      console.error('Error changing billing cycle:', err);
      return { success: false, error: err };
    }
  }, [subscription]);

  // Get invoice/receipt PDF URL
  const getInvoiceUrl = useCallback((paymentId: string) => {
    return `/api/invoices/${paymentId}`;
  }, []);

  // Get payment history
  const getPaymentHistory = useCallback(async () => {
    try {
      const history = await chromeStorage.get<any[]>('payment_history') || [];
      return history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
      console.error('Error fetching payment history:', err);
      return [];
    }
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
    isTrialActive
  };
};

export default useSubscription;
