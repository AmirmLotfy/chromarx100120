
import { chromeStorage } from '@/services/chromeStorageService';

interface PayPalConfig {
  clientId: string;
  mode: 'sandbox' | 'live';
}

interface PaymentData {
  orderId: string;
  planId: string;
  autoRenew?: boolean;
}

interface SubscriptionData {
  id?: string;
  planId: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  userId: string;
}

interface UsageStatistics {
  apiCalls: number;
  summariesUsed: number;
  storageUsed: number;
  lastReset: string;
}

/**
 * Check if PayPal is configured
 */
export const checkPayPalConfig = async (): Promise<{
  configured: boolean;
  clientId: string;
  mode: string;
}> => {
  try {
    const config = await chromeStorage.get<PayPalConfig>('paypal_config');
    
    if (!config) {
      return {
        configured: false,
        clientId: '',
        mode: 'sandbox'
      };
    }
    
    const hasClientId = config.clientId && config.clientId.length > 10;
    
    return {
      configured: hasClientId,
      clientId: config.clientId || '',
      mode: config.mode || 'sandbox'
    };
  } catch (error) {
    console.error('Error checking PayPal config:', error);
    return {
      configured: false,
      clientId: '',
      mode: 'sandbox'
    };
  }
};

/**
 * Process a payment
 */
export const processPayment = async (paymentData: PaymentData): Promise<{
  success: boolean;
  subscription?: SubscriptionData;
  message?: string;
  error?: string;
}> => {
  try {
    // In local storage mode, we simulate a successful payment
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 1);  // 1 month subscription
    
    const subscriptionData: SubscriptionData = {
      id: `sub_${Date.now()}`,
      planId: paymentData.planId,
      status: 'active',
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: endDate.toISOString(),
      cancelAtPeriodEnd: !paymentData.autoRenew,
      userId: 'local-user',
    };
    
    // Store the subscription
    await chromeStorage.set('subscription', subscriptionData);
    
    // Also log the payment in payment history
    const paymentHistory = await chromeStorage.get<any[]>('payment_history') || [];
    
    paymentHistory.push({
      id: `payment_${Date.now()}`,
      orderId: paymentData.orderId,
      planId: paymentData.planId,
      amount: paymentData.planId === 'premium' ? 9.99 : 4.99,
      status: 'completed',
      provider: 'paypal',
      autoRenew: paymentData.autoRenew ?? true,
      createdAt: now.toISOString(),
    });
    
    await chromeStorage.set('payment_history', paymentHistory);
    
    // Reset usage statistics
    await resetUsageStatistics();
    
    return {
      success: true,
      subscription: subscriptionData,
      message: 'Payment processed successfully'
    };
  } catch (error) {
    console.error('Error processing payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Check subscription status
 */
export const checkSubscription = async (): Promise<{
  subscription: SubscriptionData;
  renewalNeeded: boolean;
  usageLimits: {
    aiRequests: { limit: number; used: number; percentage: number };
    bookmarks: { limit: number; used: number; percentage: number };
    tasks: { limit: number; used: number; percentage: number };
    notes: { limit: number; used: number; percentage: number };
  };
  needsUpgrade: boolean;
}> => {
  try {
    // Get the subscription data
    const subscription = await chromeStorage.get<SubscriptionData>('subscription');
    
    // Default to free plan if no subscription found
    const defaultSubscription: SubscriptionData = {
      planId: 'free',
      status: 'active',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date().toISOString(),
      cancelAtPeriodEnd: false,
      userId: 'local-user'
    };
    
    const sub = subscription || defaultSubscription;
    
    // Check if renewal is needed (within 3 days of expiration)
    let renewalNeeded = false;
    if (sub.status === 'active') {
      const currentPeriodEnd = new Date(sub.currentPeriodEnd);
      const now = new Date();
      const daysUntilExpiration = Math.floor((currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      renewalNeeded = daysUntilExpiration <= 3 && !sub.cancelAtPeriodEnd;
      
      // If subscription is expired, downgrade to free
      if (currentPeriodEnd < now) {
        sub.status = 'expired';
        sub.planId = 'free';
        await chromeStorage.set('subscription', sub);
      }
    }
    
    // Get usage statistics
    const usageStats = await chromeStorage.get<UsageStatistics>('usage_statistics') || {
      apiCalls: 0,
      summariesUsed: 0,
      storageUsed: 0,
      lastReset: new Date().toISOString()
    };
    
    // Get counts from various tables
    const bookmarks = await chromeStorage.get<any[]>('bookmarks') || [];
    const tasks = await chromeStorage.get<any[]>('tasks') || [];
    const notes = await chromeStorage.get<any[]>('notes') || [];
    
    // Define limits based on plan
    const limits = {
      free: { bookmarks: 50, tasks: 30, notes: 30, aiRequests: 10 },
      basic: { bookmarks: 500, tasks: 200, notes: 200, aiRequests: 100 },
      premium: { bookmarks: -1, tasks: -1, notes: -1, aiRequests: -1 }, // -1 means unlimited
    };
    
    const planId = sub.planId || 'free';
    const planLimits = limits[planId as keyof typeof limits] || limits.free;
    
    // Calculate percentages
    const usageLimits = {
      aiRequests: {
        limit: planLimits.aiRequests,
        used: usageStats.apiCalls || 0,
        percentage: planLimits.aiRequests > 0 ? 
          Math.min(100, Math.round((usageStats.apiCalls || 0) / planLimits.aiRequests * 100)) : 0
      },
      bookmarks: {
        limit: planLimits.bookmarks,
        used: bookmarks.length || 0,
        percentage: planLimits.bookmarks > 0 ? 
          Math.min(100, Math.round((bookmarks.length || 0) / planLimits.bookmarks * 100)) : 0
      },
      tasks: {
        limit: planLimits.tasks,
        used: tasks.length || 0,
        percentage: planLimits.tasks > 0 ? 
          Math.min(100, Math.round((tasks.length || 0) / planLimits.tasks * 100)) : 0
      },
      notes: {
        limit: planLimits.notes,
        used: notes.length || 0,
        percentage: planLimits.notes > 0 ? 
          Math.min(100, Math.round((notes.length || 0) / planLimits.notes * 100)) : 0
      }
    };
    
    // Check if user needs to upgrade (if using >80% of any limit)
    const needsUpgrade = planId === 'free' && (
      usageLimits.aiRequests.percentage >= 80 ||
      usageLimits.bookmarks.percentage >= 80 ||
      usageLimits.tasks.percentage >= 80 ||
      usageLimits.notes.percentage >= 80
    );
    
    return {
      subscription: sub,
      renewalNeeded,
      usageLimits,
      needsUpgrade
    };
  } catch (error) {
    console.error('Error checking subscription:', error);
    
    // Return default values on error
    return {
      subscription: {
        planId: 'free',
        status: 'active',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date().toISOString(),
        cancelAtPeriodEnd: false,
        userId: 'local-user'
      },
      renewalNeeded: false,
      usageLimits: {
        aiRequests: { limit: 10, used: 0, percentage: 0 },
        bookmarks: { limit: 50, used: 0, percentage: 0 },
        tasks: { limit: 30, used: 0, percentage: 0 },
        notes: { limit: 30, used: 0, percentage: 0 }
      },
      needsUpgrade: false
    };
  }
};

/**
 * Reset usage statistics
 */
const resetUsageStatistics = async (): Promise<void> => {
  try {
    await chromeStorage.set('usage_statistics', {
      apiCalls: 0,
      summariesUsed: 0,
      storageUsed: 0,
      lastReset: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error resetting usage statistics:', error);
  }
};

/**
 * Increment API call count
 */
export const trackApiCall = async (): Promise<void> => {
  try {
    const stats = await chromeStorage.get<UsageStatistics>('usage_statistics') || {
      apiCalls: 0,
      summariesUsed: 0,
      storageUsed: 0,
      lastReset: new Date().toISOString()
    };
    
    stats.apiCalls = (stats.apiCalls || 0) + 1;
    
    await chromeStorage.set('usage_statistics', stats);
  } catch (error) {
    console.error('Error tracking API call:', error);
  }
};
