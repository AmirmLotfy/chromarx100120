
import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { subscriptionPlans } from "@/config/subscriptionPlans";
import PlanCard from "@/components/subscription/PlanCard";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/use-subscription";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PlansPage = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { currentPlan, subscription } = useSubscription();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const isCurrentPlan = (planId: string) => {
    return currentPlan === planId && subscription?.status === 'active';
  };

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
  };

  const generateOrderId = () => {
    return `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  };

  const handleSubscribe = async () => {
    if (!selectedPlan || selectedPlan === 'free') {
      if (selectedPlan === 'free') {
        toast.success("You're now on the Free plan!");
      }
      return;
    }

    try {
      setIsProcessing(true);
      const selectedPlanDetails = subscriptionPlans.find(p => p.id === selectedPlan);
      
      if (!selectedPlanDetails) {
        toast.error("Invalid plan selected");
        return;
      }

      // Generate a mock order ID (in real implementation this would come from PayPal)
      const orderId = generateOrderId();
      
      // Process the payment through our Supabase function
      const response = await fetch('https://tfqkwbvusjhcmbkxnpnt.supabase.co/functions/v1/process-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          planId: selectedPlan,
          autoRenew: true,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Successfully subscribed to ${selectedPlanDetails.name} plan!`);
        // In a real app, we would update the local subscription state here
        // and reload the current user's subscription data
      } else {
        toast.error(result.error || "Failed to process subscription");
      }
    } catch (error) {
      console.error("Error subscribing to plan:", error);
      toast.error("Failed to process subscription");
    } finally {
      setIsProcessing(false);
    }
  };

  const getPlanPrice = (plan) => {
    return billingCycle === "yearly" 
      ? `$${plan.pricing.yearly.toFixed(2)}/year` 
      : `$${plan.pricing.monthly.toFixed(2)}/month`;
  };

  const getSavingsText = (plan) => {
    if (billingCycle === "yearly" && plan.pricing.yearly < plan.pricing.monthly * 12) {
      const savings = (plan.pricing.monthly * 12) - plan.pricing.yearly;
      const savingsPercentage = Math.round((savings / (plan.pricing.monthly * 12)) * 100);
      return `Save ${savingsPercentage}%`;
    }
    return null;
  };

  return (
    <Layout>
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-4">
            Choose Your Plan
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Select the plan that best fits your needs. All plans include our core
            features with additional capabilities as you upgrade.
          </p>
        </div>

        <div className="mb-8 flex justify-center">
          <Tabs 
            defaultValue="monthly" 
            value={billingCycle}
            onValueChange={(value) => setBillingCycle(value as "monthly" | "yearly")}
            className="w-[300px]"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">Yearly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {subscriptionPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              {...plan}
              onSelect={handleSelectPlan}
              isSelected={selectedPlan === plan.id}
              isCurrentPlan={isCurrentPlan(plan.id)}
            />
          ))}
        </div>

        {selectedPlan && selectedPlan !== 'free' && !isCurrentPlan(selectedPlan) && (
          <div className="mt-10 text-center">
            <Button
              className="px-8 py-6 text-lg" 
              onClick={handleSubscribe}
              disabled={isProcessing}
            >
              <CreditCard className="mr-2 h-5 w-5" />
              {isProcessing 
                ? "Processing..." 
                : `Subscribe for ${getPlanPrice(subscriptionPlans.find(p => p.id === selectedPlan))}`}
            </Button>
            {getSavingsText(subscriptionPlans.find(p => p.id === selectedPlan)) && (
              <p className="mt-2 text-sm text-green-600 font-medium">
                {getSavingsText(subscriptionPlans.find(p => p.id === selectedPlan))}
              </p>
            )}
            <p className="mt-4 text-sm text-muted-foreground max-w-lg mx-auto">
              Secure payment processing via PayPal. You can use any major credit or debit card without creating a PayPal account.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PlansPage;
