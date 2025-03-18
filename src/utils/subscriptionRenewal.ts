
import { createNamespacedLogger } from "@/utils/loggerUtils";
import { withErrorHandling } from "@/utils/errorUtils";
import { UserSubscription } from "@/config/subscriptionPlans";
import { toast } from "sonner";
import { chromeStorage } from "@/services/chromeStorageService";
import { updateSubscriptionStatus, checkNeedsRenewal, processPayment, createDefaultUsage } from "./subscriptionUtils";

// Set up a namespaced logger for subscription renewal
const logger = createNamespacedLogger("subscriptionRenewal");

// Maximum number of automatic retries for renewal
const MAX_RENEWAL_ATTEMPTS = 3;

// Grace period length in days
const GRACE_PERIOD_DAYS = 7;

/**
 * Process subscription renewal with error recovery
 */
export const processRenewal = async (
  subscription: UserSubscription, 
  options: {
    forceRenew?: boolean;
    showNotifications?: boolean;
  } = {}
): Promise<{success: boolean; error?: string; subscription?: UserSubscription}> => {
  return withErrorHandling(
    async () => {
      const { forceRenew = false, showNotifications = true } = options;
      
      // Check if renewal is needed (unless forced)
      if (!forceRenew) {
        const needsRenewal = await checkNeedsRenewal(subscription);
        if (!needsRenewal) {
          logger.info('No renewal needed at this time');
          return { success: true, subscription };
        }
      }
      
      // Add retry logic with exponential backoff
      const attemptRenewal = async (retryCount = 0): Promise<{success: boolean; error?: string; subscription?: UserSubscription}> => {
        try {
          const response = await fetch('https://tfqkwbvusjhcmbkxnpnt.supabase.co/functions/v1/process-renewal', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              subscriptionId: subscription.id || `sub_${Date.now()}`,
              billingCycle: subscription.billingCycle,
              retryAttempt: retryCount
            })
          });
          
          // Network error or server unavailable
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
            const errorMessage = errorData.error || `Renewal failed with status: ${response.status}`;
            
            // If we have retries left, try again with exponential backoff
            if (retryCount < MAX_RENEWAL_ATTEMPTS) {
              const backoffDelay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s, ...
              logger.warn(`Renewal attempt ${retryCount + 1} failed, retrying in ${backoffDelay}ms`, { error: errorMessage });
              
              // Wait for backoff period
              await new Promise(resolve => setTimeout(resolve, backoffDelay));
              
              // Try again with incremented retry count
              return attemptRenewal(retryCount + 1);
            }
            
            // No more retries, enter grace period
            const now = new Date();
            const gracePeriodEnd = new Date(now);
            gracePeriodEnd.setDate(gracePeriodEnd.getDate() + GRACE_PERIOD_DAYS);
            
            const updatedSubscription = await updateSubscriptionStatus(subscription, 'grace_period', {
              gracePeriodEndDate: gracePeriodEnd.toISOString(),
              renewalAttempts: (subscription.renewalAttempts || 0) + 1,
              lastRenewalAttempt: now.toISOString()
            });
            
            if (showNotifications) {
              toast.error('We were unable to process your subscription renewal. Your subscription is now in a grace period.', {
                duration: 10000,
                action: {
                  label: 'Update Payment',
                  onClick: () => window.location.href = '/subscription'
                }
              });
            }
            
            return { 
              success: false, 
              error: errorMessage,
              subscription: updatedSubscription || undefined
            };
          }
          
          // We got a successful response
          const result = await response.json();
          
          if (result.success) {
            // Process successful renewal
            const now = new Date();
            const periodEnd = new Date(now);
            periodEnd.setMonth(periodEnd.getMonth() + (subscription.billingCycle === 'yearly' ? 12 : 1));
            
            // Record payment
            await processPayment({
              id: result.payment.id,
              amount: result.payment.amount,
              status: result.payment.status,
              provider: result.payment.provider
            }, subscription);
            
            // Update subscription status
            const updatedSubscription = await updateSubscriptionStatus(subscription, 'active', {
              currentPeriodStart: now.toISOString(),
              currentPeriodEnd: periodEnd.toISOString(),
              renewalAttempts: 0,
              gracePeriodEndDate: undefined,
              lastRenewal: now.toISOString()
            });
            
            if (showNotifications) {
              toast.success('Your subscription has been renewed successfully', {
                description: `Your ${subscription.billingCycle} subscription has been renewed.`,
                action: {
                  label: 'View Receipt',
                  onClick: () => window.open(result.receipt.receipt_url, '_blank')
                }
              });
            }
            
            return { 
              success: true, 
              subscription: updatedSubscription || undefined
            };
          } else {
            // Handle failed renewal despite successful API call
            if (result.errorDetails?.code === 'payment_failed_grace_period') {
              // Enter grace period as directed by the API
              const updatedSubscription = await updateSubscriptionStatus(subscription, 'grace_period', {
                gracePeriodEndDate: result.errorDetails.gracePeriodEnd,
                renewalAttempts: result.errorDetails.attemptsCount || 1,
                lastRenewalAttempt: new Date().toISOString()
              });
              
              if (showNotifications) {
                toast.error('Your payment method failed. Your subscription is now in a grace period.', {
                  duration: 10000,
                  action: {
                    label: 'Update Payment',
                    onClick: () => window.location.href = '/subscription'
                  }
                });
              }
              
              return { 
                success: false, 
                error: result.error || 'Payment failed, subscription entered grace period',
                subscription: updatedSubscription || undefined
              };
            } else {
              // Regular payment failure, update attempts count
              const updatedSubscription = await updateSubscriptionStatus(subscription, subscription.status, {
                renewalAttempts: (subscription.renewalAttempts || 0) + 1,
                lastRenewalAttempt: new Date().toISOString()
              });
              
              // Only notify on first attempt
              if (showNotifications && !subscription.renewalAttempts) {
                toast.error('There was an issue processing your renewal. We will try again later.', {
                  duration: 8000,
                  action: {
                    label: 'Update Payment',
                    onClick: () => window.location.href = '/subscription'
                  }
                });
              }
              
              return { 
                success: false, 
                error: result.error || 'Renewal failed with unknown error',
                subscription: updatedSubscription || undefined
              };
            }
          }
        } catch (error) {
          // Catch network errors or other exceptions
          logger.error('Renewal request failed with error', error);
          
          // If we have retries left, try again with exponential backoff
          if (retryCount < MAX_RENEWAL_ATTEMPTS) {
            const backoffDelay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s, ...
            logger.warn(`Renewal attempt ${retryCount + 1} failed due to network error, retrying in ${backoffDelay}ms`);
            
            // Wait for backoff period
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
            
            // Try again with incremented retry count
            return attemptRenewal(retryCount + 1);
          }
          
          // Store the failure locally for retry later
          await chromeStorage.set('failed_renewal_attempt', {
            subscriptionId: subscription.id,
            attemptTime: new Date().toISOString(),
            error: error instanceof Error ? error.message : String(error)
          });
          
          if (showNotifications) {
            toast.error('Network error while processing your renewal. We will retry automatically.', {
              duration: 8000
            });
          }
          
          return { 
            success: false, 
            error: error instanceof Error ? error.message : String(error),
            subscription
          };
        }
      };
      
      // Start the renewal process with retry logic
      return attemptRenewal();
    },
    { 
      errorMessage: 'Failed to process subscription renewal',
      showError: false,
      rethrow: false,
      logMetadata: { operation: 'processRenewal', subscriptionId: subscription.id }
    }
  );
};

/**
 * Check for and process any failed renewals that need to be retried
 */
export const retryFailedRenewals = async (): Promise<void> => {
  return withErrorHandling(
    async () => {
      const failedRenewal = await chromeStorage.get('failed_renewal_attempt');
      if (!failedRenewal) return;
      
      // Check if it's been at least 1 hour since the last failure
      const lastAttempt = new Date(failedRenewal.attemptTime);
      const now = new Date();
      const hoursSinceLastAttempt = (now.getTime() - lastAttempt.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastAttempt < 1) {
        logger.info('Too soon to retry failed renewal', { hoursSinceLastAttempt });
        return;
      }
      
      // Get current subscription data
      const userData = await chromeStorage.get('user');
      if (!userData || !(userData as any).subscription) return;
      
      const subscription = (userData as any).subscription;
      
      // Process the renewal with notification suppressed
      await processRenewal(subscription, { showNotifications: false });
      
      // Clear the failed renewal record
      await chromeStorage.remove('failed_renewal_attempt');
    },
    { 
      errorMessage: 'Failed to retry failed renewal',
      showError: false,
      rethrow: false
    }
  );
};
