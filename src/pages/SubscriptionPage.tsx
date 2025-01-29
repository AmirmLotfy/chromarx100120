import Layout from "@/components/Layout";
import PlanCard from "@/components/subscription/PlanCard";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";

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

const SubscriptionPage = () => {
  return (
    <Layout>
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight mb-4">
            Choose Your Plan
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Select the plan that best fits your needs. All plans include our core
            features with additional capabilities as you upgrade.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <PlanCard key={plan.id} {...plan} />
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default SubscriptionPage;