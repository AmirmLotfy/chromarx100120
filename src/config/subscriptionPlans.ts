import { chromeDb } from '@/lib/chrome-storage';
import { toast } from 'sonner';
import { Usage } from '@/types/payment';

export interface PlanFeature {
  name: string;
  included: boolean;
  description?: string;
}

export interface PlanPricing {
  monthly: number;
  yearly: number;
}

export interface PlanLimits {
  bookmarks: number;
  bookmarkImports: number;
  bookmarkCategorization: number;
  bookmarkSummaries: number;
  keywordExtraction: number;
  tasks: number;
  taskEstimation: number;
  notes: number;
  noteSentimentAnalysis: number;
  aiRequests: number;
}

export interface Plan {
  id: string;
  name: string;
  pricing: PlanPricing;
  description: string;
  features: PlanFeature[];
  isPopular?: boolean;
  limits: PlanLimits;
}

export interface UserSubscription {
  planId: string;
  id?: string; // For compatibility
  status: 'active' | 'inactive' | 'canceled' | 'expired' | 'past_due' | 'grace_period';
  createdAt: string;
  endDate: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  autoRenew: boolean;
  billingCycle: 'monthly' | 'yearly';
  trialEnd?: string;
  trialStart?: string;
  paymentMethod?: {
    type: 'card' | 'paypal';
    lastFour?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
  };
  gracePeriodEndDate?: string;
  renewalAttempts?: number;
  lastRenewalAttempt?: string;
  updatedAt?: string;
  usage: Usage;
}

export interface UserData {
  subscription?: UserSubscription;
  email?: string;
  displayName?: string;
  photoURL?: string;
  locale?: string;
  currency?: string;
  notifications?: {
    renewalReminders: boolean;
    usageLimits: boolean;
    paymentReceipts: boolean;
  };
}

export const subscriptionPlans: Plan[] = [
  {
    id: "free",
    name: "Free",
    pricing: {
      monthly: 0,
      yearly: 0
    },
    description: "Essential features for personal use",
    features: [
      { name: "Basic bookmark management", included: true, description: "Organize up to 50 bookmarks" },
      { name: "Simple search functionality", included: true },
      { name: "Basic AI summarization", included: true, description: "10 summaries per month" },
      { name: "Basic notes & tasks", included: true, description: "Up to 30 each" },
      { name: "Simple productivity timer", included: true },
      { name: "Community support", included: true },
      { name: "Advanced AI features", included: false },
      { name: "Advanced analytics & insights", included: false },
      { name: "Custom collections", included: false },
      { name: "Priority support", included: false },
      { name: "Cross-device sync", included: false },
      { name: "Unlimited storage", included: false },
    ],
    limits: {
      bookmarks: 50,
      bookmarkImports: 50,
      bookmarkCategorization: 20,
      bookmarkSummaries: 10,
      keywordExtraction: 15,
      tasks: 30,
      taskEstimation: 5,
      notes: 20,
      noteSentimentAnalysis: 5,
      aiRequests: 10
    }
  },
  {
    id: "pro",
    name: "Pro",
    pricing: {
      monthly: 4.99,
      yearly: 49.99
    },
    description: "Enhanced productivity for power users",
    features: [
      { name: "Enhanced bookmark management", included: true, description: "Unlimited bookmarks" },
      { name: "Advanced search & filters", included: true },
      { name: "AI summarization & content analysis", included: true, description: "Unlimited AI operations" },
      { name: "Advanced notes & tasks", included: true, description: "Unlimited notes and tasks" },
      { name: "Customizable productivity timer", included: true },
      { name: "Advanced analytics dashboard", included: true },
      { name: "Custom bookmark collections", included: true },
      { name: "Priority email support", included: true },
      { name: "Cross-device synchronization", included: true },
      { name: "Productivity reports & insights", included: true },
      { name: "Tag-based organization", included: true },
      { name: "Offline access", included: true },
    ],
    isPopular: true,
    limits: {
      bookmarks: -1, // Unlimited
      bookmarkImports: -1, // Unlimited
      bookmarkCategorization: -1, // Unlimited
      bookmarkSummaries: -1, // Unlimited
      keywordExtraction: -1, // Unlimited
      tasks: -1, // Unlimited
      taskEstimation: -1, // Unlimited
      notes: -1, // Unlimited
      noteSentimentAnalysis: -1, // Unlimited
      aiRequests: -1 // Unlimited
    }
  }
];

export const getFeatureAvailability = async (feature: string): Promise<boolean> => {
  try {
    const userData = await retryWithBackoff(async () => {
      const data = await chromeDb.get<UserData>('user');
      if (!data) throw new Error('User data not found');
      return data;
    });

    if (!userData?.subscription) {
      console.log('No active subscription found');
      return false;
    }
    
    const plan = subscriptionPlans.find(p => p.id === userData.subscription?.planId);
    if (!plan) {
      console.error('Invalid plan ID:', userData.subscription.planId);
      return false;
    }
    
    const featureObj = plan.features.find(f => f.name === feature);
    return featureObj?.included || false;
  } catch (error) {
    console.error('Error checking feature availability:', error);
    toast.error('Failed to check feature availability');
    return false;
  }
};

export const checkUsageLimit = async (type: keyof PlanLimits): Promise<boolean> => {
  try {
    const userData = await retryWithBackoff(async () => {
      const data = await chromeDb.get<UserData>('user');
      if (!data) throw new Error('User data not found');
      return data;
    });

    if (!userData?.subscription) {
      console.log('No active subscription found');
      return false;
    }
    
    const plan = subscriptionPlans.find(p => p.id === userData.subscription.planId);
    if (!plan) {
      console.error('Invalid plan ID:', userData.subscription.planId);
      return false;
    }
    
    const limit = plan.limits[type];
    if (limit === -1) return true; // Unlimited
    
    const usage = userData.subscription.usage?.[type] || 0;
    
    if (usage >= limit * 0.8 && userData.subscription.status === 'active') {
      toast.warning(`You're approaching your ${type} limit (${usage}/${limit}). Consider upgrading to Pro.`, {
        action: {
          label: 'Upgrade',
          onClick: () => window.location.href = '/subscription'
        },
        duration: 10000
      });
    }
    
    return usage < limit;
  } catch (error) {
    console.error('Error checking usage limit:', error);
    toast.error('Failed to check usage limit');
    return false;
  }
};

export const incrementUsage = async (type: keyof PlanLimits): Promise<boolean> => {
  try {
    const userData = await retryWithBackoff(async () => {
      const data = await chromeDb.get<UserData>('user');
      if (!data) throw new Error('User data not found');
      return data;
    });

    if (!userData?.subscription) {
      console.log('No active subscription found');
      return false;
    }
    
    const currentUsage = userData.subscription.usage?.[type] || 0;
    
    if (userData.subscription.planId === 'free') {
      const plan = subscriptionPlans.find(p => p.id === 'free');
      if (plan && currentUsage >= plan.limits[type]) {
        toast.error(`You've reached your ${type} limit. Upgrade to Pro for unlimited access.`, {
          action: {
            label: 'Upgrade',
            onClick: () => window.location.href = '/subscription'
          },
          duration: 8000
        });
        return false;
      }
    }
    
    await retryWithBackoff(() => 
      chromeDb.update('user', {
        subscription: {
          ...userData.subscription,
          usage: {
            ...userData.subscription?.usage,
            [type]: currentUsage + 1
          }
        }
      })
    );
    
    return true;
  } catch (error) {
    console.error('Error incrementing usage:', error);
    toast.error('Failed to update usage counter');
    return false;
  }
};

export const getPlanById = (planId: string): Plan | undefined => {
  return subscriptionPlans.find(p => p.id === planId);
};

export const checkNeedsRenewal = async (): Promise<boolean> => {
  try {
    const userData = await retryWithBackoff(() => chromeDb.get<UserData>('user'));
    if (!userData?.subscription) return false;
    
    if (userData.subscription.planId !== 'pro' || 
        userData.subscription.status !== 'active' ||
        userData.subscription.cancelAtPeriodEnd) {
      return false;
    }
    
    const now = new Date();
    const endDate = new Date(userData.subscription.currentPeriodEnd);
    const daysDiff = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysDiff <= 3;
  } catch (error) {
    console.error('Error checking renewal need:', error);
    return false;
  }
};

export const resetMonthlyUsage = async (): Promise<boolean> => {
  try {
    const userData = await retryWithBackoff(() => chromeDb.get<UserData>('user'));
    if (!userData?.subscription) return false;
    
    const updatedUsage = {
      bookmarks: userData.subscription.usage.bookmarks,
      bookmarkImports: 0,
      bookmarkCategorization: 0,
      bookmarkSummaries: 0,
      keywordExtraction: 0,
      tasks: userData.subscription.usage.tasks,
      taskEstimation: 0,
      notes: userData.subscription.usage.notes,
      noteSentimentAnalysis: 0,
      aiRequests: 0
    };
    
    await retryWithBackoff(() => 
      chromeDb.update('user', {
        subscription: {
          ...userData.subscription,
          usage: updatedUsage
        }
      })
    );
    
    return true;
  } catch (error) {
    console.error('Error resetting monthly usage:', error);
    return false;
  }
};

export const changePlan = async (newPlanId: string, billingCycle: 'monthly' | 'yearly' = 'monthly'): Promise<boolean> => {
  try {
    const userData = await retryWithBackoff(() => chromeDb.get<UserData>('user'));
    if (!userData) throw new Error('User data not found');

    const newPlan = subscriptionPlans.find(p => p.id === newPlanId);
    if (!newPlan) throw new Error('Invalid plan ID');
    
    const oldPlanId = userData.subscription?.planId || 'free';
    const isUpgrade = oldPlanId === 'free' && newPlanId === 'pro';
    const isDowngrade = oldPlanId === 'pro' && newPlanId === 'free';
    
    const now = new Date();
    const startDate = now.toISOString();
    const endDate = new Date(now);
    
    if (billingCycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }
    
    await retryWithBackoff(() => 
      chromeDb.update('user', {
        subscription: {
          planId: newPlanId,
          status: 'active',
          createdAt: userData.subscription?.createdAt || startDate,
          currentPeriodStart: startDate,
          currentPeriodEnd: endDate.toISOString(),
          endDate: endDate.toISOString(),
          cancelAtPeriodEnd: false,
          autoRenew: true,
          billingCycle,
          usage: {
            bookmarks: userData.subscription?.usage?.bookmarks || 0,
            bookmarkImports: userData.subscription?.usage?.bookmarkImports || 0,
            bookmarkCategorization: userData.subscription?.usage?.bookmarkCategorization || 0,
            bookmarkSummaries: userData.subscription?.usage?.bookmarkSummaries || 0,
            keywordExtraction: userData.subscription?.usage?.keywordExtraction || 0,
            tasks: userData.subscription?.usage?.tasks || 0,
            taskEstimation: userData.subscription?.usage?.taskEstimation || 0,
            notes: userData.subscription?.usage?.notes || 0,
            noteSentimentAnalysis: userData.subscription?.usage?.noteSentimentAnalysis || 0,
            aiRequests: userData.subscription?.usage?.aiRequests || 0
          }
        }
      })
    );

    const paymentHistory = await chromeDb.get<any[]>('payment_history') || [];
    if (isUpgrade) {
      const price = billingCycle === 'yearly' ? newPlan.pricing.yearly : newPlan.pricing.monthly;
      paymentHistory.push({
        id: `payment_${Date.now()}`,
        orderId: `order_${Date.now()}`,
        planId: newPlanId,
        amount: price,
        status: 'completed',
        provider: 'paypal',
        autoRenew: true,
        createdAt: startDate,
        type: 'upgrade',
        billingCycle
      });
      await chromeDb.set('payment_history', paymentHistory);
    }

    toast.success(isUpgrade 
      ? `Successfully upgraded to ${newPlan.name} plan!` 
      : isDowngrade 
        ? 'Successfully downgraded to Free plan' 
        : `Successfully changed to ${newPlan.name} plan`);
    return true;
  } catch (error) {
    console.error('Error changing plan:', error);
    toast.error('Failed to change plan');
    return false;
  }
};

export const cancelSubscription = async (immediate: boolean = false): Promise<boolean> => {
  try {
    const userData = await retryWithBackoff(() => chromeDb.get<UserData>('user'));
    if (!userData?.subscription) throw new Error('No subscription found');
    
    if (immediate) {
      await retryWithBackoff(() => 
        chromeDb.update('user', {
          subscription: {
            ...userData.subscription,
            planId: 'free',
            status: 'canceled',
            cancelAtPeriodEnd: true,
            autoRenew: false
          }
        })
      );
      
      toast.success('Your subscription has been canceled immediately');
    } else {
      await retryWithBackoff(() => 
        chromeDb.update('user', {
          subscription: {
            ...userData.subscription,
            cancelAtPeriodEnd: true,
            autoRenew: false
          }
        })
      );
      
      toast.success('Your subscription will be canceled at the end of the billing period');
    }
    
    return true;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    toast.error('Failed to cancel subscription');
    return false;
  }
};

export const updatePaymentMethod = async (paymentMethod: {
  type: 'card' | 'paypal';
  lastFour?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
}): Promise<boolean> => {
  try {
    const userData = await retryWithBackoff(() => chromeDb.get<UserData>('user'));
    if (!userData?.subscription) throw new Error('No subscription found');
    
    await retryWithBackoff(() => 
      chromeDb.update('user', {
        subscription: {
          ...userData.subscription,
          paymentMethod
        }
      })
    );
    
    toast.success('Payment method updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating payment method:', error);
    toast.error('Failed to update payment method');
    return false;
  }
};

export const setAutoRenew = async (autoRenew: boolean): Promise<boolean> => {
  try {
    const userData = await retryWithBackoff(() => chromeDb.get<UserData>('user'));
    if (!userData?.subscription) throw new Error('No subscription found');
    
    await retryWithBackoff(() => 
      chromeDb.update('user', {
        subscription: {
          ...userData.subscription,
          autoRenew,
          cancelAtPeriodEnd: !autoRenew
        }
      })
    );
    
    toast.success(autoRenew 
      ? 'Auto-renewal has been enabled' 
      : 'Auto-renewal has been disabled');
    return true;
  } catch (error) {
    console.error('Error setting auto-renew:', error);
    toast.error('Failed to update auto-renewal settings');
    return false;
  }
};

export const changeBillingCycle = async (billingCycle: 'monthly' | 'yearly'): Promise<boolean> => {
  try {
    const userData = await retryWithBackoff(() => chromeDb.get<UserData>('user'));
    if (!userData?.subscription) throw new Error('No subscription found');
    
    const now = new Date();
    const endDate = new Date(now);
    
    if (billingCycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }
    
    await retryWithBackoff(() => 
      chromeDb.update('user', {
        subscription: {
          ...userData.subscription,
          billingCycle,
          currentPeriodStart: now.toISOString(),
          currentPeriodEnd: endDate.toISOString()
        }
      })
    );
    
    const plan = subscriptionPlans.find(p => p.id === userData.subscription?.planId);
    if (plan && plan.id === 'pro') {
      const price = billingCycle === 'yearly' ? plan.pricing.yearly : plan.pricing.monthly;
      const paymentHistory = await chromeDb.get<any[]>('payment_history') || [];
      paymentHistory.push({
        id: `payment_${Date.now()}`,
        orderId: `order_${Date.now()}`,
        planId: plan.id,
        amount: price,
        status: 'completed',
        provider: 'paypal',
        autoRenew: userData.subscription.autoRenew,
        createdAt: now.toISOString(),
        type: 'billing_change',
        billingCycle
      });
      await chromeDb.set('payment_history', paymentHistory);
    }
    
    toast.success(`Billing cycle changed to ${billingCycle}`);
    return true;
  } catch (error) {
    console.error('Error changing billing cycle:', error);
    toast.error('Failed to update billing cycle');
    return false;
  }
};

const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> => {
  let retries = 0;
  let delay = initialDelay;

  while (true) {
    try {
      return await operation();
    } catch (error) {
      retries++;
      if (retries > maxRetries) {
        throw error;
      }

      console.log(`Retry attempt ${retries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
};
