
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useSubscription } from "@/hooks/use-subscription";
import { useIsMobile } from "@/hooks/use-mobile";
import { Check, X, CreditCard, ArrowRight, Shield, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { 
  getPayPalClientId, 
  getPayPalMode,
  validatePaymentData,
  handlePaymentError,
  formatCurrency
} from "@/utils/chromeUtils";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { subscriptionPlans } from "@/config/subscriptionPlans";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

// Filter plans to only show free and basic
const filteredPlans = subscriptionPlans.filter(
  plan => plan.id === "free" || plan.id === "basic"
);

const SubscriptionPage = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [paypalMode, setPaypalMode] = useState<'sandbox' | 'live'>('live');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const { currentPlan, setSubscriptionPlan } = useSubscription();
  const isMobile = useIsMobile();

  useEffect(() => {
    const loadPayPalConfiguration = async () => {
      try {
        setIsLoading(true);
        
        // Load both configs in parallel
        const [mode, paypalClientId] = await Promise.all([
          getPayPalMode(),
          getPayPalClientId()
        ]);
        
        setPaypalMode(mode);
        setClientId(paypalClientId);
        console.log("PayPal configuration loaded:", { mode, clientId: paypalClientId });
      } catch (error) {
        console.error("Error loading PayPal configuration:", error);
        toast.error("Failed to load payment processor. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPayPalConfiguration();
  }, []);

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
  };

  const handleSubscribe = async (planId: string) => {
    try {
      setIsLoading(true);
      await setSubscriptionPlan(planId);
      
      const planName = planId === "basic" ? "Pro" : 
                       planId.charAt(0).toUpperCase() + planId.slice(1);
      
      toast.success(`Successfully subscribed to ${planName} plan!`, {
        description: "Your account has been updated with the new features."
      });
      
      if (planId === "free") {
        setSelectedPlan(null);
      }
    } catch (error) {
      console.error("Error subscribing to plan:", error);
      toast.error("Failed to update subscription. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const createOrder = async (data: any, actions: any) => {
    try {
      setPaymentProcessing(true);
      const plan = subscriptionPlans.find(p => p.id === selectedPlan);
      if (!plan) {
        toast.error("Selected plan not found");
        return "";
      }
      
      // Validate payment data
      if (!validatePaymentData(plan.id, plan.pricing.monthly)) {
        return "";
      }
      
      console.log(`Creating order for ${plan.name} plan: $${plan.pricing.monthly}`);
      
      return actions.order.create({
        purchase_units: [{
          amount: {
            value: plan.pricing.monthly.toFixed(2),
            currency_code: "USD"
          },
          description: `ChromarX ${plan.name} Plan - Monthly Subscription`
        }],
        application_context: {
          shipping_preference: "NO_SHIPPING",
          user_action: "PAY_NOW",
          return_url: window.location.href,
          cancel_url: window.location.href
        }
      });
    } catch (error) {
      handlePaymentError(error);
      return "";
    }
  };

  const onApprove = async (data: any, actions: any) => {
    try {
      setPaymentProcessing(true);
      toast.info("Processing your payment...");
      
      // Capture the funds from the transaction
      const details = await actions.order.capture();
      console.log("Payment completed successfully:", details);
      
      if (details.status === "COMPLETED" && selectedPlan) {
        toast.success("Payment successful! Processing your subscription...");
        await handleSubscribe(selectedPlan);
      } else {
        toast.error("Payment completed but with an unexpected status. Please contact support.");
      }
    } catch (error) {
      handlePaymentError(error);
    } finally {
      setPaymentProcessing(false);
    }
  };

  const onError = (err: any) => {
    setPaymentProcessing(false);
    handlePaymentError(err);
  };

  const onCancel = () => {
    setPaymentProcessing(false);
    toast.info("Payment cancelled. Your subscription has not been changed.");
  };

  return (
    <Layout>
      <div className="bg-gradient-to-b from-[#F2FCE2] to-white dark:from-[#1A1F2C] dark:to-[#22272E] min-h-screen pb-12">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-3">
              Choose Your Plan
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm mb-4">
              Select the plan that fits your productivity needs
            </p>
            
            {currentPlan && (
              <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
                Current Plan: {currentPlan === "basic" ? "Pro" : currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
              </Badge>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <RefreshCw className="h-8 w-8 text-primary animate-spin" />
              <span className="ml-3 text-lg">Loading plans...</span>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 md:gap-8">
              {filteredPlans.map((plan) => (
                <Card 
                  key={plan.id}
                  className={cn(
                    "relative overflow-hidden transition-all duration-300 hover:shadow-lg border-2",
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
                            : formatCurrency(plan.pricing.monthly)}
                        </span>
                        {plan.pricing.monthly > 0 && (
                          <span className="text-muted-foreground text-sm ml-1">/month</span>
                        )}
                      </div>
                      {plan.id === "basic" && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Billed monthly, cancel anytime
                        </p>
                      )}
                    </div>
                    
                    <ScrollArea className="h-[180px] pr-4 mb-6">
                      <ul className="space-y-3">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            {feature.included ? (
                              <Check className="h-5 w-5 text-[#9b87f5] dark:text-[#7E69AB] shrink-0 mt-0.5" />
                            ) : (
                              <X className="h-5 w-5 text-gray-300 dark:text-gray-600 shrink-0 mt-0.5" />
                            )}
                            <span className={feature.included ? "text-foreground" : "text-muted-foreground"}>
                              {feature.name}
                              {feature.description && (
                                <span className="text-xs text-muted-foreground block mt-0.5">
                                  {feature.description}
                                </span>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                    
                    {selectedPlan === plan.id && plan.id !== "free" && clientId ? (
                      <div className="mt-4 bg-card/50 p-3 rounded-lg border border-border">
                        <h4 className="text-sm font-medium mb-2 flex items-center">
                          <Shield className="h-4 w-4 mr-1.5 text-green-500" />
                          Secure Payment
                        </h4>
                        
                        <PayPalScriptProvider options={{ 
                          clientId: clientId,
                          components: "buttons",
                          intent: "capture",
                          currency: "USD",
                          'data-client-token': 'abc123xyz', // You could fetch a client token for advanced cases
                        }}>
                          <PayPalButtons
                            style={{
                              color: "blue",
                              shape: "rect",
                              label: "pay",
                              height: 40
                            }}
                            disabled={paymentProcessing}
                            createOrder={createOrder}
                            onApprove={onApprove}
                            onError={onError}
                            onCancel={onCancel}
                          />
                        </PayPalScriptProvider>
                        
                        <p className="text-xs text-center text-muted-foreground mt-3">
                          Your subscription will begin immediately after payment
                        </p>
                      </div>
                    ) : (
                      <Button
                        className={cn(
                          "w-full gap-2 bg-[#9b87f5] hover:bg-[#8a70f0] text-white",
                          plan.id === "free" && "bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white dark:border-gray-700"
                        )}
                        disabled={isLoading || currentPlan === plan.id || paymentProcessing}
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
          )}
          
          <div className="flex flex-col items-center mt-8 text-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <CreditCard className="h-4 w-4" />
              <span>Secure payment processing by PayPal</span>
            </div>
            <p className="text-xs text-muted-foreground max-w-md">
              Your subscription will renew automatically each month until cancelled. 
              You can manage or cancel your subscription at any time from your account.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SubscriptionPage;
