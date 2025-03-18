
import { localStorageClient } from '@/lib/chrome-storage-client';
import { toast } from "sonner";

export interface SubscriptionInfo {
  plan_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  user_id: string;
}

export interface SubscriptionResult {
  subscription: SubscriptionInfo;
  renewalNeeded: boolean;
  usageLimits: {
    aiRequests: { limit: number; used: number; percentage: number };
    bookmarks: { limit: number; used: number; percentage: number };
    tasks: { limit: number; used: number; percentage: number };
    notes: { limit: number; used: number; percentage: number };
  };
  needsUpgrade: boolean;
}

export const SubscriptionService = {
  // Check subscription status
  async checkSubscription(userId: string): Promise<SubscriptionResult> {
    try {
      // Get user's subscription
      const result = await localStorageClient
        .from('subscriptions')
        .select()
        .eq('user_id', userId)
        .execute();

      if (result.error) throw result.error;
      
      // In the localStorageClient, we need to find an item manually instead of using maybeSingle
      const subscription = Array.isArray(result.data) && result.data.length > 0 
        ? result.data[0] as SubscriptionInfo
        : {
            plan_id: 'free',
            status: 'active',
            user_id: userId,
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            cancel_at_period_end: false
          };

      let renewalNeeded = false;

      // Check if subscription needs renewal
      if (subscription && subscription.status === 'active') {
        const currentPeriodEnd = new Date(subscription.current_period_end);
        const now = new Date();
        const daysUntilExpiration = Math.floor((currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        renewalNeeded = daysUntilExpiration <= 3 && !subscription.cancel_at_period_end;
        
        // If subscription is expired, downgrade to free
        if (currentPeriodEnd < now) {
          await localStorageClient
            .from('subscriptions')
            .update({ 
              status: 'expired', 
              plan_id: 'free' 
            })
            .eq('id', subscription.user_id)
            .execute();
            
          subscription.status = 'expired';
          subscription.plan_id = 'free';
        }
      }

      // Get usage statistics
      const usageResult = await localStorageClient
        .from('usage_statistics')
        .select()
        .eq('user_id', userId)
        .execute();

      const usageStats = Array.isArray(usageResult.data) && usageResult.data.length > 0 
        ? usageResult.data[0] 
        : { api_calls: 0 };

      // Get counts from various tables using custom counting logic since we don't have count method
      const bookmarkResult = await localStorageClient
        .from('bookmark_metadata')
        .select()
        .eq('user_id', userId)
        .execute();

      const taskResult = await localStorageClient
        .from('tasks')
        .select()
        .eq('user_id', userId)
        .execute();

      const noteResult = await localStorageClient
        .from('notes')
        .select()
        .eq('user_id', userId)
        .execute();

      const bookmarkCount = Array.isArray(bookmarkResult.data) ? bookmarkResult.data.length : 0;
      const taskCount = Array.isArray(taskResult.data) ? taskResult.data.length : 0;
      const noteCount = Array.isArray(noteResult.data) ? noteResult.data.length : 0;

      // Define limits based on plan
      const limits = {
        free: { bookmarks: 50, tasks: 30, notes: 30, aiRequests: 10 },
        basic: { bookmarks: 500, tasks: 200, notes: 200, aiRequests: 100 },
        premium: { bookmarks: -1, tasks: -1, notes: -1, aiRequests: -1 }, // -1 means unlimited
      };

      const planId = subscription.plan_id || 'free';
      const planLimits = limits[planId as keyof typeof limits] || limits.free;

      // Calculate percentages
      const usageLimits = {
        aiRequests: {
          limit: planLimits.aiRequests,
          used: usageStats.api_calls || 0,
          percentage: planLimits.aiRequests > 0 ? 
            Math.min(100, Math.round((usageStats.api_calls || 0) / planLimits.aiRequests * 100)) : 0
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

      // Check if user needs to upgrade (if using >80% of any limit)
      const needsUpgrade = planId === 'free' && (
        usageLimits.aiRequests.percentage >= 80 ||
        usageLimits.bookmarks.percentage >= 80 ||
        usageLimits.tasks.percentage >= 80 ||
        usageLimits.notes.percentage >= 80
      );

      return {
        subscription,
        renewalNeeded,
        usageLimits,
        needsUpgrade
      };
    } catch (error) {
      console.error('Error checking subscription:', error);
      toast.error('Failed to check subscription status');
      throw error;
    }
  },

  // Process payment
  async processPayment(orderId: string, planId: string, autoRenew: boolean = true): Promise<{ success: boolean, subscription?: SubscriptionInfo }> {
    try {
      const userId = 'local-user'; // In a real app, get this from authentication
      
      // Get plan information
      const subscriptionPlans = {
        basic: { 
          monthly: 4.99, 
          yearly: 49.99,
          durationMonths: 1
        },
        premium: { 
          monthly: 9.99, 
          yearly: 99.99,
          durationMonths: 1
        }
      };
      
      const plan = subscriptionPlans[planId as keyof typeof subscriptionPlans];
      if (!plan) {
        throw new Error('Invalid plan ID');
      }

      // Calculate end date based on plan duration
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + plan.durationMonths);

      // Update the subscription record
      const subscriptionData = {
        plan_id: planId,
        status: 'active',
        current_period_start: startDate.toISOString(),
        current_period_end: endDate.toISOString(),
        cancel_at_period_end: !autoRenew,
        user_id: userId,
      };

      // Check if subscription already exists for this user
      const existingResult = await localStorageClient
        .from('subscriptions')
        .select()
        .eq('user_id', userId)
        .execute();

      const existingSubscription = Array.isArray(existingResult.data) && existingResult.data.length > 0 
        ? existingResult.data[0] 
        : null;

      // Either update or insert the subscription record
      let subscriptionResult;
      if (existingSubscription) {
        subscriptionResult = await localStorageClient
          .from('subscriptions')
          .update(subscriptionData)
          .eq('id', existingSubscription.id)
          .execute();
        
        if (subscriptionResult.error) throw subscriptionResult.error;
        
        // We don't have .single() in local client, so construct the data ourselves
        subscriptionResult.data = subscriptionResult.data && Array.isArray(subscriptionResult.data) && subscriptionResult.data.length > 0 
          ? subscriptionResult.data[0] 
          : subscriptionData;
      } else {
        subscriptionResult = await localStorageClient
          .from('subscriptions')
          .insert(subscriptionData)
          .execute();
          
        if (subscriptionResult.error) throw subscriptionResult.error;
        
        // We don't have .single() in local client, so construct the data ourselves
        subscriptionResult.data = subscriptionData;
      }

      // Log the transaction
      await localStorageClient
        .from('payment_history')
        .insert({
          user_id: userId,
          order_id: orderId,
          plan_id: planId,
          amount: plan.monthly, // Assuming monthly plan for simplicity
          status: 'completed',
          provider: 'paypal',
          auto_renew: autoRenew,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .execute();

      // Reset usage statistics
      const statsResult = await localStorageClient
        .from('usage_statistics')
        .select()
        .eq('user_id', userId)
        .execute();
      
      const existingStats = Array.isArray(statsResult.data) && statsResult.data.length > 0 
        ? statsResult.data[0] 
        : null;
      
      if (existingStats) {
        await localStorageClient
          .from('usage_statistics')
          .update({
            last_reset: new Date().toISOString(),
            summaries_used: 0,
            api_calls: 0,
          })
          .eq('id', existingStats.id)
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

      toast.success('Payment processed successfully');
      return { 
        success: true, 
        subscription: subscriptionResult.data
      };
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Failed to process payment');
      return { success: false };
    }
  },

  // Get PayPal configuration (simplified local version)
  async getPayPalConfig(): Promise<{ configured: boolean, clientId: string, mode: string }> {
    try {
      const configResult = await localStorageClient
        .from('app_configuration')
        .select()
        .eq('key', 'paypal')
        .execute();

      if (configResult.error) throw configResult.error;

      let configured = false;
      let clientId = '';
      let mode = 'sandbox';

      if (configResult.data && Array.isArray(configResult.data) && configResult.data.length > 0) {
        // Data exists, check if it has required fields
        const config = configResult.data[0].value;
        const hasClientId = config.client_id && config.client_id.length > 10;
        const hasClientSecret = config.client_secret && config.client_secret.length > 10;
        
        configured = hasClientId && hasClientSecret;
        clientId = config.client_id || '';
        mode = config.mode || 'sandbox';
      }

      return {
        configured,
        clientId,
        mode
      };
    } catch (error) {
      console.error('Error checking PayPal configuration:', error);
      toast.error('Failed to check PayPal configuration');
      return {
        configured: false,
        clientId: '',
        mode: 'sandbox'
      };
    }
  }
};
