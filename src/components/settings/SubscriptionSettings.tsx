import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PlanCard from "@/components/subscription/PlanCard";

const plans = [
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

const SubscriptionSettings = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription</CardTitle>
        <CardDescription>
          Manage your subscription plan and billing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <PlanCard key={plan.id} {...plan} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionSettings;