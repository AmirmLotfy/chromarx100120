
import { useState } from "react";
import Layout from "@/components/Layout";
import { useSubscription } from "@/hooks/use-subscription";
import { useIsMobile } from "@/hooks/use-mobile";
import { Check, X, CreditCard, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getPayPalClientId } from "@/utils/chromeUtils";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { subscriptionPlans } from "@/config/subscriptionPlans";
import { ScrollArea } from "@/components/ui/scroll-area";

// Filter to only show Free and Pro plans
const filteredPlans = subscriptionPlans.filter(
  plan => plan.id === "free" || plan.id === "basic"
);

const SubscriptionPage = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const { currentPlan, setSubscriptionPlan } = useSubscription();
  const isMobile = useIsMobile();

  // Simplified feature list for modern design
  const comparisonFeatures = [
    "Bookmark management",
    "AI summarization",
    "Analytics",
    "Priority support",
    "Custom integrations",
    "Unlimited storage"
  ];

  const handlePlanSelect = (planId: string) => {
    if (planId === currentPlan) {
      toast.info("You are already subscribed to this plan");
      return;
    }
    
    if (planId === "free") {
      handleSubscribe(planId);
      return;
    }
    
    setSelectedPlan(planId);
    
    // Load PayPal script when a paid plan is selected
    if (planId !== "free" && !clientId) {
      loadPayPalScript();
    }
  };

  const loadPayPalScript = async () => {
    try {
      setIsLoading(true);
      const paypalClientId = await getPayPalClientId();
      if (paypalClientId) {
        setClientId(paypalClientId);
      } else {
        toast.error("Could not load payment system");
      }
    } catch (error) {
      console.error("Error loading PayPal:", error);
      toast.error("Payment system unavailable");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      setIsLoading(true);
      await setSubscriptionPlan(planId);
      toast.success(`Successfully subscribed to ${planId} plan`);
      
      // If switching to free plan, reset selection
      if (planId === "free") {
        setSelectedPlan(null);
      }
    } catch (error) {
      console.error("Error subscribing to plan:", error);
      toast.error("Failed to update subscription");
    } finally {
      setIsLoading(false);
    }
  };

  const createOrder = async (data: any, actions: any) => {
    const plan = subscriptionPlans.find(p => p.id === selectedPlan);
    if (!plan) return "";
    
    return actions.order.create({
      purchase_units: [{
        amount: {
          value: plan.pricing.monthly.toFixed(2),
          currency_code: "USD"
        },
        description: `ChromarX ${plan.name} Plan Subscription`
      }],
      application_context: {
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
        return_url: window.location.href,
        cancel_url: window.location.href
      }
    });
  };

  const onApprove = async (data: any, actions: any) => {
    try {
      const details = await actions.order.capture();
      console.log("Payment completed successfully:", details);
      
      if (details.status === "COMPLETED" && selectedPlan) {
        await handleSubscribe(selectedPlan);
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Payment processing failed");
    }
  };

  return (
    <Layout>
      <div className="bg-gradient-to-b from-[#F2FCE2] to-white dark:from-[#1A1F2C] dark:to-[#22272E] min-h-screen pb-12">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-3">
              Choose Your Plan
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm">
              Select the plan that fits your productivity needs
            </p>
          </div>

          {/* Plan Selection Section */}
          <div className="grid gap-6 md:grid-cols-2 md:gap-8">
            {filteredPlans.map((plan) => (
              <Card 
                key={plan.id}
                className={cn(
                  "relative overflow-hidden transition-all duration-300 hover:shadow-lg",
                  selectedPlan === plan.id || currentPlan === plan.id 
                    ? "border-[#9b87f5] dark:border-[#7E69AB] shadow-md" 
                    : "border-border hover:border-primary/50"
                )}
              >
                {plan.id === "basic" && (
                  <div className="absolute top-0 right-0 left-0 bg-[#9b87f5] dark:bg-[#7E69AB] text-white text-xs font-medium py-1 text-center">
                    RECOMMENDED
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold tracking-tight">
                        {plan.id === "basic" ? "Pro" : plan.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {plan.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold">
                        {plan.pricing.monthly === 0 
                          ? "Free" 
                          : `$${plan.pricing.monthly.toFixed(2)}`}
                      </span>
                      {plan.pricing.monthly > 0 && (
                        <span className="text-muted-foreground text-sm ml-1">/month</span>
                      )}
                    </div>
                  </div>
                  
                  <ScrollArea className="h-[180px] pr-4 mb-6">
                    <ul className="space-y-3">
                      {comparisonFeatures.map((feature, index) => {
                        const included = plan.features.some(
                          f => f.name.toLowerCase().includes(feature.toLowerCase()) && f.included
                        );
                        
                        return (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            {included ? (
                              <Check className="h-5 w-5 text-[#9b87f5] dark:text-[#7E69AB] shrink-0 mt-0.5" />
                            ) : (
                              <X className="h-5 w-5 text-gray-300 dark:text-gray-600 shrink-0 mt-0.5" />
                            )}
                            <span className={included ? "text-foreground" : "text-muted-foreground"}>
                              {feature}
                              {feature === "Bookmark management" && plan.id === "free" && " (up to 50)"}
                              {feature === "Bookmark management" && plan.id === "basic" && " (up to 200)"}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </ScrollArea>
                  
                  {selectedPlan === plan.id && plan.id !== "free" && clientId ? (
                    <div className="mt-4">
                      <PayPalScriptProvider options={{ 
                        "client-id": clientId,
                        components: "buttons",
                        intent: "capture",
                        currency: "USD"
                      }}>
                        <PayPalButtons
                          style={{
                            color: "blue",
                            shape: "rect",
                            label: "pay",
                            height: 40
                          }}
                          createOrder={createOrder}
                          onApprove={onApprove}
                          onError={(err) => {
                            console.error('PayPal error', err);
                            toast.error("Payment processing error");
                          }}
                          fundingSource="card"
                        />
                      </PayPalScriptProvider>
                    </div>
                  ) : (
                    <Button
                      className={cn(
                        "w-full gap-2 bg-[#9b87f5] hover:bg-[#8a70f0] text-white",
                        plan.id === "free" && "bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white dark:border-gray-700"
                      )}
                      disabled={isLoading || currentPlan === plan.id}
                      onClick={() => handlePlanSelect(plan.id)}
                    >
                      {currentPlan === plan.id ? (
                        "Current Plan"
                      ) : (
                        <>
                          {plan.id === "free" ? "Downgrade" : "Upgrade"}
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
          
          {/* Payment Security Notice */}
          <div className="flex items-center justify-center mt-8 gap-2 text-sm text-muted-foreground">
            <CreditCard className="h-4 w-4" />
            <span>Secure payment processing by PayPal</span>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SubscriptionPage;
