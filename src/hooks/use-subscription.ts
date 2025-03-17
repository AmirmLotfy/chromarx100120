
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
        } else {
          // Default to free plan if no subscription found
          const defaultSub: Subscription = {
            planId: 'free',
            status: 'active',
            currentPeriodStart: new Date().toISOString(),
            currentPeriodEnd: new Date().toISOString(),
            cancelAtPeriodEnd: false,
            userId: 'local-user'
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

  return {
    subscription,
    currentPlan, // Added for compatibility
    loading,
    error,
    cancelSubscription,
    updatePaymentMethod,
    setAutoRenew
  };
};

export default useSubscription;
