
import { chromeDb } from '@/lib/chrome-storage';
import { toast } from 'sonner';

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
  tasks: number;
  notes: number;
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
  status: string;
  createdAt: string;
  endDate: string;
  usage: {
    bookmarks: number;
    tasks: number;
    notes: number;
    aiRequests: number;
  };
}

export interface UserData {
  subscription?: UserSubscription;
  email?: string;
  displayName?: string;
  photoURL?: string;
}

export const subscriptionPlans: Plan[] = [
  {
    id: "free",
    name: "Free",
    pricing: {
      monthly: 0,
      yearly: 0
    },
    description: "Basic features for getting started",
    features: [
      { name: "Basic bookmark management", included: true },
      { name: "Basic analytics", included: true },
      { name: "Limited AI features", included: true, description: "Basic summarization only" },
      { name: "Community support", included: true },
      { name: "Advanced AI features", included: false },
      { name: "Priority support", included: false },
      { name: "Advanced analytics", included: false },
      { name: "Unlimited storage", included: false },
    ],
    limits: {
      bookmarks: 50,
      tasks: 30,
      notes: 30,
      aiRequests: 10
    }
  },
  {
    id: "basic",
    name: "Basic",
    pricing: {
      monthly: 4.99,
      yearly: 49.99
    },
    description: "Enhanced features for productivity",
    features: [
      { name: "Enhanced bookmark management", included: true },
      { name: "Weekly analytics reports", included: true },
      { name: "AI summarization & detection", included: true },
      { name: "Priority email support", included: true },
      { name: "Advanced AI features", included: false },
      { name: "24/7 chat support", included: false },
      { name: "Custom analytics", included: false },
      { name: "Unlimited storage", included: false },
    ],
    isPopular: true,
    limits: {
      bookmarks: 200,
      tasks: 100,
      notes: 100,
      aiRequests: 50
    }
  },
  {
    id: "premium",
    name: "Premium",
    pricing: {
      monthly: 9.99,
      yearly: 99.99
    },
    description: "Ultimate productivity suite",
    features: [
      { name: "Unlimited bookmark management", included: true },
      { name: "Advanced analytics & insights", included: true },
      { name: "Full AI capabilities", included: true },
      { name: "24/7 priority support", included: true },
      { name: "Custom integrations", included: true },
      { name: "Team collaboration", included: true },
      { name: "API access", included: true },
      { name: "White-label options", included: true },
    ],
    limits: {
      bookmarks: -1, // Unlimited
      tasks: -1, // Unlimited
      notes: -1, // Unlimited
      aiRequests: -1 // Unlimited
    }
  }
];

// Utility functions for subscription management
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
    
    const plan = subscriptionPlans.find(p => p.id === userData.subscription.planId);
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
    
    // Alert user when approaching limit
    if (usage >= limit * 0.8) {
      toast.warning(`You're approaching your ${type} limit. Consider upgrading your plan.`);
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
    
    await retryWithBackoff(() => 
      chromeDb.update('user', {
        subscription: {
          ...userData.subscription,
          usage: {
            ...userData.subscription.usage,
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

// Add new subscription management functions
export const upgradePlan = async (userId: string, newPlanId: string): Promise<boolean> => {
  try {
    const userData = await retryWithBackoff(() => chromeDb.get<UserData>('user'));
    if (!userData) throw new Error('User data not found');

    const newPlan = subscriptionPlans.find(p => p.id === newPlanId);
    if (!newPlan) throw new Error('Invalid plan ID');

    await retryWithBackoff(() => 
      chromeDb.update('user', {
        subscription: {
          planId: newPlanId,
          status: 'active',
          createdAt: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          usage: {
            bookmarks: 0,
            tasks: 0,
            notes: 0,
            aiRequests: 0
          }
        }
      })
    );

    toast.success(`Successfully upgraded to ${newPlan.name} plan`);
    return true;
  } catch (error) {
    console.error('Error upgrading plan:', error);
    toast.error('Failed to upgrade plan');
    return false;
  }
};

export const cancelSubscription = async (userId: string): Promise<boolean> => {
  try {
    await retryWithBackoff(() => 
      chromeDb.update('user', {
        subscription: {
          planId: 'free',
          status: 'cancelled',
          endDate: new Date().toISOString(),
          usage: {
            bookmarks: 0,
            tasks: 0,
            notes: 0,
            aiRequests: 0
          }
        }
      })
    );

    toast.success('Subscription cancelled successfully');
    return true;
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    toast.error('Failed to cancel subscription');
    return false;
  }
};

// Helper function for retrying operations
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
      delay *= 2; // Exponential backoff
    }
  }
};
