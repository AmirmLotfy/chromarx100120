
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useSubscription } from "@/hooks/use-subscription";
import { useIsMobile } from "@/hooks/use-mobile";
import { Check, X, CreditCard, ArrowRight, Info, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { checkPayPalConfiguration, verifyPayPalPayment } from "@/utils/chromeUtils";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { subscriptionPlans } from "@/config/subscriptionPlans";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";

// Filter plans to only show free and basic
const filteredPlans = subscriptionPlans.filter(
  plan => plan.id === "free" || plan.id === "basic"
);

const SubscriptionPage = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [paypalMode, setPaypalMode] = useState<'sandbox' | 'live'>('sandbox');
  const [paypalConfigured, setPaypalConfigured] = useState<boolean>(false);
  const [isCheckingConfig, setIsCheckingConfig] = useState(true);
  const { currentPlan, setSubscriptionPlan } = useSubscription();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  useEffect(() => {
    const loadPayPalConfiguration = async () => {
      setIsCheckingConfig(true);
      try {
        const config = await checkPayPalConfiguration();
        setPaypalConfigured(config.configured);
        setPaypalMode(config.mode);
        setClientId(config.clientId);
      } catch (error) {
        console.error("Error loading PayPal configuration:", error);
        setPaypalConfigured(false);
      } finally {
        setIsCheckingConfig(false);
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
    
    // For paid plans, check if PayPal is configured
    if (!paypalConfigured && planId !== "free") {
      toast.error("PayPal is not configured. Please set up your PayPal credentials first.");
      return;
    }
    
    setSelectedPlan(planId);
  };

  const handleSubscribe = async (planId: string) => {
    try {
      setIsLoading(true);
      await setSubscriptionPlan(planId);
      toast.success(`Successfully subscribed to ${planId} plan`);
      
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

  const goToPayPalConfig = () => {
    navigate('/paypal-config');
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
      setIsProcessing(true);
      
      // Capture the order first
      const details = await actions.order.capture();
      console.log("PayPal payment completed:", details);
      
      if (details.status === "COMPLETED" && selectedPlan) {
        // Verify the payment server-side
        const paymentVerified = await verifyPayPalPayment(details.id, selectedPlan);
        
        if (paymentVerified) {
          // Update local subscription status
          await handleSubscribe(selectedPlan);
          toast.success(`Payment successful! You are now subscribed to the ${selectedPlan} plan.`);
        } else {
          toast.error("Payment verification failed. Please contact support.");
        }
      } else {
        toast.error("Payment was not completed successfully");
      }
    } catch (error) {
      console.error("Payment processing error:", error);
      toast.error("Payment processing failed");
    } finally {
      setIsProcessing(false);
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

          {/* PayPal Configuration Warning */}
          {!isCheckingConfig && !paypalConfigured && (
            <Card className="mb-8 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700">
              <div className="p-4 flex items-start gap-3">
                <Info className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-yellow-800 dark:text-yellow-400">PayPal Not Configured</h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1 mb-3">
                    You need to set up your PayPal credentials to enable payment processing. Paid plans will not be available until this is configured.
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="bg-white dark:bg-yellow-900 border-yellow-400 dark:border-yellow-600 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-800"
                    onClick={goToPayPalConfig}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configure PayPal
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Plans Grid */}
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
                              <span className="text-xs text-muted-foreground block">
                                {feature.description}
                              </span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                  
                  {selectedPlan === plan.id && plan.id !== "free" && clientId && paypalConfigured ? (
                    <div className="mt-4">
                      {isProcessing ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#9b87f5] border-t-transparent" />
                          <span className="ml-2 text-sm">Processing payment...</span>
                        </div>
                      ) : (
                        <PayPalScriptProvider options={{ 
                          clientId: clientId,
                          components: "buttons",
                          intent: "capture",
                          currency: "USD",
                          "data-client-token": "abc123xyz==",
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
                            onCancel={() => {
                              toast.info("Payment cancelled");
                            }}
                          />
                        </PayPalScriptProvider>
                      )}
                    </div>
                  ) : (
                    <Button
                      className={cn(
                        "w-full gap-2 bg-[#9b87f5] hover:bg-[#8a70f0] text-white",
                        plan.id === "free" && "bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white dark:border-gray-700",
                        (!paypalConfigured && plan.id !== "free") && "opacity-50 cursor-not-allowed"
                      )}
                      disabled={isLoading || currentPlan === plan.id || (!paypalConfigured && plan.id !== "free")}
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
