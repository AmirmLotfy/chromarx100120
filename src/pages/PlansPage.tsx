
import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { subscriptionPlans, type Plan } from "@/config/subscriptionPlans";

const PlansPage = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleSubscribe = async (planId: string) => {
    try {
      // TODO: Implement Stripe checkout
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
          {subscriptionPlans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative ${
                selectedPlan === plan.id ? "border-primary" : ""
              }`}
            >
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <span className="text-3xl font-bold">
                    ${plan.pricing.monthly.toFixed(2)}
                  </span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-center text-sm text-muted-foreground"
                    >
                      {feature.included ? (
                        <Check className="h-4 w-4 text-primary mr-2" />
                      ) : (
                        <span className="h-4 w-4 mr-2" />
                      )}
                      {feature.name}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.pricing.monthly === 0 ? "outline" : "default"}
                  onClick={() => handleSubscribe(plan.id)}
                >
                  {plan.pricing.monthly === 0 ? "Get Started" : "Subscribe"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default PlansPage;
