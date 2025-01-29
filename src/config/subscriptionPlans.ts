export interface PlanFeature {
  name: string;
  included: boolean;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: PlanFeature[];
  isPopular?: boolean;
}

export const subscriptionPlans: Plan[] = [
  {
    id: "basic",
    name: "Basic",
    price: 0,
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
    price: 9.99,
    description: "Perfect for power users",
    features: [
      { name: "Basic bookmark management", included: true },
      { name: "Simple analytics", included: true },
      { name: "Limited task tracking", included: true },
      { name: "Advanced analytics", included: true },
      { name: "AI-powered suggestions", included: true },
      { name: "Priority support", included: false },
    ],
    isPopular: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: 19.99,
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