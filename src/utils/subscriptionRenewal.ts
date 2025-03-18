import { chromeStorage } from "@/services/chromeStorageService";
import { UserSubscription } from "@/config/subscriptionPlans";
import { toast } from "sonner";
import { createNamespacedLogger } from "@/utils/loggerUtils";
import { updateSubscriptionStatus, processPayment } from "@/utils/subscriptionUtils";

// Set up a namespaced logger
const logger = createNamespacedLogger("subscriptionRenewal");

/**
 * Process renewal for a subscription that's due
 */
export const processRenewal = async (subscription: UserSubscription): Promise<{
  success: boolean;
  subscription?: UserSubscription;
  error?: string;
}> => {
  try {
    logger.info("Processing renewal for subscription", { planId: subscription.planId });
    
    // Check if online - important for handling offline scenarios
    if (!navigator.onLine) {
      logger.warn("Device is offline, scheduling renewal for when back online");
      
      // Store pending renewal in local storage to process when back online
      await storePendingRenewal(subscription);
      
      return { 
        success: false, 
        error: "Device is offline, renewal will be processed when connection is restored" 
      };
    }
    
    // In a real implementation, we would charge the payment method on file
    const paymentSuccess = Math.random() > 0.1; // Simulate 90% success rate for renewals
    
    if (paymentSuccess) {
      // Calculate the new period dates
      const now = new Date();
      const newPeriodStart = now.toISOString();
      
      const newPeriodEnd = new Date(now);
      if (subscription.billingCycle === 'yearly') {
        newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1);
      } else {
        newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
      }
      
      // Process the successful payment
      await processPayment(
        {
          id: `pmt_${Date.now()}`,
          amount: subscription.billingCycle === 'yearly' ? 99.99 : 9.99,
          status: 'completed',
          provider: subscription.paymentMethod?.type || 'card'
        },
        subscription
      );
      
      // Update the subscription with new period dates
      const updatedSubscription = await updateSubscriptionStatus(subscription, 'active', {
        currentPeriodStart: newPeriodStart,
        currentPeriodEnd: newPeriodEnd.toISOString(),
        gracePeriodEndDate: undefined,
        renewalAttempts: 0
      });
      
      if (!updatedSubscription) {
        throw new Error("Failed to update subscription after renewal");
      }
      
      logger.info("Renewal successful", { 
        planId: subscription.planId, 
        newPeriodEnd: newPeriodEnd.toISOString() 
      });
      
      return { success: true, subscription: updatedSubscription };
    } else {
      // Handle failed payment - enter grace period
      const now = new Date();
      const gracePeriodEndDate = new Date(now);
      gracePeriodEndDate.setDate(gracePeriodEndDate.getDate() + 7); // 7-day grace period
      
      // Increment renewal attempts
      const renewalAttempts = (subscription.renewalAttempts || 0) + 1;
      
      // Update the subscription to grace period
      const updatedSubscription = await updateSubscriptionStatus(subscription, 'grace_period', {
        gracePeriodEndDate: gracePeriodEndDate.toISOString(),
        renewalAttempts
      });
      
      if (!updatedSubscription) {
        throw new Error("Failed to update subscription to grace period");
      }
      
      // Show a notification about the failed renewal
      toast.error("We couldn't process your subscription renewal", {
        duration: 10000,
        action: {
          label: 'Update Payment',
          onClick: () => window.location.href = '/subscription'
        }
      });
      
      logger.warn("Renewal failed, entered grace period", { 
        planId: subscription.planId, 
        gracePeriodEnd: gracePeriodEndDate.toISOString(),
        attempts: renewalAttempts
      });
      
      return { 
        success: false, 
        subscription: updatedSubscription,
        error: "Payment failed, entered grace period" 
      };
    }
  } catch (error) {
    logger.error("Error processing renewal:", error);
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error processing renewal" 
    };
  }
};

/**
 * Store a pending renewal to process when the device is back online
 */
const storePendingRenewal = async (subscription: UserSubscription): Promise<void> => {
  try {
    const pendingRenewals = await chromeStorage.get<UserSubscription[]>('pending_renewals') || [];
    
    // Add this subscription to pending renewals if not already there
    const alreadyPending = pendingRenewals.some(s => s.id === subscription.id);
    
    if (!alreadyPending) {
      pendingRenewals.push(subscription);
      await chromeStorage.set('pending_renewals', pendingRenewals);
      logger.info("Stored pending renewal for later processing", { id: subscription.id });
    }
  } catch (error) {
    logger.error("Error storing pending renewal:", error);
  }
};

/**
 * Retry any failed renewals that are stored in pending_renewals
 */
export const retryFailedRenewals = async (): Promise<void> => {
  try {
    // Skip if offline
    if (!navigator.onLine) {
      return;
    }
    
    const pendingRenewals = await chromeStorage.get<UserSubscription[]>('pending_renewals') || [];
    
    if (pendingRenewals.length === 0) {
      return;
    }
    
    logger.info("Processing pending renewals", { count: pendingRenewals.length });
    
    // Process each pending renewal
    const remainingRenewals = [];
    
    for (const subscription of pendingRenewals) {
      const { success } = await processRenewal(subscription);
      
      if (!success) {
        // Keep in the pending list if still failed
        remainingRenewals.push(subscription);
      }
    }
    
    // Update the pending renewals list
    await chromeStorage.set('pending_renewals', remainingRenewals);
    
    if (remainingRenewals.length === 0) {
      logger.info("All pending renewals processed successfully");
    } else {
      logger.warn("Some renewals still pending", { count: remainingRenewals.length });
    }
  } catch (error) {
    logger.error("Error processing pending renewals:", error);
  }
};

/**
 * Calculate prorated amount for plan changes
 */
export const calculateProratedAmount = (
  currentPlan: string, 
  newPlan: string, 
  currentBillingCycle: 'monthly' | 'yearly',
  daysLeft: number,
  daysTotal: number
): { 
  amount: number; 
  currency: string;
  isCredit: boolean;
} => {
  // Plan prices (could be moved to a config file)
  const prices = {
    monthly: {
      free: 0,
      pro: 9.99
    },
    yearly: {
      free: 0,
      pro: 99.99
    }
  };
  
  // Current plan's price
  const currentPrice = prices[currentBillingCycle][currentPlan as keyof typeof prices.monthly] || 0;
  
  // New plan's price
  const newPrice = prices[currentBillingCycle][newPlan as keyof typeof prices.monthly] || 0;
  
  // Unused portion of current subscription
  const unusedPortion = (daysLeft / daysTotal) * currentPrice;
  
  // Cost of remaining time on new plan
  const newPlanCostForRemainingTime = (daysLeft / daysTotal) * newPrice;
  
  // Difference (positive = charge, negative = credit)
  const difference = newPlanCostForRemainingTime - unusedPortion;
  
  return {
    amount: Math.abs(difference.toFixed(2) as unknown as number),
    currency: 'USD',
    isCredit: difference < 0
  };
};
