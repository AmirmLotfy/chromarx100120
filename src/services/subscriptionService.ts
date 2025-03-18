
import { localStorageClient } from '@/lib/chrome-storage-client';
import { toast } from "sonner";

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  isPopular?: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'expired' | 'canceled';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionResult {
  data: Subscription | null;
  error: Error | null;
}

class SubscriptionServiceClass {
  async getUserSubscription(userId: string): Promise<SubscriptionResult> {
    try {
      const result = await localStorageClient
        .from('subscriptions')
        .select()
        .eq('user_id', userId)
        .execute();

      if (result.error) {
        console.error('Error fetching subscription:', result.error);
        return {
          data: null,
          error: result.error
        };
      }

      // Get the first subscription if there are any
      const subscription = result.data && result.data.length > 0 ? result.data[0] : null;
      
      if (!subscription) {
        return {
          data: null,
          error: null
        };
      }

      // Map the subscription data to our interface
      return {
        data: {
          id: subscription.id || '',
          userId: subscription.user_id || userId,
          planId: subscription.plan_id || 'free',
          status: (subscription.status || 'free') as 'active' | 'expired' | 'canceled',
          currentPeriodStart: new Date(subscription.current_period_start || new Date()),
          currentPeriodEnd: new Date(subscription.current_period_end || new Date()),
          cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
          createdAt: new Date(subscription.created_at || new Date()),
          updatedAt: new Date(subscription.updated_at || new Date())
        },
        error: null
      };
    } catch (error) {
      console.error('Error in getUserSubscription:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  async checkSubscriptionStatus(userId: string): Promise<{
    isActive: boolean;
    plan: string;
    expiresIn?: number;
  }> {
    try {
      const { data: subscription, error } = await this.getUserSubscription(userId);

      if (error) {
        console.error('Error checking subscription status:', error);
        // Default to free plan if there's an error
        return {
          isActive: true,
          plan: 'free'
        };
      }

      // If no subscription found, user is on free plan
      if (!subscription) {
        return {
          isActive: true,
          plan: 'free'
        };
      }

      // Check if subscription is active
      const isActive = subscription.status === 'active';
      
      // Calculate days until expiration if subscription is active
      let expiresIn: number | undefined;
      if (isActive && subscription.currentPeriodEnd) {
        const now = new Date();
        const end = new Date(subscription.currentPeriodEnd);
        const diffTime = Math.abs(end.getTime() - now.getTime());
        expiresIn = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      return {
        isActive,
        plan: subscription.planId,
        expiresIn
      };
    } catch (error) {
      console.error('Error in checkSubscriptionStatus:', error);
      // Default to free plan if there's an error
      return {
        isActive: true,
        plan: 'free'
      };
    }
  }

  async createOrUpdateSubscription(
    userId: string,
    planId: string,
    status: 'active' | 'expired' | 'canceled' = 'active',
    durationMonths: number = 1,
    cancelAtPeriodEnd: boolean = false
  ): Promise<SubscriptionResult> {
    try {
      // Check if subscription already exists
      const { data: existingSubscription } = await this.getUserSubscription(userId);
      
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + durationMonths);
      
      const subscriptionData = {
        user_id: userId,
        plan_id: planId,
        status,
        current_period_start: startDate.toISOString(),
        current_period_end: endDate.toISOString(),
        cancel_at_period_end: cancelAtPeriodEnd,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      let result;
      
      if (existingSubscription) {
        // Update existing subscription
        result = await localStorageClient
          .from('subscriptions')
          .update({
            ...subscriptionData,
            created_at: existingSubscription.createdAt.toISOString()
          })
          .eq('user_id', userId)
          .execute();
      } else {
        // Create new subscription
        result = await localStorageClient
          .from('subscriptions')
          .insert({
            id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            ...subscriptionData
          })
          .execute();
      }
      
      if (result.error) {
        throw result.error;
      }
      
      const newSubscription = result.data && result.data.length > 0 ? result.data[0] : null;
      
      if (!newSubscription) {
        throw new Error('Failed to create or update subscription');
      }
      
      toast.success(`Successfully ${existingSubscription ? 'updated' : 'created'} subscription`);
      
      return {
        data: {
          id: newSubscription.id || '',
          userId: newSubscription.user_id || userId,
          planId: newSubscription.plan_id || planId,
          status: (newSubscription.status || status) as 'active' | 'expired' | 'canceled',
          currentPeriodStart: new Date(newSubscription.current_period_start || startDate),
          currentPeriodEnd: new Date(newSubscription.current_period_end || endDate),
          cancelAtPeriodEnd: Boolean(newSubscription.cancel_at_period_end),
          createdAt: new Date(newSubscription.created_at || new Date()),
          updatedAt: new Date(newSubscription.updated_at || new Date())
        },
        error: null
      };
    } catch (error) {
      console.error('Error creating/updating subscription:', error);
      toast.error('Failed to update subscription');
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  async cancelSubscription(userId: string, immediate: boolean = false): Promise<boolean> {
    try {
      const { data: subscription } = await this.getUserSubscription(userId);
      
      if (!subscription) {
        toast.error('No active subscription found');
        return false;
      }
      
      if (immediate) {
        // Immediately cancel by setting status to canceled
        const result = await localStorageClient
          .from('subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .execute();
          
        if (result.error) throw result.error;
      } else {
        // Cancel at period end
        const result = await localStorageClient
          .from('subscriptions')
          .update({
            cancel_at_period_end: true,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .execute();
          
        if (result.error) throw result.error;
      }
      
      toast.success(immediate 
        ? 'Subscription canceled immediately' 
        : 'Subscription will be canceled at the end of the billing period');
      
      return true;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast.error('Failed to cancel subscription');
      return false;
    }
  }

  async reactivateSubscription(userId: string): Promise<boolean> {
    try {
      const { data: subscription } = await this.getUserSubscription(userId);
      
      if (!subscription) {
        toast.error('No subscription found to reactivate');
        return false;
      }
      
      if (subscription.status === 'active' && !subscription.cancelAtPeriodEnd) {
        toast.info('Subscription is already active');
        return true;
      }
      
      const result = await localStorageClient
        .from('subscriptions')
        .update({
          status: 'active',
          cancel_at_period_end: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .execute();
        
      if (result.error) throw result.error;
      
      toast.success('Subscription reactivated successfully');
      return true;
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      toast.error('Failed to reactivate subscription');
      return false;
    }
  }
}

export const subscriptionService = new SubscriptionServiceClass();
