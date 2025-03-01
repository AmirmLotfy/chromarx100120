
export interface PlanFeature {
  name: string;
  included: boolean;
}

export interface Plan {
  id: string;
  name: string;
  pricing: {
    monthly: number;
    yearly: number;
  };
  description: string;
  features: PlanFeature[];
  isPopular?: boolean;
}

export const plans: Plan[] = [
  {
    id: "basic",
    name: "Basic",
    pricing: {
      monthly: 0,
      yearly: 0,
    },
    description: "Essential features for getting started",
    features: [
      { name: "Basic bookmark management", included: true },
      { name: "Simple analytics", included: true },
      { name: "Limited task tracking", included: true },
      { name: "Advanced analytics", included: false },
      { name: "AI-powered suggestions", included: false },
      { name: "Priority support", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    pricing: {
      monthly: 9.99,
      yearly: 99.99,
    },
    description: "Perfect for power users",
    isPopular: true,
    features: [
      { name: "Basic bookmark management", included: true },
      { name: "Simple analytics", included: true },
      { name: "Limited task tracking", included: true },
      { name: "Advanced analytics", included: true },
      { name: "AI-powered suggestions", included: true },
      { name: "Priority support", included: false },
    ],
  },
  {
    id: "premium",
    name: "Premium",
    pricing: {
      monthly: 19.99,
      yearly: 199.99,
    },
    description: "Ultimate productivity suite",
    features: [
      { name: "Basic bookmark management", included: true },
      { name: "Simple analytics", included: true },
      { name: "Limited task tracking", included: true },
      { name: "Advanced analytics", included: true },
      { name: "AI-powered suggestions", included: true },
      { name: "Priority support", included: true },
    ],
  },
];
