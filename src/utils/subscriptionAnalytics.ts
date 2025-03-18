import { chromeStorage } from "@/services/chromeStorageService";
import { createNamespacedLogger } from "@/utils/loggerUtils";
import { toast } from "sonner";
import { PaymentHistory } from "@/types/payment";
import { UserSubscription } from "@/config/subscriptionPlans";

// Set up a namespaced logger for analytics functions
const logger = createNamespacedLogger("subscriptionAnalytics");

// Analytics tracking object to store various subscription metrics
interface SubscriptionAnalytics {
  conversionRate: number;
  churnRate: number;
  renewalRate: number;
  averageSubscriptionLength: number; // in days
  upgrades: number;
  downgrades: number;
  cancelledSubscriptions: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  totalRevenue: number;
  lastUpdated: string;
}

// User events that we track for analytics
export type SubscriptionEvent = 
  | 'subscription_created'
  | 'subscription_renewed'
  | 'subscription_cancelled'
  | 'subscription_expired'
  | 'plan_upgraded'
  | 'plan_downgraded'
  | 'payment_failed'
  | 'trial_started'
  | 'trial_converted'
  | 'viewed_pricing_page'
  | 'changed_billing_cycle'
  | 'viewed_recommendations';

/**
 * Track a subscription-related event
 */
export const trackSubscriptionEvent = async (
  event: SubscriptionEvent,
  metadata: Record<string, any> = {}
): Promise<void> => {
  try {
    // Get existing events or initialize
    const events = await chromeStorage.get<any[]>('subscription_events') || [];
    
    // Add new event
    events.push({
      event,
      timestamp: new Date().toISOString(),
      metadata
    });
    
    // Store updated events
    await chromeStorage.set('subscription_events', events);
    
    // Calculate and update analytics immediately if we have enough data
    if (events.length > 5) {
      await calculateSubscriptionAnalytics();
    }
    
    logger.info(`Tracked subscription event: ${event}`, metadata);
  } catch (error) {
    logger.error('Error tracking subscription event:', error);
  }
};

/**
 * Calculate analytics based on payment history and subscription events
 */
export const calculateSubscriptionAnalytics = async (): Promise<SubscriptionAnalytics | null> => {
  try {
    // Get necessary data
    const paymentHistory = await chromeStorage.get<PaymentHistory[]>('payment_history') || [];
    const events = await chromeStorage.get<any[]>('subscription_events') || [];
    const userData = await chromeStorage.get('user') || {};
    const currentSubscription = (userData as any)?.subscription as UserSubscription | undefined;
    
    // Initialize analytics object
    const analytics: SubscriptionAnalytics = {
      conversionRate: 0,
      churnRate: 0,
      renewalRate: 0,
      averageSubscriptionLength: 0,
      upgrades: 0,
      downgrades: 0,
      cancelledSubscriptions: 0,
      activeSubscriptions: 0,
      expiredSubscriptions: 0,
      totalRevenue: 0,
      lastUpdated: new Date().toISOString()
    };
    
    if (paymentHistory.length === 0) {
      return analytics;
    }
    
    // Calculate total revenue
    analytics.totalRevenue = paymentHistory.reduce((sum, payment) => {
      if (payment.status === 'completed') {
        return sum + payment.amount;
      }
      return sum;
    }, 0);
    
    // Count subscription events
    events.forEach(event => {
      if (event.event === 'plan_upgraded') analytics.upgrades++;
      if (event.event === 'plan_downgraded') analytics.downgrades++;
      if (event.event === 'subscription_cancelled') analytics.cancelledSubscriptions++;
    });
    
    // Add current subscription status
    if (currentSubscription) {
      if (currentSubscription.status === 'active' || currentSubscription.status === 'grace_period') {
        analytics.activeSubscriptions = 1;
      } else if (currentSubscription.status === 'expired' || currentSubscription.status === 'canceled') {
        analytics.expiredSubscriptions = 1;
      }
    }
    
    // Calculate renewal rate (completed renewals / total renewal attempts)
    const renewalAttempts = paymentHistory.filter(p => p.type === 'renewal').length;
    const successfulRenewals = paymentHistory.filter(p => p.type === 'renewal' && p.status === 'completed').length;
    analytics.renewalRate = renewalAttempts > 0 ? (successfulRenewals / renewalAttempts) : 0;
    
    // Calculate average subscription length
    if (currentSubscription) {
      const startDate = new Date(currentSubscription.createdAt);
      const endDate = currentSubscription.status === 'active' ? new Date() : new Date(currentSubscription.currentPeriodEnd);
      const lengthInDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      analytics.averageSubscriptionLength = lengthInDays;
    }
    
    // Calculate conversion rate (for trials, if implemented)
    const trialStarts = events.filter(e => e.event === 'trial_started').length;
    const trialConversions = events.filter(e => e.event === 'trial_converted').length;
    analytics.conversionRate = trialStarts > 0 ? (trialConversions / trialStarts) : 0;
    
    // Calculate churn rate (cancelled / total subscriptions)
    const totalSubscriptions = analytics.activeSubscriptions + analytics.expiredSubscriptions + analytics.cancelledSubscriptions;
    analytics.churnRate = totalSubscriptions > 0 ? (analytics.cancelledSubscriptions / totalSubscriptions) : 0;
    
    // Save analytics
    await chromeStorage.set('subscription_analytics', analytics);
    
    logger.info('Subscription analytics calculated', { analytics });
    return analytics;
  } catch (error) {
    logger.error('Error calculating subscription analytics:', error);
    return null;
  }
};

/**
 * Predict churn based on user behavior and subscription history
 * Returns a churn risk score between 0-1 (higher = higher risk)
 */
export const predictChurnRisk = async (userId?: string): Promise<number> => {
  try {
    const userData = await chromeStorage.get('user') || {};
    const currentSubscription = (userData as any)?.subscription as UserSubscription | undefined;
    const events = await chromeStorage.get<any[]>('subscription_events') || [];
    
    if (!currentSubscription || currentSubscription.planId === 'free') {
      return 0; // No churn risk for free users
    }
    
    // Risk factors with weights (simplified model)
    let riskScore = 0;
    const riskFactors: Record<string, number> = {
      cancelAtPeriodEnd: 0.8,  // Very high risk if cancel is scheduled
      inGracePeriod: 0.7,      // High risk if in grace period due to payment issues
      recentPricePageVisit: 0.3, // Medium risk if recently viewed pricing page
      recentPaymentFailure: 0.5, // High risk if payment recently failed
      lowUsage: 0.4,           // Medium-high risk if usage is low
      highBilling: 0.3        // Medium risk if on expensive plan with low usage
    };
    
    // Check cancel at period end
    if (currentSubscription.cancelAtPeriodEnd) {
      riskScore += riskFactors.cancelAtPeriodEnd;
    }
    
    // Check grace period
    if (currentSubscription.status === 'grace_period') {
      riskScore += riskFactors.inGracePeriod;
    }
    
    // Check recent pricing page views (last 7 days)
    const recentPricingPageViews = events.filter(e => {
      const eventDate = new Date(e.timestamp);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24));
      return e.event === 'viewed_pricing_page' && daysDiff < 7;
    }).length;
    
    if (recentPricingPageViews > 0) {
      riskScore += riskFactors.recentPricePageVisit;
    }
    
    // Check for recent payment failures
    const recentPaymentFailures = events.filter(e => {
      const eventDate = new Date(e.timestamp);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24));
      return e.event === 'payment_failed' && daysDiff < 14;
    }).length;
    
    if (recentPaymentFailures > 0) {
      riskScore += riskFactors.recentPaymentFailure;
    }
    
    // Check usage levels (simplified)
    if (currentSubscription.usage) {
      const totalUsage = Object.values(currentSubscription.usage).reduce((sum, val) => sum + val, 0);
      // Consider low usage if using less than 20% of available features
      if (totalUsage < 20) {
        riskScore += riskFactors.lowUsage;
      }
    }
    
    // Check billing vs. usage
    if (currentSubscription.planId === 'pro' && currentSubscription.billingCycle === 'yearly') {
      // High billing with low usage increases churn risk
      if (currentSubscription.usage && Object.values(currentSubscription.usage).reduce((sum, val) => sum + val, 0) < 30) {
        riskScore += riskFactors.highBilling;
      }
    }
    
    // Cap the risk score at 1
    riskScore = Math.min(1, riskScore);
    
    logger.info(`Churn risk calculated: ${riskScore}`, { userId });
    return riskScore;
  } catch (error) {
    logger.error('Error predicting churn risk:', error);
    return 0;
  }
};

/**
 * Get recommendations to reduce churn based on user's churn risk
 */
export const getChurnReductionRecommendations = async (): Promise<string[]> => {
  try {
    const churnRisk = await predictChurnRisk();
    
    if (churnRisk < 0.3) {
      return []; // Low risk, no recommendations needed
    }
    
    const recommendations: string[] = [];
    
    if (churnRisk >= 0.7) {
      // High risk recommendations
      recommendations.push('Offer a special discount for annual subscription');
      recommendations.push('Send a personalized email highlighting your most-used features');
      recommendations.push('Provide a complimentary consultation or tutorial session');
    } else if (churnRisk >= 0.5) {
      // Medium risk recommendations
      recommendations.push('Highlight unused premium features that match your needs');
      recommendations.push('Offer a small discount for continuing subscription');
      recommendations.push('Check in to see if you need help with any features');
    } else {
      // Low-medium risk recommendations
      recommendations.push('Remind you about premium features you haven\'t tried yet');
      recommendations.push('Suggest new integrations or features released recently');
    }
    
    return recommendations;
  } catch (error) {
    logger.error('Error getting churn reduction recommendations:', error);
    return [];
  }
};

/**
 * Display churn risk and recommendations to the user if risk is high
 */
export const showChurnRiskRecommendations = async (): Promise<void> => {
  try {
    const churnRisk = await predictChurnRisk();
    
    // Only show for medium to high risk
    if (churnRisk >= 0.5) {
      const recommendations = await getChurnReductionRecommendations();
      
      if (recommendations.length > 0) {
        // Show a toast with one of the recommendations
        const randomRecommendation = recommendations[Math.floor(Math.random() * recommendations.length)];
        
        toast.info(randomRecommendation, {
          duration: 10000,
          action: {
            label: 'View All',
            onClick: () => {
              // Navigate to subscription page or show modal with full recommendations
              window.location.href = '/subscription';
            }
          }
        });
      }
    }
  } catch (error) {
    logger.error('Error showing churn risk recommendations:', error);
  }
};

export default {
  trackSubscriptionEvent,
  calculateSubscriptionAnalytics,
  predictChurnRisk,
  getChurnReductionRecommendations,
  showChurnRiskRecommendations
};
