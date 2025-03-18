import { chromeStorage } from "@/services/chromeStorageService";
import { createNamespacedLogger } from "@/utils/loggerUtils";
import { withErrorHandling } from "@/utils/errorUtils";
import { UserSubscription } from "@/config/subscriptionPlans";
import { toast } from "sonner";

// Set up a namespaced logger for subscription functions
const logger = createNamespacedLogger("subscriptionUtils");

/**
 * Resets monthly usage counters for a subscription
 */
export const resetMonthlyUsage = async (): Promise<boolean> => {
  return withErrorHandling(
    async () => {
      const userData = await chromeStorage.get('user') || {};
      if (!((userData as any)?.subscription)) return false;
      
      const updatedSub = {
        ...((userData as any).subscription),
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
      
      await chromeStorage.set('user', {
        ...(userData as Record<string, any>),
        subscription: updatedSub
      });
      
      logger.info("Monthly usage counters reset");
      return true;
    },
    { 
      errorMessage: 'Failed to reset monthly usage',
      showError: false,
      rethrow: false,
      logMetadata: { operation: 'resetMonthlyUsage' }
    }
  );
};

/**
 * Check if subscription needs renewal
 */
export const checkNeedsRenewal = async (subscription?: UserSubscription): Promise<boolean> => {
  return withErrorHandling(
    async () => {
      if (!subscription) {
        const userData = await chromeStorage.get('user') || {};
        if (!((userData as any)?.subscription)) return false;
        subscription = (userData as any).subscription;
      }
      
      const now = new Date();
      const currentPeriodEnd = new Date(subscription.currentPeriodEnd);
      
      // Needs renewal if:
      // 1. Subscription is expired
      // 2. Subscription is in grace period
      // 3. Within 24 hours of expiration and auto-renew is on
      return (
        (currentPeriodEnd < now) ||
        (subscription.status === 'grace_period') ||
        (subscription.autoRenew && 
        !subscription.cancelAtPeriodEnd && 
        currentPeriodEnd.getTime() - now.getTime() < 24 * 60 * 60 * 1000)
      );
    },
    { 
      errorMessage: 'Failed to check if renewal is needed',
      showError: false,
      rethrow: false,
      logMetadata: { operation: 'checkNeedsRenewal' }
    }
  );
};

/**
 * Process subscription payment and update local storage
 */
export const processPayment = async (
  paymentDetails: {
    id: string;
    amount: number;
    status: 'completed' | 'failed' | 'pending';
    provider: string;
  },
  subscription: UserSubscription
): Promise<boolean> => {
  return withErrorHandling(
    async () => {
      const paymentHistory = await chromeStorage.get<any[]>('payment_history') || [];
      
      // Add payment to history
      paymentHistory.push({
        id: paymentDetails.id,
        orderId: paymentDetails.id,
        planId: subscription.planId,
        amount: paymentDetails.amount,
        status: paymentDetails.status,
        provider: paymentDetails.provider,
        autoRenew: subscription.autoRenew,
        createdAt: new Date().toISOString(),
        type: 'renewal',
        billingCycle: subscription.billingCycle
      });
      
      await chromeStorage.set('payment_history', paymentHistory);
      
      logger.info("Payment processed and recorded", { paymentId: paymentDetails.id });
      return true;
    },
    { 
      errorMessage: 'Failed to process payment record',
      showError: false,
      rethrow: false,
      logMetadata: { operation: 'processPayment' }
    }
  );
};

/**
 * Set auto-renew status for a subscription
 */
export const setAutoRenew = async (autoRenew: boolean): Promise<boolean> => {
  return withErrorHandling(
    async () => {
      const userData = await chromeStorage.get('user') || {};
      if (!((userData as any)?.subscription)) return false;
      
      const updatedSub = {
        ...((userData as any).subscription),
        autoRenew,
        cancelAtPeriodEnd: !autoRenew,
        updatedAt: new Date().toISOString()
      };
      
      await chromeStorage.set('user', {
        ...(userData as Record<string, any>),
        subscription: updatedSub
      });
      
      toast.success(autoRenew 
        ? 'Auto-renewal turned on' 
        : 'Auto-renewal turned off. Your subscription will end on the expiration date.');
      
      logger.info(`Auto-renew set to ${autoRenew}`);
      return true;
    },
    { 
      errorMessage: 'Failed to update auto-renew settings',
      showError: true,
      rethrow: false,
      logMetadata: { operation: 'setAutoRenew', newValue: autoRenew }
    }
  );
};

/**
 * Cancel a subscription (immediately or at period end)
 */
export const cancelSubscription = async (immediate: boolean = false): Promise<boolean> => {
  return withErrorHandling(
    async () => {
      const userData = await chromeStorage.get('user') || {};
      if (!((userData as any)?.subscription)) return false;
      
      let updatedSub = null;
      
      if (immediate) {
        // Immediately downgrade to free
        updatedSub = {
          ...((userData as any).subscription),
          planId: 'free',
          status: 'canceled',
          autoRenew: false,
          cancelAtPeriodEnd: true,
          updatedAt: new Date().toISOString()
        };
      } else {
        // Cancel at period end
        updatedSub = {
          ...((userData as any).subscription),
          cancelAtPeriodEnd: true,
          autoRenew: false,
          updatedAt: new Date().toISOString()
        };
      }
      
      await chromeStorage.set('user', {
        ...(userData as Record<string, any>),
        subscription: updatedSub
      });
      
      toast.success(immediate 
        ? 'Your subscription has been canceled immediately' 
        : 'Your subscription will cancel at the end of the billing period');
      
      logger.info(`Subscription canceled - immediate: ${immediate}`);
      return true;
    },
    { 
      errorMessage: 'Failed to cancel subscription',
      showError: true,
      rethrow: false,
      logMetadata: { operation: 'cancelSubscription', immediate }
    }
  );
};

/**
 * Update payment method
 */
export const updatePaymentMethod = async (paymentMethod: {
  type: 'card' | 'paypal';
  lastFour?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
}): Promise<boolean> => {
  return withErrorHandling(
    async () => {
      const userData = await chromeStorage.get('user') || {};
      if (!((userData as any)?.subscription)) return false;
      
      const updatedSub = {
        ...((userData as any).subscription),
        paymentMethod: paymentMethod,
        updatedAt: new Date().toISOString()
      };
      
      await chromeStorage.set('user', {
        ...(userData as Record<string, any>),
        subscription: updatedSub
      });
      
      toast.success('Payment method updated successfully');
      logger.info("Payment method updated", { type: paymentMethod.type });
      return true;
    },
    { 
      errorMessage: 'Failed to update payment method',
      showError: true,
      rethrow: false,
      logMetadata: { operation: 'updatePaymentMethod' }
    }
  );
};

/**
 * Change billing cycle (monthly/yearly)
 */
export const changeBillingCycle = async (cycle: 'monthly' | 'yearly'): Promise<boolean> => {
  return withErrorHandling(
    async () => {
      const userData = await chromeStorage.get('user') || {};
      if (!((userData as any)?.subscription)) return false;
      
      const updatedSub = {
        ...((userData as any).subscription),
        billingCycle: cycle,
        updatedAt: new Date().toISOString()
      };
      
      await chromeStorage.set('user', {
        ...(userData as Record<string, any>),
        subscription: updatedSub
      });
      
      toast.success(`Billing cycle changed to ${cycle}`);
      logger.info(`Billing cycle changed to ${cycle}`);
      return true;
    },
    { 
      errorMessage: 'Failed to change billing cycle',
      showError: true,
      rethrow: false,
      logMetadata: { operation: 'changeBillingCycle', cycle }
    }
  );
};

/**
 * Create a fully initialized usage object with all required properties
 */
export const createDefaultUsage = (existingUsage?: Partial<Record<string, number>>) => {
  return {
    bookmarks: existingUsage?.bookmarks || 0,
    bookmarkImports: existingUsage?.bookmarkImports || 0,
    bookmarkCategorization: existingUsage?.bookmarkCategorization || 0,
    bookmarkSummaries: existingUsage?.bookmarkSummaries || 0,
    keywordExtraction: existingUsage?.keywordExtraction || 0,
    tasks: existingUsage?.tasks || 0,
    taskEstimation: existingUsage?.taskEstimation || 0,
    notes: existingUsage?.notes || 0,
    noteSentimentAnalysis: existingUsage?.noteSentimentAnalysis || 0,
    aiRequests: existingUsage?.aiRequests || 0
  };
};

/**
 * Update subscription status with proper error handling and recovery
 */
export const updateSubscriptionStatus = async (
  subscription: UserSubscription, 
  newStatus: 'active' | 'expired' | 'canceled' | 'grace_period',
  additionalData: Partial<UserSubscription> = {}
): Promise<UserSubscription | null> => {
  return withErrorHandling(
    async () => {
      const userData = await chromeStorage.get('user') || {};
      if (!((userData as any)?.subscription)) return null;
      
      // Create updated subscription with proper defaults for all fields
      const updatedSub = {
        ...((userData as any).subscription),
        ...additionalData,
        status: newStatus,
        updatedAt: new Date().toISOString(),
        usage: createDefaultUsage(
          // If provided in additionalData, use that, otherwise use existing usage
          additionalData.usage || (userData as any).subscription.usage
        )
      };
      
      await chromeStorage.set('user', {
        ...(userData as Record<string, any>),
        subscription: updatedSub
      });
      
      logger.info(`Subscription status updated to ${newStatus}`, additionalData);
      return updatedSub;
    },
    { 
      errorMessage: `Failed to update subscription to ${newStatus} status`,
      showError: false,
      rethrow: false,
      logMetadata: { operation: 'updateSubscriptionStatus', newStatus, additionalData }
    }
  );
};
