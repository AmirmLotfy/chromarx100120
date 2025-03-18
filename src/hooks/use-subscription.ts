
import { useState, useEffect, useCallback } from 'react';
import { chromeStorage } from "@/services/chromeStorageService";
import { toast } from 'sonner';

interface Subscription {
  id?: string;
  planId: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  userId: string;
  billingCycle?: 'monthly' | 'yearly';
}

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [currentPlan, setCurrentPlan] = useState<string>("free"); // Added for compatibility

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setLoading(true);
        const sub = await chromeStorage.get<Subscription>('subscription');
        
        if (sub) {
          setSubscription(sub);
          setCurrentPlan(sub.planId);
          
          // Check if renewal is needed
          checkIfRenewalNeeded(sub);
        } else {
          // Default to free plan if no subscription found
          const defaultSub: Subscription = {
            planId: 'free',
            status: 'active',
            currentPeriodStart: new Date().toISOString(),
            currentPeriodEnd: new Date().toISOString(),
            cancelAtPeriodEnd: false,
            userId: 'local-user',
            billingCycle: 'monthly'
          };
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
  }, []);

  // Check if subscription needs renewal
  const checkIfRenewalNeeded = (sub: Subscription) => {
    if (sub.status !== 'active' || sub.cancelAtPeriodEnd) {
      return false;
    }
    
    const currentPeriodEnd = new Date(sub.currentPeriodEnd);
    const now = new Date();
    
    // Calculate days until expiration
    const daysUntilExpiration = Math.floor((currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // If subscription is due in next 3 days and auto-renewal is on, process renewal
    if (daysUntilExpiration <= 3 && !sub.cancelAtPeriodEnd) {
      processRenewal(sub);
      return true;
    }
    
    return false;
  };
  
  // Process subscription renewal
  const processRenewal = async (sub: Subscription) => {
    if (!sub.id) return;
    
    try {
      // Call renewal endpoint
      const response = await fetch('https://tfqkwbvusjhcmbkxnpnt.supabase.co/functions/v1/process-renewal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscriptionId: sub.id
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Update local subscription data
        const updatedSub: Subscription = {
          ...sub,
          currentPeriodStart: result.subscription.current_period_start,
          currentPeriodEnd: result.subscription.current_period_end,
          status: result.subscription.status
        };
        
        await chromeStorage.set('subscription', updatedSub);
        setSubscription(updatedSub);
        
        // Save payment to history
        const paymentHistory = await chromeStorage.get<any[]>('payment_history') || [];
        paymentHistory.push({
          id: result.payment.id,
          orderId: result.payment.id,
          planId: sub.planId,
          amount: result.payment.amount,
          status: result.payment.status,
          provider: result.payment.provider,
          autoRenew: !sub.cancelAtPeriodEnd,
          createdAt: result.payment.created_at,
          type: 'renewal'
        });
        
        await chromeStorage.set('payment_history', paymentHistory);
        
        toast.success('Your subscription has been automatically renewed');
      }
    } catch (err) {
      console.error('Error processing renewal:', err);
    }
  };

  // Define methods to match what the UI is expecting
  const setAutoRenew = async (autoRenew: boolean) => {
    try {
      if (!subscription) return { success: false, error: 'No subscription found' };
      
      const updatedSub = {
        ...subscription,
        cancelAtPeriodEnd: !autoRenew
      };
      
      await chromeStorage.set('subscription', updatedSub);
      setSubscription(updatedSub);
      
      toast.success(`Auto-renewal ${autoRenew ? 'enabled' : 'disabled'}`);
      return { success: true };
    } catch (err) {
      console.error('Error setting auto-renew:', err);
      toast.error('Failed to update auto-renewal settings');
      return { success: false, error: err };
    }
  };

  const cancelSubscription = useCallback(async () => {
    try {
      if (!subscription) return { success: false, error: 'No subscription found' };
      
      const updatedSub = {
        ...subscription,
        status: 'canceled',
        cancelAtPeriodEnd: true
      };
      
      await chromeStorage.set('subscription', updatedSub);
      setSubscription(updatedSub);
      
      toast.success('Subscription canceled successfully');
      return { success: true };
    } catch (err) {
      console.error('Error canceling subscription:', err);
      toast.error('Failed to cancel subscription');
      return { success: false, error: err };
    }
  }, [subscription]);

  const updatePaymentMethod = useCallback(async () => {
    try {
      // This is a simulated action since we don't have real payment processing
      toast.success('Payment method updated successfully');
      return { success: true };
    } catch (err) {
      console.error('Error updating payment method:', err);
      toast.error('Failed to update payment method');
      return { success: false, error: err };
    }
  }, []);

  const changeBillingCycle = async (cycle: 'monthly' | 'yearly') => {
    try {
      if (!subscription) return { success: false, error: 'No subscription found' };
      
      const updatedSub = {
        ...subscription,
        billingCycle: cycle
      };
      
      await chromeStorage.set('subscription', updatedSub);
      setSubscription(updatedSub);
      
      toast.success(`Billing cycle changed to ${cycle}`);
      return { success: true };
    } catch (err) {
      console.error('Error changing billing cycle:', err);
      toast.error('Failed to update billing cycle');
      return { success: false, error: err };
    }
  };

  return {
    subscription,
    currentPlan, // Added for compatibility
    loading,
    error,
    cancelSubscription,
    updatePaymentMethod,
    setAutoRenew,
    changeBillingCycle
  };
};

export default useSubscription;
