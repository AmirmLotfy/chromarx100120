
import { localStorageClient } from '@/lib/chrome-storage-client';
import { toast } from "sonner";

export interface UserSubscription {
  id: string;
  userId: string | null;
  planId: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

export interface UsageLimits {
  aiRequests: { limit: number; used: number; percentage: number };
  bookmarks: { limit: number; used: number; percentage: number };
  tasks: { limit: number; used: number; percentage: number };
  notes: { limit: number; used: number; percentage: number };
}

export interface SubscriptionStatus {
  subscription: {
    planId: string;
    status: string;
  };
  renewalNeeded: boolean;
  usageLimits: UsageLimits;
  needsUpgrade: boolean;
}

interface UsageStatistics {
  id: string;
  user_id: string;
  api_calls: number;
  summaries_used: number;
  storage_used: number;
  last_reset: string;
}

export const subscriptionService = {
  async getSubscriptionStatus(userId: string = 'local-user'): Promise<SubscriptionStatus> {
    try {
      // Get the user's subscription
      const result = await localStorageClient
        .from('subscriptions')
        .select()
        .eq('user_id', userId)
        .execute();

      const subscriptions = result.data as any[];
      const subscription = subscriptions && subscriptions.length > 0 ? subscriptions[0] : null;

      let response: SubscriptionStatus = {
        subscription: subscription || { planId: 'free', status: 'active' },
        renewalNeeded: false,
        usageLimits: {
          aiRequests: { limit: 10, used: 0, percentage: 0 },
          bookmarks: { limit: 50, used: 0, percentage: 0 },
          tasks: { limit: 30, used: 0, percentage: 0 },
          notes: { limit: 30, used: 0, percentage: 0 }
        },
        needsUpgrade: false
      };

      // Check if subscription needs renewal
      if (subscription && subscription.status === 'active') {
        const currentPeriodEnd = new Date(subscription.current_period_end);
        const now = new Date();
        const daysUntilExpiration = Math.floor((currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        response.renewalNeeded = daysUntilExpiration <= 3 && !subscription.cancel_at_period_end;
        
        // If subscription is expired, downgrade to free
        if (currentPeriodEnd < now) {
          await localStorageClient
            .from('subscriptions')
            .update({ 
              status: 'expired', 
              plan_id: 'free' 
            })
            .eq('id', subscription.id)
            .execute();
            
          response.subscription.status = 'expired';
          response.subscription.planId = 'free';
        }
      }

      // Get usage statistics
      const usageStatsResult = await localStorageClient
        .from('usage_statistics')
        .select()
        .eq('user_id', userId)
        .execute();

      const usageStats = usageStatsResult.data && usageStatsResult.data.length > 0 
        ? usageStatsResult.data[0] as UsageStatistics 
        : null;

      // Get counts from various tables
      const bookmarkCountResult = await localStorageClient
        .from('bookmark_metadata')
        .select()
        .eq('user_id', userId)
        .execute();
      const bookmarkCount = bookmarkCountResult.data?.length || 0;

      const taskCountResult = await localStorageClient
        .from('tasks')
        .select()
        .eq('user_id', userId)
        .execute();
      const taskCount = taskCountResult.data?.length || 0;

      const noteCountResult = await localStorageClient
        .from('notes')
        .select()
        .eq('user_id', userId)
        .execute();
      const noteCount = noteCountResult.data?.length || 0;

      // Define limits based on plan
      const limits = {
        free: { bookmarks: 50, tasks: 30, notes: 30, aiRequests: 10 },
        basic: { bookmarks: 500, tasks: 200, notes: 200, aiRequests: 100 },
        premium: { bookmarks: -1, tasks: -1, notes: -1, aiRequests: -1 }, // -1 means unlimited
      };

      const planId = response.subscription.planId || 'free';
      const planLimits: any = limits[planId as keyof typeof limits] || limits.free;

      // Calculate percentages
      response.usageLimits = {
        aiRequests: {
          limit: planLimits.aiRequests,
          used: usageStats?.api_calls || 0,
          percentage: planLimits.aiRequests > 0 ? 
            Math.min(100, Math.round((usageStats?.api_calls || 0) / planLimits.aiRequests * 100)) : 0
        },
        bookmarks: {
          limit: planLimits.bookmarks,
          used: bookmarkCount || 0,
          percentage: planLimits.bookmarks > 0 ? 
            Math.min(100, Math.round((bookmarkCount || 0) / planLimits.bookmarks * 100)) : 0
        },
        tasks: {
          limit: planLimits.tasks,
          used: taskCount || 0,
          percentage: planLimits.tasks > 0 ? 
            Math.min(100, Math.round((taskCount || 0) / planLimits.tasks * 100)) : 0
        },
        notes: {
          limit: planLimits.notes,
          used: noteCount || 0,
          percentage: planLimits.notes > 0 ? 
            Math.min(100, Math.round((noteCount || 0) / planLimits.notes * 100)) : 0
        }
      };

      // Check if user needs to upgrade (if using >80% of any limit)
      response.needsUpgrade = planId === 'free' && (
        response.usageLimits.aiRequests.percentage >= 80 ||
        response.usageLimits.bookmarks.percentage >= 80 ||
        response.usageLimits.tasks.percentage >= 80 ||
        response.usageLimits.notes.percentage >= 80
      );

      return response;
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      // Return default values in case of error
      return {
        subscription: { planId: 'free', status: 'active' },
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
  },

  async upgradeSubscription(planId: string, orderId: string): Promise<boolean> {
    try {
      const userId = 'local-user'; // For local storage approach
      
      // Calculate plan duration
      const startDate = new Date();
      const endDate = new Date(startDate);
      
      // Set duration based on plan type
      if (planId.includes('yearly')) {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      // Check if subscription already exists
      const subscriptionResult = await localStorageClient
        .from('subscriptions')
        .select()
        .eq('user_id', userId)
        .execute();

      const subscriptions = subscriptionResult.data as any[];
      const existingSubscription = subscriptions && subscriptions.length > 0 ? subscriptions[0] : null;

      const subscriptionData = {
        plan_id: planId,
        status: 'active',
        current_period_start: startDate.toISOString(),
        current_period_end: endDate.toISOString(),
        cancel_at_period_end: false,
        user_id: userId,
      };

      // Either update or insert the subscription record
      if (existingSubscription) {
        await localStorageClient
          .from('subscriptions')
          .update(subscriptionData)
          .eq('id', existingSubscription.id)
          .execute();
      } else {
        await localStorageClient
          .from('subscriptions')
          .insert(subscriptionData)
          .execute();
      }

      // Log the transaction
      await localStorageClient
        .from('payment_history')
        .insert({
          user_id: userId,
          order_id: orderId,
          plan_id: planId,
          amount: planId.includes('premium') ? 
            (planId.includes('yearly') ? 99.99 : 9.99) : 
            (planId.includes('yearly') ? 49.99 : 4.99),
          status: 'completed',
          provider: 'paypal',
          auto_renew: true,
          created_at: new Date().toISOString()
        })
        .execute();

      // Reset usage statistics
      const usageStatsResult = await localStorageClient
        .from('usage_statistics')
        .select()
        .eq('user_id', userId)
        .execute();

      const usageStats = usageStatsResult.data && usageStatsResult.data.length > 0 
        ? usageStatsResult.data[0] 
        : null;
      
      if (usageStats) {
        await localStorageClient
          .from('usage_statistics')
          .update({
            last_reset: new Date().toISOString(),
            summaries_used: 0,
            api_calls: 0,
          })
          .eq('id', usageStats.id)
          .execute();
      } else {
        await localStorageClient
          .from('usage_statistics')
          .insert({
            user_id: userId,
            last_reset: new Date().toISOString(),
            summaries_used: 0,
            api_calls: 0,
            storage_used: 0
          })
          .execute();
      }

      return true;
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      return false;
    }
  },

  async cancelSubscription(renewAtEnd: boolean = false): Promise<boolean> {
    try {
      const userId = 'local-user'; // For local storage approach

      // Get current subscription
      const subscriptionResult = await localStorageClient
        .from('subscriptions')
        .select()
        .eq('user_id', userId)
        .execute();

      const subscriptions = subscriptionResult.data as any[];
      const existingSubscription = subscriptions && subscriptions.length > 0 ? subscriptions[0] : null;

      if (!existingSubscription) {
        return false;
      }

      if (renewAtEnd) {
        // Just mark to cancel at period end
        await localStorageClient
          .from('subscriptions')
          .update({ cancel_at_period_end: true })
          .eq('id', existingSubscription.id)
          .execute();
      } else {
        // Cancel immediately
        await localStorageClient
          .from('subscriptions')
          .update({ 
            status: 'cancelled',
            plan_id: 'free',
            cancel_at_period_end: true 
          })
          .eq('id', existingSubscription.id)
          .execute();
      }

      return true;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return false;
    }
  },

  async getPaymentHistory(userId: string = 'local-user'): Promise<any[]> {
    try {
      const result = await localStorageClient
        .from('payment_history')
        .select()
        .eq('user_id', userId)
        .execute();

      return result.data as any[] || [];
    } catch (error) {
      console.error('Error fetching payment history:', error);
      return [];
    }
  },

  async getPayPalConfig(): Promise<{configured: boolean, clientId: string, mode: string}> {
    try {
      const result = await localStorageClient
        .from('app_configuration')
        .select()
        .eq('key', 'paypal')
        .execute();

      const configs = result.data as any[];
      const configData = configs && configs.length > 0 ? configs[0] : null;

      let configured = false;
      let clientId = '';
      let mode = 'sandbox';

      if (configData && configData.value) {
        const config = configData.value;
        const hasClientId = config.client_id && config.client_id.length > 10;
        const hasClientSecret = config.client_secret && config.client_secret.length > 10;
        
        configured = hasClientId && hasClientSecret;
        clientId = config.client_id || '';
        mode = config.mode || 'sandbox';
      }

      return { configured, clientId, mode };
    } catch (error) {
      console.error('Error fetching PayPal config:', error);
      return { configured: false, clientId: '', mode: 'sandbox' };
    }
  }
};
