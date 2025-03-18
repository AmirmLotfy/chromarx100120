
import { useState, useEffect, useCallback } from 'react';
import { chromeStorage } from "@/services/chromeStorageService";
import { toast } from 'sonner';
import { 
  UserSubscription, 
  subscriptionPlans,
  updatePaymentMethod as updatePaymentMethodUtils,
  setAutoRenew as setAutoRenewUtils,
  cancelSubscription as cancelSubscriptionUtils,
  changeBillingCycle as changeBillingCycleUtils
} from "@/config/subscriptionPlans";

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [currentPlan, setCurrentPlan] = useState<string>("free"); // For compatibility

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setLoading(true);
        
        // Get user data including subscription details
        const userData = await chromeStorage.get('user') || {};
        const sub = userData.subscription;
        
        if (sub) {
          setSubscription(sub);
          setCurrentPlan(sub.planId);
          
          // Check subscription status and handle renewals if needed
          await checkSubscriptionStatus(sub);
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
              tasks: 0,
              notes: 0,
              aiRequests: 0
            }
          };
          
          // Save the default subscription
          await chromeStorage.update('user', { subscription: defaultSub });
          setSubscription(defaultSub);
          setCurrentPlan('free');
        }
      } catch (err) {
        console.error('Error fetching subscription:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSubscription();
    
    // Set up a periodic check for subscription status (every hour)
    const checkInterval = setInterval(() => {
      if (subscription) {
        checkSubscriptionStatus(subscription);
      }
    }, 60 * 60 * 1000); // 1 hour
    
    return () => clearInterval(checkInterval);
  }, []);

  // Check subscription status and handle expiration, renewals, etc.
  const checkSubscriptionStatus = async (sub: UserSubscription) => {
    if (!sub) return;
    
    const now = new Date();
    const currentPeriodEnd = new Date(sub.currentPeriodEnd);
    
    // Skip free plans
    if (sub.planId === 'free') return;
    
    // Check if subscription is expired
    if (currentPeriodEnd < now) {
      if (sub.autoRenew) {
        // Try to renew the subscription
        try {
          await processRenewal(sub);
        } catch (error) {
          console.error('Failed to renew subscription:', error);
          
          // If renewal failed, put subscription in grace period
          const gracePeriod = new Date(now);
          gracePeriod.setDate(gracePeriod.getDate() + 3); // 3-day grace period
          
          const updatedSub = {
            ...sub,
            status: 'grace_period' as const,
            gracePeriodEndDate: gracePeriod.toISOString(),
            renewalAttempts: (sub.renewalAttempts || 0) + 1,
            lastRenewalAttempt: now.toISOString()
          };
          
          await chromeStorage.update('user', { subscription: updatedSub });
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
          status: 'expired',
          usage: sub.usage
        };
        
        await chromeStorage.update('user', { subscription: updatedSub });
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
          status: 'expired',
          usage: sub.usage
        };
        
        await chromeStorage.update('user', { subscription: updatedSub });
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
            
            await chromeStorage.update('user', { subscription: updatedSub });
            setSubscription(updatedSub);
          }
        }
      }
    }
    // Check if subscription is nearing expiration (3 days) and should be renewed
    else if (sub.autoRenew && 
             !sub.cancelAtPeriodEnd && 
             currentPeriodEnd.getTime() - now.getTime() < 3 * 24 * 60 * 60 * 1000) {
      
      // Notify user of upcoming renewal
      toast.info(`Your Pro subscription will renew in ${Math.ceil((currentPeriodEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))} days`, {
        duration: 8000
      });
      
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
  
  // Process subscription renewal
  const processRenewal = async (sub: UserSubscription) => {
    try {
      // Call the renewal endpoint
      const response = await fetch('https://tfqkwbvusjhcmbkxnpnt.supabase.co/functions/v1/process-renewal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscriptionId: sub.id || `sub_${Date.now()}`
        })
      });
      
      if (!response.ok) {
        throw new Error(`Renewal failed with status: ${response.status}`);
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
        
        await chromeStorage.update('user', { subscription: updatedSub });
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
          billingCycle: sub.billingCycle
        });
        
        await chromeStorage.set('payment_history', paymentHistory);
        
        // Notify user of successful renewal
        toast.success('Your subscription has been automatically renewed');
        
        return true;
      } else {
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
        const updatedSub = {
          ...subscription,
          autoRenew,
          cancelAtPeriodEnd: !autoRenew
        };
        
        setSubscription(updatedSub);
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
        if (immediate) {
          const updatedSub = {
            ...subscription,
            planId: 'free',
            status: 'canceled',
            cancelAtPeriodEnd: true,
            autoRenew: false
          };
          
          setSubscription(updatedSub);
          setCurrentPlan('free');
        } else {
          const updatedSub = {
            ...subscription,
            cancelAtPeriodEnd: true,
            autoRenew: false
          };
          
          setSubscription(updatedSub);
        }
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
        const updatedSub = {
          ...subscription,
          paymentMethod
        };
        
        setSubscription(updatedSub);
        
        // If in grace period, try renewal again
        if (subscription.status === 'grace_period') {
          try {
            await processRenewal(updatedSub);
            toast.success('Subscription renewed successfully with your new payment method');
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
        // Get updated subscription from storage since it has new dates
        const userData = await chromeStorage.get('user') || {};
        if (userData.subscription) {
          setSubscription(userData.subscription);
        }
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
    
    const planLimits = subscriptionPlans.find(p => p.id === subscription.planId)?.limits;
    if (!planLimits) return null;
    
    return {
      bookmarks: planLimits.bookmarks === -1 ? -1 : planLimits.bookmarks - (subscription.usage?.bookmarks || 0),
      tasks: planLimits.tasks === -1 ? -1 : planLimits.tasks - (subscription.usage?.tasks || 0),
      notes: planLimits.notes === -1 ? -1 : planLimits.notes - (subscription.usage?.notes || 0),
      aiRequests: planLimits.aiRequests === -1 ? -1 : planLimits.aiRequests - (subscription.usage?.aiRequests || 0)
    };
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
    checkSubscriptionStatus
  };
};

export default useSubscription;
