import { chromeStorage } from "@/services/chromeStorageService";
import { createNamespacedLogger } from "@/utils/loggerUtils";
import { withErrorHandling } from "@/utils/errorUtils";
import { UserSubscription } from "@/config/subscriptionPlans";
import { toast } from "sonner";
import { t, formatCurrency } from "@/utils/i18n";
import { calculateProratedAmount } from "@/utils/subscriptionRenewal";

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
      
      toast.success(
        autoRenew 
          ? t('subscription.billing.auto_renew_on')
          : t('subscription.billing.auto_renew_off')
      );
      
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
      
      toast.success(t('subscription.billing.payment_method_updated'));
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
 * Change billing cycle (monthly/yearly) with proration support
 */
export const changeBillingCycle = async (cycle: 'monthly' | 'yearly'): Promise<boolean> => {
  return withErrorHandling(
    async () => {
      const userData = await chromeStorage.get('user') || {};
      if (!((userData as any)?.subscription)) return false;
      
      const currentSub = (userData as any).subscription as UserSubscription;
      
      // Skip if already on this cycle
      if (currentSub.billingCycle === cycle) {
        return true;
      }
      
      // Calculate days left in current cycle
      const now = new Date();
      const currentPeriodEnd = new Date(currentSub.currentPeriodEnd);
      const daysLeft = Math.max(0, Math.ceil((currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      
      // Calculate total days in cycle
      const currentPeriodStart = new Date(currentSub.currentPeriodStart);
      const totalDays = Math.ceil((currentPeriodEnd.getTime() - currentPeriodStart.getTime()) / (1000 * 60 * 60 * 24));
      
      // Get the new end date based on the new billing cycle
      const newPeriodEnd = new Date(now);
      if (cycle === 'yearly') {
        newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1);
      } else {
        newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
      }
      
      // Calculate if there's any proration
      const proration = calculateProratedAmount(
        currentSub.planId,
        currentSub.planId,
        currentSub.billingCycle,
        daysLeft,
        totalDays
      );
      
      // If there's a proration amount, show it to the user
      if (proration.amount > 0) {
        const action = proration.isCredit ? 'credited' : 'charged';
        toast.info(t('subscription.billing.prorate_message', {
          action,
          amount: proration.amount.toString(),
          currency: proration.currency,
          days: daysLeft.toString()
        }));
      }
      
      // Update the subscription
      const updatedSub = {
        ...currentSub,
        billingCycle: cycle,
        currentPeriodStart: now.toISOString(),
        currentPeriodEnd: newPeriodEnd.toISOString(),
        updatedAt: now.toISOString()
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
 * Change subscription plan with proration support
 */
export const changePlan = async (newPlanId: string): Promise<{
  success: boolean;
  proratedAmount?: number;
  currency?: string;
  isCredit?: boolean;
}> => {
  return withErrorHandling(
    async () => {
      const userData = await chromeStorage.get('user') || {};
      if (!((userData as any)?.subscription)) return { success: false };
      
      const currentSub = (userData as any).subscription as UserSubscription;
      
      // Skip if already on this plan
      if (currentSub.planId === newPlanId) {
        return { success: true };
      }
      
      // Calculate days left in current cycle
      const now = new Date();
      const currentPeriodEnd = new Date(currentSub.currentPeriodEnd);
      const daysLeft = Math.max(0, Math.ceil((currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      
      // Calculate total days in cycle
      const currentPeriodStart = new Date(currentSub.currentPeriodStart);
      const totalDays = Math.ceil((currentPeriodEnd.getTime() - currentPeriodStart.getTime()) / (1000 * 60 * 60 * 24));
      
      // Calculate proration
      const proration = calculateProratedAmount(
        currentSub.planId,
        newPlanId,
        currentSub.billingCycle,
        daysLeft,
        totalDays
      );
      
      // Process the payment/credit if there's a proration
      if (proration.amount > 0) {
        // In a real implementation, we would charge or credit the customer here
        
        // For demonstration, we just log it
        logger.info("Processing proration for plan change", {
          fromPlan: currentSub.planId,
          toPlan: newPlanId,
          amount: proration.amount,
          isCredit: proration.isCredit
        });
        
        // Show proration info to user
        const action = proration.isCredit ? 'credited' : 'charged';
        toast.info(t('subscription.billing.prorate_message', {
          action,
          amount: proration.amount.toString(),
          currency: proration.currency,
          days: daysLeft.toString()
        }));
      }
      
      // Update the subscription
      const updatedSub = {
        ...currentSub,
        planId: newPlanId,
        updatedAt: now.toISOString()
      };
      
      await chromeStorage.set('user', {
        ...(userData as Record<string, any>),
        subscription: updatedSub
      });
      
      // Show success message based on whether this was an upgrade or downgrade
      const isUpgrade = newPlanId === 'pro' && currentSub.planId === 'free';
      toast.success(isUpgrade 
        ? t('subscription.billing.upgrade_success')
        : t('subscription.billing.downgrade_success')
      );
      
      logger.info(`Plan changed from ${currentSub.planId} to ${newPlanId}`);
      
      return { 
        success: true,
        proratedAmount: proration.amount,
        currency: proration.currency,
        isCredit: proration.isCredit
      };
    },
    { 
      errorMessage: 'Failed to change subscription plan',
      showError: true,
      rethrow: false,
      logMetadata: { operation: 'changePlan', newPlanId }
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

/**
 * Get preferred currency for the user
 */
export const getPreferredCurrency = async (): Promise<string> => {
  try {
    const currency = await chromeStorage.get<string>('preferred_currency');
    return currency || 'USD';
  } catch (error) {
    logger.error("Error getting preferred currency", error);
    return 'USD';
  }
};

/**
 * Set preferred currency for the user
 */
export const setPreferredCurrency = async (currency: string): Promise<boolean> => {
  return withErrorHandling(
    async () => {
      await chromeStorage.set('preferred_currency', currency);
      logger.info(`Preferred currency set to ${currency}`);
      return true;
    },
    { 
      errorMessage: 'Failed to set preferred currency',
      showError: false,
      rethrow: false,
      logMetadata: { operation: 'setPreferredCurrency', currency }
    }
  );
};

/**
 * Handle offline subscription actions by queuing them
 */
export const queueOfflineAction = async (
  action: 'renew' | 'change_plan' | 'change_billing_cycle' | 'cancel',
  data: any
): Promise<boolean> => {
  try {
    if (navigator.onLine) {
      return false; // Don't queue if online
    }
    
    const offlineActions = await chromeStorage.get<any[]>('offline_subscription_actions') || [];
    
    offlineActions.push({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      action,
      data,
      timestamp: new Date().toISOString()
    });
    
    await chromeStorage.set('offline_subscription_actions', offlineActions);
    
    logger.info(`Queued offline action: ${action}`);
    toast.info("You're offline. This action will be processed when you're back online.");
    
    return true;
  } catch (error) {
    logger.error("Error queueing offline action", error);
    return false;
  }
};

/**
 * Process queued offline actions when online
 */
export const processOfflineActions = async (): Promise<void> => {
  if (!navigator.onLine) return;
  
  try {
    const offlineActions = await chromeStorage.get<any[]>('offline_subscription_actions') || [];
    
    if (offlineActions.length === 0) return;
    
    logger.info(`Processing ${offlineActions.length} offline subscription actions`);
    
    const remainingActions = [];
    
    for (const item of offlineActions) {
      try {
        switch (item.action) {
          case 'renew':
            // Process renewal
            // Implementation would depend on other functions
            break;
            
          case 'change_plan':
            await changePlan(item.data.planId);
            break;
            
          case 'change_billing_cycle':
            await changeBillingCycle(item.data.cycle);
            break;
            
          case 'cancel':
            await cancelSubscription(item.data.immediate);
            break;
            
          default:
            logger.warn(`Unknown offline action: ${item.action}`);
            remainingActions.push(item);
        }
      } catch (error) {
        logger.error(`Error processing offline action: ${item.action}`, error);
        remainingActions.push(item);
      }
    }
    
    await chromeStorage.set('offline_subscription_actions', remainingActions);
    
    if (remainingActions.length === 0) {
      logger.info("All offline actions processed successfully");
    } else {
      logger.warn(`${remainingActions.length} offline actions failed to process`);
    }
  } catch (error) {
    logger.error("Error processing offline actions", error);
  }
};

// Listen for online events to process queued actions
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    processOfflineActions();
  });
}
