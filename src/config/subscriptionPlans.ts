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
}

export interface Plan {
  id: string;
  name: string;
  pricing: PlanPricing;
  description: string;
  features: PlanFeature[];
  isPopular?: boolean;
  limits?: PlanLimits;
}

export const subscriptionPlans: Plan[] = [
  {
    id: "basic",
    name: "Basic",
    pricing: {
      monthly: 0,
      yearly: 0
    },
    description: "Essential features for getting started",
    features: [
      { name: "Unlimited bookmarks", included: true },
      { name: "Basic bookmark organization", included: true },
      { name: "Search and filter bookmarks", included: true },
      { name: "Basic browsing analytics", included: true },
      { name: "Single timer with notifications", included: true },
      { name: "Up to 25 tasks", included: true },
      { name: "Up to 10 notes", included: true },
      { name: "Community support", included: true },
      { name: "Advanced bookmark categorization", included: false },
      { name: "AI features", included: false },
      { name: "Advanced analytics", included: false },
      { name: "Priority support", included: false },
    ],
    limits: {
      bookmarks: 100,
      tasks: 25,
      notes: 10
    }
  },
  {
    id: "pro",
    name: "Pro",
    pricing: {
      monthly: 4.99,
      yearly: 49.99
    },
    description: "Perfect for power users",
    features: [
      { name: "Unlimited bookmarks", included: true },
      { name: "Basic bookmark organization", included: true },
      { name: "Search and filter bookmarks", included: true },
      { name: "Advanced bookmark categorization", included: true },
      { name: "AI summarization", included: true },
      { name: "Advanced analytics", included: true },
      { name: "Multiple timers", included: true },
      { name: "Unlimited tasks", included: true },
      { name: "Unlimited notes", included: true },
      { name: "Priority support", included: true },
      { name: "Custom focus modes", included: false },
      { name: "Advanced collaboration", included: false },
    ],
    isPopular: true,
    limits: {
      bookmarks: 1000,
      tasks: 100,
      notes: 50
    }
  },
  {
    id: "premium",
    name: "Premium",
    pricing: {
      monthly: 7.99,
      yearly: 79.99
    },
    description: "Ultimate productivity suite",
    features: [
      { name: "Unlimited bookmarks", included: true },
      { name: "Basic bookmark organization", included: true },
      { name: "Search and filter bookmarks", included: true },
      { name: "Advanced bookmark categorization", included: true },
      { name: "Priority AI features", included: true },
      { name: "Custom analytics", included: true },
      { name: "Custom timers & focus modes", included: true },
      { name: "Advanced task management", included: true },
      { name: "Collaboration features", included: true },
      { name: "Phone support", included: true },
      { name: "Calendar integration", included: true },
      { name: "Third-party integrations", included: true },
    ],
    limits: {
      bookmarks: -1, // Unlimited
      tasks: -1, // Unlimited
      notes: -1 // Unlimited
    }
  },
];

export const getFeatureAvailability = (planId: string, featureName: string): boolean => {
  const plan = subscriptionPlans.find(p => p.id === planId);
  if (!plan) return false;
  
  const feature = plan.features.find(f => f.name === featureName);
  return feature?.included || false;
};

export const getPlanById = (planId: string): Plan | undefined => {
  return subscriptionPlans.find(p => p.id === planId);
};

export const checkFeatureAccess = async (userId: string, feature: string): Promise<boolean> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const currentPlan = userDoc.data()?.currentPlan || 'basic';
    return getFeatureAvailability(currentPlan, feature);
  } catch (error) {
    console.error('Error checking feature access:', error);
    return false;
  }
};