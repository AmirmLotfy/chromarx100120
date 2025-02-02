import { chromeDb } from '@/lib/chrome-storage';

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

export const getFeatureAvailability = async (feature: string): Promise<boolean> => {
  try {
    const userData = await chromeDb.get('user');
    if (!userData?.subscription) return false;
    
    const plan = subscriptionPlans.find(p => p.id === userData.subscription.planId);
    if (!plan) return false;
    
    const featureObj = plan.features.find(f => f.name === feature);
    return featureObj?.included || false;
  } catch (error) {
    console.error('Error checking feature availability:', error);
    return false;
  }
};

export const checkUsageLimit = async (type: keyof PlanLimits): Promise<boolean> => {
  try {
    const userData = await chromeDb.get('user');
    if (!userData?.subscription) return false;
    
    const plan = subscriptionPlans.find(p => p.id === userData.subscription.planId);
    if (!plan) return false;
    
    const limit = plan.limits[type];
    if (limit === -1) return true; // Unlimited
    
    const usage = userData.subscription.usage?.[type] || 0;
    return usage < limit;
  } catch (error) {
    console.error('Error checking usage limit:', error);
    return false;
  }
};

export const incrementUsage = async (type: keyof PlanLimits): Promise<boolean> => {
  try {
    const userData = await chromeDb.get('user');
    if (!userData?.subscription) return false;
    
    const currentUsage = userData.subscription.usage?.[type] || 0;
    
    await chromeDb.update('user', {
      subscription: {
        ...userData.subscription,
        usage: {
          ...userData.subscription.usage,
          [type]: currentUsage + 1
        }
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error incrementing usage:', error);
    return false;
  }
};

export const getPlanById = (planId: string): Plan | undefined => {
  return subscriptionPlans.find(p => p.id === planId);
};