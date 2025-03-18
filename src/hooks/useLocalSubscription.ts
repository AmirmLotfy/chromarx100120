
import { useState, useEffect } from 'react';
import { SubscriptionService, SubscriptionResult } from '@/services/subscriptionService';
import { toast } from 'sonner';

export const useLocalSubscription = (userId: string = 'local-user') => {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkSubscription = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await SubscriptionService.checkSubscription(userId);
      setSubscriptionData(data);
    } catch (err) {
      console.error('Error checking subscription:', err);
      setError('Failed to check subscription status');
      toast.error('Failed to check subscription status');
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async (orderId: string, planId: string, autoRenew: boolean = true) => {
    try {
      const result = await SubscriptionService.processPayment(orderId, planId, autoRenew);
      if (result.success) {
        toast.success('Payment processed successfully');
        await checkSubscription(); // Refresh subscription data
        return true;
      } else {
        toast.error('Payment processing failed');
        return false;
      }
    } catch (err) {
      console.error('Error processing payment:', err);
      toast.error('Payment processing failed');
      return false;
    }
  };

  useEffect(() => {
    checkSubscription();
  }, [userId]);

  return {
    subscription: subscriptionData?.subscription,
    renewalNeeded: subscriptionData?.renewalNeeded || false,
    usageLimits: subscriptionData?.usageLimits,
    needsUpgrade: subscriptionData?.needsUpgrade || false,
    loading,
    error,
    refreshSubscription: checkSubscription,
    processPayment
  };
};
