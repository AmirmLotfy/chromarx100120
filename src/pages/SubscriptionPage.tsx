
import { useState } from "react";
import Layout from "@/components/Layout";
import { useIsMobile } from "@/hooks/use-mobile";
import SubscriptionPlanCard from "@/components/subscription/SubscriptionPlanCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/use-subscription";

// Define our two plans
const plans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    description: "Basic features to get started",
    features: [
      { name: "50 Bookmarks", included: true },
      { name: "30 Tasks", included: true },
      { name: "30 Notes", included: true },
      { name: "10 AI Requests", included: true },
      { name: "Basic bookmark management", included: true },
      { name: "Limited AI features", included: true },
      { name: "Community support", included: true },
      { name: "Cloud backup", included: false },
    ],
    cta: "Get Started",
    variant: "outline" as const
  },
  {
    id: "pro",
    name: "Pro",
    price: 4.99,
    description: "Everything you need for productivity",
    features: [
      { name: "Unlimited Bookmarks", included: true },
      { name: "Unlimited Tasks", included: true },
      { name: "Unlimited Notes", included: true },
      { name: "Unlimited AI Requests", included: true },
      { name: "Advanced bookmark management", included: true },
      { name: "Full AI capabilities", included: true },
      { name: "Priority support", included: true },
      { name: "Cloud backup", included: true },
    ],
    cta: "Upgrade Now",
    variant: "default" as const,
    popular: true
  }
];

const SubscriptionPage = () => {
  const isMobile = useIsMobile();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const { setSubscriptionPlan } = useSubscription();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
  };

  const handleSubscriptionSuccess = async (details: any) => {
    try {
      setIsProcessing(true);
      console.log("Payment successful:", details);
      
      // Update the user's subscription
      if (selectedPlanId) {
        await setSubscriptionPlan(selectedPlanId);
        toast.success(`Successfully subscribed to ${selectedPlanId === 'pro' ? 'Pro' : 'Free'} plan!`);
      }
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast.error("There was an issue activating your subscription.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Layout>
      <div className="relative min-h-screen bg-gradient-to-b from-background to-background/80">
        <div className="container max-w-5xl px-4 py-8 mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              Choose Your Plan
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Select the plan that fits your needs. Upgrade anytime to unlock all features.
            </p>
          </div>

          <ScrollArea className="w-full">
            <div className={`grid ${isMobile ? "grid-cols-1 gap-8" : "grid-cols-2 gap-6"} pb-8`}>
              {plans.map((plan) => (
                <SubscriptionPlanCard
                  key={plan.id}
                  plan={plan}
                  isSelected={selectedPlanId === plan.id}
                  onSelect={handleSelectPlan}
                  onSubscribe={handleSubscriptionSuccess}
                  isProcessing={isProcessing}
                />
              ))}
            </div>
          </ScrollArea>

          <div className="mt-10 text-center text-sm text-muted-foreground">
            <p className="mb-1">
              Secure payment processing by PayPal. No PayPal account required.
            </p>
            <p>
              By subscribing, you agree to our{" "}
              <a href="/terms-of-service.html" target="_blank" className="underline hover:text-primary transition-colors">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy-policy.html" target="_blank" className="underline hover:text-primary transition-colors">
                Privacy Policy
              </a>.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SubscriptionPage;
