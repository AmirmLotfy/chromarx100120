
import { useState } from "react";
import Layout from "@/components/Layout";
import { plans } from "@/config/subscriptionPlans";
import PlanCard from "@/components/subscription/PlanCard";
import { toast } from "sonner";

const PlansPage = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleSubscribe = async (planId: string) => {
    try {
      // TODO: Implement subscription processing
      toast.info("Subscription feature coming soon!");
    } catch (error) {
      console.error("Error subscribing to plan:", error);
      toast.error("Failed to process subscription");
    }
  };

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
            <PlanCard
              key={plan.id}
              {...plan}
              isSelected={selectedPlan === plan.id}
              onSelect={setSelectedPlan}
              onSubscribe={handleSubscribe}
            />
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default PlansPage;
