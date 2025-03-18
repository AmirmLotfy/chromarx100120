
import { useState, useEffect } from 'react';
import { subscriptionService, Subscription } from '@/services/subscriptionService';

interface UseSubscriptionResult {
  subscription: Subscription | null;
  isLoading: boolean;
  error: Error | null;
  checkStatus: () => Promise<void>;
  subscribe: (planId: string, durationMonths?: number) => Promise<boolean>;
  cancel: (immediate?: boolean) => Promise<boolean>;
  reactivate: () => Promise<boolean>;
}

export function useLocalSubscription(userId: string = 'local-user'): UseSubscriptionResult {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const checkStatus = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await subscriptionService.getUserSubscription(userId);
      
      if (error) {
        setError(error);
      } else {
        setSubscription(data);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error checking subscription'));
    } finally {
      setIsLoading(false);
    }
  };

  const subscribe = async (planId: string, durationMonths: number = 1): Promise<boolean> => {
    try {
      setIsLoading(true);
      const { data, error } = await subscriptionService.createOrUpdateSubscription(
        userId,
        planId,
        'active',
        durationMonths
      );
      
      if (error) {
        setError(error);
        return false;
      }
      
      setSubscription(data);
      setError(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error subscribing'));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const cancel = async (immediate: boolean = false): Promise<boolean> => {
    try {
      setIsLoading(true);
      const success = await subscriptionService.cancelSubscription(userId, immediate);
      
      if (success) {
        await checkStatus(); // Refresh subscription data
      }
      
      return success;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error canceling subscription'));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const reactivate = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      const success = await subscriptionService.reactivateSubscription(userId);
      
      if (success) {
        await checkStatus(); // Refresh subscription data
      }
      
      return success;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error reactivating subscription'));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, [userId]);

  return {
    subscription,
    isLoading,
    error,
    checkStatus,
    subscribe,
    cancel,
    reactivate
  };
}
