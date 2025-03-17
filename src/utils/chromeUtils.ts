
import { toast } from "sonner";
import { configurationService } from "@/services/configurationService";
import { chromeStorage } from "@/services/chromeStorageService";

// Subscription types
export interface SubscriptionStatus {
  subscription: {
    plan_id: string;
    status: string;
    current_period_end?: string;
    current_period_start?: string;
    cancel_at_period_end?: boolean;
  };
  renewalNeeded: boolean;
  usageLimits: {
    aiRequests: UsageLimit;
    bookmarks: UsageLimit;
    tasks: UsageLimit;
    notes: UsageLimit;
  };
  needsUpgrade: boolean;
}

interface UsageLimit {
  limit: number;
  used: number;
  percentage: number;
}

interface PayPalConfig {
  clientId: string;
  mode: 'sandbox' | 'live';
}

interface PaymentRecord {
  id?: string;
  order_id: string;
  plan_id: string;
  amount: number;
  status: string;
  provider: string;
  auto_renew: boolean;
  user_id: string;
}

interface SubscriptionRecord {
  id?: string;
  plan_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  user_id: string;
}

interface UsageStats {
  api_calls: number;
}

// Get PayPal configuration
export const checkPayPalConfiguration = async () => {
  const config = await configurationService.getPayPalConfig() as PayPalConfig;
  return {
    clientId: config.clientId,
    mode: config.mode,
    configured: true
  };
};

export const getPayPalClientId = async (): Promise<string> => {
  const config = await configurationService.getPayPalConfig() as PayPalConfig;
  return config.clientId;
};

export const getPayPalMode = async (): Promise<'sandbox' | 'live'> => {
  const config = await configurationService.getPayPalConfig() as PayPalConfig;
  return config.mode;
};

// Payment verification
export const verifyPayPalPayment = async (
  orderId: string, 
  planId: string, 
  autoRenew: boolean = true
): Promise<boolean> => {
  try {
    console.log('Verifying payment:', { orderId, planId, autoRenew });
    
    // Get PayPal configuration
    const config = await configurationService.getPayPalConfig() as PayPalConfig;
    
    // In a real implementation, you would verify the payment with PayPal's API here
    // For now, we'll simulate a successful verification
    
    // Store the payment in our local database
    await chromeStorage.db.insert<PaymentRecord>('payment_history', {
      order_id: orderId,
      plan_id: planId,
      amount: planId === 'premium' ? 9.99 : 4.99,
      status: 'completed',
      provider: 'paypal',
      auto_renew: autoRenew,
      user_id: 'current-user' // In a real implementation, get the actual user ID
    });
    
    // Update subscription status
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // One month subscription
    
    await chromeStorage.db.insert<SubscriptionRecord>('subscriptions', {
      plan_id: planId,
      status: 'active',
      current_period_start: startDate.toISOString(),
      current_period_end: endDate.toISOString(),
      cancel_at_period_end: !autoRenew,
      user_id: 'current-user' // In a real implementation, get the actual user ID
    });
    
    toast.success('Payment verified successfully');
    return true;
  } catch (error) {
    console.error('Error verifying payment:', error);
    toast.error('Failed to verify payment');
    return false;
  }
};

// Check subscription status
export const checkSubscriptionStatus = async (userId: string): Promise<SubscriptionStatus | null> => {
  try {
    // Get subscription from storage
    const subscriptions = await chromeStorage.db.query('subscriptions', 
      (sub: any) => sub.user_id === userId && sub.status === 'active'
    );
    
    const subscription = subscriptions[0] || {
      plan_id: 'free',
      status: 'active',
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      current_period_start: new Date().toISOString(),
      cancel_at_period_end: false
    };
    
    // Define limits based on plan
    const limits = {
      free: { bookmarks: 50, tasks: 30, notes: 30, aiRequests: 10 },
      basic: { bookmarks: 500, tasks: 200, notes: 200, aiRequests: 100 },
      premium: { bookmarks: -1, tasks: -1, notes: -1, aiRequests: -1 }, // -1 means unlimited
    };
    
    const planId = subscription.plan_id || 'free';
    const planLimits = limits[planId as keyof typeof limits] || limits.free;
    
    // Get usage statistics
    const bookmarkCount = await getBookmarkCount(userId);
    const taskCount = await getTaskCount(userId);
    const noteCount = await getNoteCount(userId);
    const apiCalls = await getApiCallCount(userId);
    
    // Calculate percentages
    const usageLimits = {
      aiRequests: {
        limit: planLimits.aiRequests,
        used: apiCalls,
        percentage: planLimits.aiRequests > 0 ? 
          Math.min(100, Math.round(apiCalls / planLimits.aiRequests * 100)) : 0
      },
      bookmarks: {
        limit: planLimits.bookmarks,
        used: bookmarkCount,
        percentage: planLimits.bookmarks > 0 ? 
          Math.min(100, Math.round(bookmarkCount / planLimits.bookmarks * 100)) : 0
      },
      tasks: {
        limit: planLimits.tasks,
        used: taskCount,
        percentage: planLimits.tasks > 0 ? 
          Math.min(100, Math.round(taskCount / planLimits.tasks * 100)) : 0
      },
      notes: {
        limit: planLimits.notes,
        used: noteCount,
        percentage: planLimits.notes > 0 ? 
          Math.min(100, Math.round(noteCount / planLimits.notes * 100)) : 0
      }
    };
    
    // Check if user needs to upgrade
    const needsUpgrade = planId === 'free' && (
      usageLimits.aiRequests.percentage >= 80 ||
      usageLimits.bookmarks.percentage >= 80 ||
      usageLimits.tasks.percentage >= 80 ||
      usageLimits.notes.percentage >= 80
    );
    
    // Check if subscription needs renewal
    let renewalNeeded = false;
    if (subscription.status === 'active' && subscription.current_period_end) {
      const currentPeriodEnd = new Date(subscription.current_period_end);
      const now = new Date();
      const daysUntilExpiration = Math.floor((currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      renewalNeeded = daysUntilExpiration <= 3 && !subscription.cancel_at_period_end;
    }
    
    return {
      subscription,
      renewalNeeded,
      usageLimits,
      needsUpgrade
    };
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return null;
  }
};

// Helper functions for getting counts
async function getBookmarkCount(userId: string): Promise<number> {
  try {
    const bookmarks = await chromeStorage.db.query('bookmark_metadata', 
      (bookmark: any) => bookmark.user_id === userId
    );
    return bookmarks.length;
  } catch (error) {
    console.error('Error getting bookmark count:', error);
    return 0;
  }
}

async function getTaskCount(userId: string): Promise<number> {
  try {
    const tasks = await chromeStorage.db.query('tasks', 
      (task: any) => task.user_id === userId
    );
    return tasks.length;
  } catch (error) {
    console.error('Error getting task count:', error);
    return 0;
  }
}

async function getNoteCount(userId: string): Promise<number> {
  try {
    const notes = await chromeStorage.db.query('notes', 
      (note: any) => note.user_id === userId
    );
    return notes.length;
  } catch (error) {
    console.error('Error getting note count:', error);
    return 0;
  }
}

async function getApiCallCount(userId: string): Promise<number> {
  try {
    const stats = await chromeStorage.get<UsageStats>(`usage_stats_${userId}`);
    return stats?.api_calls || 0;
  } catch (error) {
    console.error('Error getting API call count:', error);
    return 0;
  }
}

// Show upgrade notification if needed
export const checkAndShowUpgradeNotification = async (userId: string): Promise<void> => {
  try {
    const status = await checkSubscriptionStatus(userId);
    
    if (status?.needsUpgrade) {
      toast.info("You're approaching your usage limits. Consider upgrading for more features!", {
        duration: 8000,
        action: {
          label: 'Upgrade',
          onClick: () => window.location.href = '/subscription'
        }
      });
    }
  } catch (error) {
    console.error('Error showing upgrade notification:', error);
  }
};

// PayPal order creation
export const createPayPalOrder = async (planId: string, amount: number): Promise<any> => {
  try {
    console.log('Creating order:', { planId, amount });
    
    // In a real implementation, you would create an order with PayPal's API
    // For now, we'll simulate creating an order
    return {
      id: `TEST-${Date.now()}`,
      status: "CREATED",
      amount: amount
    };
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

// PayPal order capture
export const capturePayPalOrder = async (orderId: string): Promise<any> => {
  try {
    console.log('Capturing order:', orderId);
    
    // In a real implementation, you would capture the order with PayPal's API
    // For now, we'll simulate capturing an order
    return {
      id: orderId,
      status: "COMPLETED",
      payer: {
        email_address: "test@example.com"
      }
    };
  } catch (error) {
    console.error('Error capturing order:', error);
    throw error;
  }
};
