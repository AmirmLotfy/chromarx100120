
import { chromeStorage } from '@/services/chromeStorageService';

export type SubscriptionEvent = 
  | 'subscription_created' 
  | 'subscription_renewed'
  | 'subscription_upgraded'
  | 'subscription_downgraded'
  | 'subscription_canceled'
  | 'payment_failed'
  | 'payment_succeeded'
  | 'viewed_pricing_page'
  | 'plan_upgraded'
  | 'plan_downgraded';

type EventMetadata = Record<string, any>;

interface SubscriptionEventRecord {
  event: SubscriptionEvent;
  timestamp: string;
  metadata?: EventMetadata;
}

interface SubscriptionAnalytics {
  totalRevenue: number;
  activeSubscriptions: number;
  churnRate: number;
  upgrades: number;
  downgrades: number;
  renewalRate: number;
  averageSubscriptionLength: number;
  lifetimeValue: number;
  lastUpdated: string;
}

/**
 * Track a subscription-related event
 */
export const trackSubscriptionEvent = async (
  event: SubscriptionEvent,
  metadata?: EventMetadata
): Promise<void> => {
  try {
    const events = await chromeStorage.get<SubscriptionEventRecord[]>('subscription_events') || [];
    
    events.push({
      event,
      timestamp: new Date().toISOString(),
      metadata
    });
    
    await chromeStorage.set('subscription_events', events);
  } catch (error) {
    console.error('Error tracking subscription event:', error);
  }
};

/**
 * Calculate subscription analytics based on payment history and events
 */
export const calculateSubscriptionAnalytics = async (): Promise<SubscriptionAnalytics | null> => {
  try {
    // Get payment history
    const paymentHistory = await chromeStorage.get<any[]>('payment_history') || [];
    
    // Get subscription events
    const events = await chromeStorage.get<SubscriptionEventRecord[]>('subscription_events') || [];
    
    // Get current user data
    const userData = await chromeStorage.get('user') || {};
    
    // Calculate total revenue
    const totalRevenue = paymentHistory
      .filter(payment => payment.status === 'completed')
      .reduce((sum, payment) => sum + payment.amount, 0);
    
    // Count active subscriptions (in this case, just check if the current user has an active sub)
    const activeSubscriptions = ((userData as any)?.subscription?.status === 'active') ? 1 : 0;
    
    // Calculate upgrades (from events)
    const upgrades = events.filter(e => 
      e.event === 'subscription_upgraded' || e.event === 'plan_upgraded'
    ).length;
    
    // Calculate downgrades (from events)
    const downgrades = events.filter(e => 
      e.event === 'subscription_downgraded' || e.event === 'plan_downgraded'
    ).length;
    
    // Calculate renewal rate
    const renewalPayments = paymentHistory.filter(p => p.type === 'renewal');
    const successfulRenewals = renewalPayments.filter(p => p.status === 'completed');
    const renewalRate = renewalPayments.length > 0 
      ? successfulRenewals.length / renewalPayments.length 
      : 1; // Default to 100% if no renewals yet
    
    // Calculate churn rate based on canceled events vs total subscriptions
    const cancelEvents = events.filter(e => e.event === 'subscription_canceled');
    const subscriptionCreatedEvents = events.filter(e => e.event === 'subscription_created');
    const churnRate = subscriptionCreatedEvents.length > 0
      ? cancelEvents.length / subscriptionCreatedEvents.length
      : 0;
    
    // Calculate average subscription length (in days)
    // For simplicity, we'll use 30 days if we don't have enough data
    const averageSubscriptionLength = 30; // Simplified
    
    // Calculate lifetime value (LTV)
    const lifetimeValue = totalRevenue / Math.max(1, subscriptionCreatedEvents.length);
    
    const analytics: SubscriptionAnalytics = {
      totalRevenue,
      activeSubscriptions,
      churnRate,
      upgrades,
      downgrades,
      renewalRate,
      averageSubscriptionLength,
      lifetimeValue,
      lastUpdated: new Date().toISOString()
    };
    
    // Store the analytics
    await chromeStorage.set('subscription_analytics', analytics);
    
    return analytics;
  } catch (error) {
    console.error('Error calculating subscription analytics:', error);
    return null;
  }
};

/**
 * Predict churn risk for the current user
 * Returns a value between 0 and 1, where higher values indicate higher risk
 */
export const predictChurnRisk = async (): Promise<number> => {
  try {
    // Get user data
    const userData = await chromeStorage.get('user') || {};
    const subscription = (userData as any)?.subscription;
    
    // Free users have no churn risk
    if (!subscription || subscription.planId === 'free') {
      return 0;
    }
    
    // Get subscription events
    const events = await chromeStorage.get<SubscriptionEventRecord[]>('subscription_events') || [];
    
    // Initialize risk factors
    let riskScore = 0;
    
    // Factor 1: Cancellation at period end
    if (subscription.cancelAtPeriodEnd) {
      riskScore += 0.7; // Major risk factor
    }
    
    // Factor 2: Failed payments
    const failedPayments = events.filter(e => e.event === 'payment_failed');
    if (failedPayments.length > 0) {
      riskScore += Math.min(0.5, failedPayments.length * 0.1); // Up to 0.5 for repeated failures
    }
    
    // Factor 3: Grace period
    if (subscription.status === 'grace_period') {
      riskScore += 0.4;
    }
    
    // Factor 4: Low usage relative to plan limits
    // A user who doesn't use the product much is more likely to churn
    if (subscription.usage) {
      const totalUsage = Object.values(subscription.usage).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
      if (totalUsage < 10) {
        riskScore += 0.2; // Low usage increases churn risk
      }
    }
    
    // Factor 5: Recent plan downgrade
    const recentDowngrades = events
      .filter(e => e.event === 'plan_downgraded')
      .filter(e => {
        const downgradeDate = new Date(e.timestamp);
        const now = new Date();
        const daysSinceDowngrade = Math.floor((now.getTime() - downgradeDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysSinceDowngrade < 30; // Within last 30 days
      });
    
    if (recentDowngrades.length > 0) {
      riskScore += 0.3;
    }
    
    // Ensure the risk score is between 0 and 1
    return Math.min(1, Math.max(0, riskScore));
  } catch (error) {
    console.error('Error predicting churn risk:', error);
    return 0;
  }
};

/**
 * Generate recommendations to reduce churn based on risk factors
 */
export const getChurnReductionRecommendations = async (): Promise<string[]> => {
  try {
    const riskScore = await predictChurnRisk();
    const recommendations: string[] = [];
    
    // Only provide recommendations if there's a meaningful risk
    if (riskScore < 0.1) {
      return [];
    }
    
    // Get user data for more specific recommendations
    const userData = await chromeStorage.get('user') || {};
    const subscription = (userData as any)?.subscription;
    
    if (!subscription) {
      return [];
    }
    
    // Add recommendations based on risk level and factors
    if (riskScore > 0.7) {
      // High risk
      recommendations.push('Offer a one-time discount to retain the subscriber');
      recommendations.push('Reach out directly to understand their concerns');
      recommendations.push('Highlight unused premium features that provide value');
    } else if (riskScore > 0.4) {
      // Medium risk
      recommendations.push('Send an email showcasing premium features');
      recommendations.push('Offer a usage guide to help them get more value');
      recommendations.push('Consider a loyalty bonus or reward');
    }
    
    // Add specific recommendations based on situation
    if (subscription.cancelAtPeriodEnd) {
      recommendations.push('Send reminder of what they\'ll lose after cancellation');
      recommendations.push('Offer an extension to their current period as an incentive to stay');
    }
    
    if (subscription.status === 'grace_period') {
      recommendations.push('Send a reminder about updating payment information');
      recommendations.push('Offer a grace period extension if they update payment method');
    }
    
    // If they're not using the product much
    if (subscription.usage) {
      const totalUsage = Object.values(subscription.usage).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
      if (totalUsage < 10) {
        recommendations.push('Send tutorial emails to increase engagement');
        recommendations.push('Highlight seasonal use cases for the product');
      }
    }
    
    return recommendations;
  } catch (error) {
    console.error('Error generating churn reduction recommendations:', error);
    return [];
  }
};
