
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { CreditCard, Check } from "lucide-react";
import { toast } from "sonner";
import { subscriptionPlans, changePlan } from "@/config/subscriptionPlans";
import PlanCard from "@/components/subscription/PlanCard";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/use-subscription";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";

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

  const freeFeatures = [
    { title: "Bookmark Management", items: [
      "50 bookmarks storage limit",
      "Import up to 50 bookmarks at once",
      "Categorize up to 20 bookmarks/month",
      "10 page summaries/month",
      "15 keyword extractions/month"
    ]},
    { title: "AI-Powered Tools", items: [
      "10 chat queries/month",
      "5 sentiment analyses/month",
      "5 task duration estimates/month"
    ]},
    { title: "Productivity", items: [
      "Basic task management",
      "Standard Pomodoro timer (25/5)",
      "Up to 30 tasks"
    ]},
    { title: "Notes & Chat", items: [
      "Up to 20 notes",
      "10 AI chat queries/month"
    ]}
  ];

  const proFeatures = [
    { title: "Bookmark Management", items: [
      "Unlimited bookmark storage",
      "Unlimited imports",
      "Unlimited AI categorization",
      "Unlimited page summaries",
      "Unlimited keyword extraction",
      "Advanced bookmark cleanup"
    ]},
    { title: "AI-Powered Tools", items: [
      "Unlimited chat queries",
      "Unlimited sentiment analysis",
      "Unlimited task estimates",
      "Contextual AI responses"
    ]},
    { title: "Productivity", items: [
      "Advanced task management",
      "Customizable Pomodoro timer",
      "Time tracking for tasks",
      "Priority levels and due dates"
    ]},
    { title: "Notes & Chat", items: [
      "Unlimited notes",
      "Advanced sentiment analysis",
      "Keyword extraction for notes"
    ]},
    { title: "Analytics", items: [
      "Domain-based insights",
      "Time distribution charts",
      "AI productivity recommendations"
    ]}
  ];

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
          <Alert className="mb-6 bg-yellow-50 border-yellow-200 text-yellow-800">
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

        {/* Detailed features comparison */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">Detailed Feature Comparison</h2>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="border rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Free Plan</h3>
              
              {freeFeatures.map((category, idx) => (
                <div key={idx} className="mb-6">
                  <h4 className="font-semibold text-lg mb-2">{category.title}</h4>
                  <ul className="space-y-2">
                    {category.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  {idx < freeFeatures.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
            
            <div className="border rounded-lg p-6 border-primary bg-primary/5">
              <h3 className="text-xl font-bold mb-4 text-primary">Pro Plan</h3>
              
              {proFeatures.map((category, idx) => (
                <div key={idx} className="mb-6">
                  <h4 className="font-semibold text-lg mb-2">{category.title}</h4>
                  <ul className="space-y-2">
                    {category.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  {idx < proFeatures.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          </div>
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
