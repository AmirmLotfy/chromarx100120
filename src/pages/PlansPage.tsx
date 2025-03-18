
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { CreditCard, Check } from "lucide-react";
import { toast } from "sonner";
import { subscriptionPlans, changePlan } from "@/config/subscriptionPlans";
import PlanCard from "@/components/subscription/PlanCard";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/use-subscription";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";

const PlansPage = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { subscription, currentPlan } = useSubscription();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const navigate = useNavigate();

  useEffect(() => {
    // Set the billing cycle based on current subscription
    if (subscription?.billingCycle) {
      setBillingCycle(subscription.billingCycle);
    }
  }, [subscription]);

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
    if (!selectedPlan) {
      toast.error("Please select a plan first");
      return;
    }
    
    if (selectedPlan === 'free') {
      // If current plan is already free, do nothing
      if (isCurrentPlan('free')) {
        toast.info("You're already on the Free plan");
        return;
      }
      
      // Downgrade to free plan
      try {
        setIsProcessing(true);
        const result = await changePlan('free');
        
        if (result) {
          toast.success("Successfully downgraded to Free plan");
          navigate('/subscription');
        } else {
          toast.error("Failed to downgrade plan");
        }
      } catch (error) {
        console.error("Error downgrading to free plan:", error);
        toast.error("Failed to downgrade plan");
      } finally {
        setIsProcessing(false);
      }
      return;
    }
    
    // Handle upgrade to Pro
    try {
      setIsProcessing(true);
      const orderId = generateOrderId();
      
      // First, process payment through Supabase function
      const response = await fetch('https://tfqkwbvusjhcmbkxnpnt.supabase.co/functions/v1/process-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          planId: selectedPlan,
          autoRenew: true,
          billingCycle
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Update local subscription with the result
        const updateResult = await changePlan(selectedPlan, billingCycle);
        
        if (updateResult) {
          toast.success(`Successfully subscribed to ${selectedPlan === 'pro' ? 'Pro' : 'Premium'} plan!`);
          navigate('/subscription');
        } else {
          toast.error("Payment processed, but failed to update subscription");
        }
      } else {
        toast.error(result.error || "Failed to process payment");
      }
    } catch (error) {
      console.error("Error subscribing to plan:", error);
      toast.error("Failed to process subscription");
    } finally {
      setIsProcessing(false);
    }
  };

  const getPlanPrice = (plan: any) => {
    return billingCycle === "yearly" 
      ? `$${plan.pricing.yearly.toFixed(2)}/year` 
      : `$${plan.pricing.monthly.toFixed(2)}/month`;
  };

  const getSavingsText = (plan: any) => {
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

        {subscription?.status === 'grace_period' && (
          <Alert variant="warning" className="mb-6 bg-yellow-50 border-yellow-200 text-yellow-800">
            <AlertTitle>Your subscription requires attention</AlertTitle>
            <AlertDescription>
              Your payment method needs to be updated. Please visit the subscription page to update your payment details.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Only show Free and Pro plans */}
          {subscriptionPlans.filter(plan => plan.id === 'free' || plan.id === 'pro').map((plan) => (
            <PlanCard
              key={plan.id}
              {...plan}
              onSelect={handleSelectPlan}
              isSelected={selectedPlan === plan.id}
              isCurrentPlan={isCurrentPlan(plan.id)}
              billingCycle={billingCycle}
            />
          ))}
        </div>

        {selectedPlan && !isCurrentPlan(selectedPlan) && (
          <div className="mt-10 text-center">
            <Button
              className="px-8 py-6 text-lg" 
              onClick={handleSubscribe}
              disabled={isProcessing}
            >
              <CreditCard className="mr-2 h-5 w-5" />
              {isProcessing 
                ? "Processing..." 
                : selectedPlan === 'free'
                  ? 'Downgrade to Free Plan'
                  : `Subscribe for ${getPlanPrice(subscriptionPlans.find(p => p.id === selectedPlan))}`}
            </Button>
            {selectedPlan !== 'free' && getSavingsText(subscriptionPlans.find(p => p.id === selectedPlan)) && (
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
