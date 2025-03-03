
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useSubscription } from "@/hooks/use-subscription";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { 
  Check, X, CreditCard, ArrowRight, Info, Settings, 
  Shield, Zap, Award, RefreshCw, ChevronDown, ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { 
  checkPayPalConfiguration, 
  verifyPayPalPayment, 
  checkSubscriptionStatus, 
  SubscriptionStatus 
} from "@/utils/chromeUtils";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { subscriptionPlans } from "@/config/subscriptionPlans";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// Filter plans to only show free and basic plans
const availablePlans = subscriptionPlans.filter(
  plan => plan.id === "free" || plan.id === "basic"
);

const SubscriptionPage = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [autoRenew, setAutoRenew] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [expandedFeatures, setExpandedFeatures] = useState<string | null>(null);
  const [expandedUsage, setExpandedUsage] = useState(false);
  
  // PayPal configuration states
  const [paypalConfigured, setPaypalConfigured] = useState(false);
  const [paypalMode, setPaypalMode] = useState<'sandbox' | 'live'>('sandbox');
  const [clientId, setClientId] = useState<string | null>(null);
  const [isCheckingConfig, setIsCheckingConfig] = useState(true);
  
  const { currentPlan, setSubscriptionPlan } = useSubscription();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const loadConfig = async () => {
      setIsCheckingConfig(true);
      try {
        // Check PayPal configuration
        const config = await checkPayPalConfiguration();
        console.log("PayPal config:", config);
        setPaypalConfigured(config.configured);
        setPaypalMode(config.mode);
        setClientId(config.clientId);
        
        // Check current subscription status
        if (user?.id) {
          const status = await checkSubscriptionStatus(user.id);
          if (status) {
            setSubscriptionStatus(status);
            setAutoRenew(!status.subscription.cancel_at_period_end);
          }
        }
      } catch (error) {
        console.error("Failed to load configuration:", error);
        setPaypalConfigured(false);
      } finally {
        setIsCheckingConfig(false);
      }
    };
    
    loadConfig();
  }, [user?.id]);

  // Toggle feature expansion
  const toggleFeatures = (planId: string) => {
    if (expandedFeatures === planId) {
      setExpandedFeatures(null);
    } else {
      setExpandedFeatures(planId);
    }
  };

  // Handle plan selection
  const handlePlanSelect = (planId: string) => {
    if (planId === currentPlan) {
      toast.info("You are already subscribed to this plan");
      return;
    }
    
    if (planId === "free") {
      handleSubscribe(planId);
      return;
    }
    
    if (!paypalConfigured && planId !== "free") {
      toast.error("PayPal is not configured. Please set up your PayPal credentials first.");
      return;
    }
    
    setSelectedPlan(planId);
  };

  // Handle subscription update
  const handleSubscribe = async (planId: string) => {
    try {
      setIsLoading(true);
      await setSubscriptionPlan(planId);
      toast.success(`Successfully subscribed to ${planId} plan`);
      
      if (planId === "free") {
        setSelectedPlan(null);
      }
      
      if (user?.id) {
        const status = await checkSubscriptionStatus(user.id);
        if (status) {
          setSubscriptionStatus(status);
        }
      }
    } catch (error) {
      console.error("Error subscribing to plan:", error);
      toast.error("Failed to update subscription");
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate to PayPal configuration page
  const goToPayPalConfig = () => {
    navigate('/paypal-config');
  };

  // Handle auto-renew toggle
  const handleAutoRenewToggle = async () => {
    if (!user?.id || !subscriptionStatus) return;
    
    try {
      const newValue = !autoRenew;
      setAutoRenew(newValue);
      
      const { error } = await supabase
        .from('subscriptions')
        .update({ cancel_at_period_end: !newValue })
        .eq('user_id', user.id);
        
      if (error) {
        toast.error("Failed to update auto-renewal setting");
        setAutoRenew(!newValue);
        return;
      }
      
      setSubscriptionStatus({
        ...subscriptionStatus,
        subscription: {
          ...subscriptionStatus.subscription,
          cancel_at_period_end: !newValue
        }
      });
      
      toast.success(newValue ? 
        "Auto-renewal enabled. Your subscription will renew automatically." : 
        "Auto-renewal disabled. Your subscription will expire at the end of the billing period."
      );
    } catch (error) {
      console.error("Error updating auto-renewal:", error);
      toast.error("Failed to update auto-renewal setting");
      setAutoRenew(!autoRenew);
    }
  };

  // PayPal order creation
  const createOrder = async (data: any, actions: any) => {
    const plan = subscriptionPlans.find(p => p.id === selectedPlan);
    if (!plan) return "";
    
    const amount = billingPeriod === 'yearly' 
      ? plan.pricing.yearly 
      : plan.pricing.monthly;
    
    return actions.order.create({
      purchase_units: [{
        amount: {
          value: amount.toFixed(2),
          currency_code: "USD"
        },
        description: `ChromarX ${plan.name} Plan Subscription (${billingPeriod})`
      }],
      application_context: {
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
        return_url: window.location.href,
        cancel_url: window.location.href
      }
    });
  };

  // PayPal payment approval handler
  const onApprove = async (data: any, actions: any) => {
    try {
      setIsProcessing(true);
      
      const details = await actions.order.capture();
      console.log("PayPal payment completed:", details);
      
      if (details.status === "COMPLETED" && selectedPlan) {
        // Verify payment with backend
        const paymentVerified = await verifyPayPalPayment(details.id, selectedPlan, autoRenew);
        
        if (paymentVerified) {
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
      setSelectedPlan(null); // Reset selection after process completes
    }
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Calculate savings percentage
  const calculateSavings = (plan: typeof availablePlans[0]) => {
    if (billingPeriod === 'monthly' || !plan.pricing.yearly) return 0;
    const monthlyCost = plan.pricing.monthly * 12;
    const yearlyCost = plan.pricing.yearly;
    const savings = monthlyCost - yearlyCost;
    return Math.round((savings / monthlyCost) * 100);
  };

  // Render subscription card for current active plan
  const renderCurrentSubscription = () => {
    if (!subscriptionStatus || subscriptionStatus.subscription.plan_id === 'free') {
      return null;
    }

    return (
      <Card className="mb-6 overflow-hidden shadow-sm border border-[#9b87f5]/20 bg-gradient-to-b from-white/80 to-white dark:from-[#22272E]/80 dark:to-[#22272E] backdrop-blur">
        <CardHeader className="bg-[#9b87f5]/10 border-b border-[#9b87f5]/20 py-3">
          <CardTitle className="text-sm flex items-center text-[#9b87f5] dark:text-[#7E69AB]">
            <Award className="h-4 w-4 mr-2" />
            Current Subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/40 p-3">
              <div className="text-xs text-muted-foreground mb-1">Plan</div>
              <div className="font-medium">
                {subscriptionStatus.subscription.plan_id === 'basic' ? 'Pro' : 'Premium'} Plan
              </div>
            </div>
            <div className="rounded-lg bg-muted/40 p-3">
              <div className="text-xs text-muted-foreground mb-1">Status</div>
              <div className="font-medium flex items-center">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1.5"></span>
                <span className="capitalize">{subscriptionStatus.subscription.status}</span>
              </div>
            </div>
          </div>
          
          <div className="rounded-lg bg-muted/40 p-3">
            <div className="text-xs text-muted-foreground mb-1">Period</div>
            <div className="font-medium">
              {formatDate(subscriptionStatus.subscription.current_period_start)} to {formatDate(subscriptionStatus.subscription.current_period_end)}
            </div>
          </div>
          
          <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Auto-renewal</div>
              <div className="font-medium">
                {autoRenew ? 'Enabled' : 'Disabled'}
              </div>
            </div>
            <Switch
              checked={autoRenew}
              onCheckedChange={handleAutoRenewToggle}
              className="ml-2 data-[state=checked]:bg-[#9b87f5]"
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render usage limits card
  const renderUsageLimits = () => {
    if (!subscriptionStatus) return null;

    return (
      <Card className="mb-6 overflow-hidden shadow-sm bg-background/80 backdrop-blur">
        <CardHeader 
          className="p-4 border-b flex items-center justify-between cursor-pointer" 
          onClick={() => setExpandedUsage(!expandedUsage)}
        >
          <CardTitle className="text-sm flex items-center">
            <Zap className="h-4 w-4 mr-2 text-amber-500" />
            Your Usage Limits
          </CardTitle>
          {expandedUsage ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </CardHeader>
        
        {expandedUsage && (
          <CardContent className="p-4 space-y-4">
            {Object.entries(subscriptionStatus.usageLimits).map(([key, usage]) => (
              <div key={key} className="space-y-1.5">
                <div className="flex justify-between mb-1 items-center">
                  <span className="text-sm font-medium capitalize">
                    {key === 'aiRequests' ? 'AI Requests' : key}
                  </span>
                  <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                    {usage.used} / {usage.limit < 0 ? '∞' : usage.limit}
                  </span>
                </div>
                <Progress 
                  value={usage.limit < 0 ? 0 : usage.percentage} 
                  className={cn(
                    "h-2",
                    usage.percentage >= 90 ? "bg-red-100 dark:bg-red-900" : 
                    usage.percentage >= 70 ? "bg-amber-100 dark:bg-amber-900" : 
                    "bg-emerald-100 dark:bg-emerald-900"
                  )}
                />
              </div>
            ))}
            
            {subscriptionStatus.needsUpgrade && (
              <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 text-sm">
                <div className="flex items-start gap-3">
                  <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="mb-2">You're approaching your usage limits. Upgrade to get more resources.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePlanSelect('basic')}
                      className="border-amber-300 dark:border-amber-700 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-800/40 w-full"
                    >
                      <Zap className="h-3.5 w-3.5 mr-1.5" />
                      Upgrade Now
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    );
  };

  // Render PayPal error card when not configured
  const renderPayPalError = () => {
    if (isCheckingConfig || paypalConfigured) return null;

    return (
      <Card className="mb-6 overflow-hidden shadow-sm border border-amber-300 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/20 backdrop-blur">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-amber-800 dark:text-amber-400 mb-1">PayPal Not Configured</h3>
              <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                Set up your PayPal credentials to enable payment processing. Paid plans won't be available until this is configured.
              </p>
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full justify-center bg-white dark:bg-amber-900/30 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/50"
                onClick={goToPayPalConfig}
              >
                <Settings className="h-4 w-4 mr-2" />
                Configure PayPal
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Layout>
      <div className="bg-gradient-to-b from-[#F2FCE2] to-white dark:from-[#1A1F2C] dark:to-[#22272E] min-h-screen pt-2">
        <div className="container max-w-md mx-auto px-4 py-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight mb-2">
              Choose Your Plan
            </h1>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Select the plan that fits your productivity needs
            </p>
          </div>

          {/* Current Subscription Card */}
          {renderCurrentSubscription()}

          {/* Usage Limits Card */}
          {renderUsageLimits()}

          {/* PayPal Configuration Error */}
          {renderPayPalError()}

          {/* Billing Period Toggle */}
          <div className="relative z-0 mx-auto rounded-full bg-muted/40 backdrop-blur-sm p-1 mb-6 max-w-[260px] flex items-center justify-between">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                billingPeriod === 'monthly' 
                  ? 'bg-white dark:bg-gray-800 shadow-sm' 
                  : 'text-muted-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                billingPeriod === 'yearly' 
                  ? 'bg-white dark:bg-gray-800 shadow-sm' 
                  : 'text-muted-foreground'
              }`}
            >
              <span>Yearly</span>
              <span className="ml-1.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-[10px] px-1.5 py-0.5 rounded-full font-medium">Save 20%</span>
            </button>
          </div>

          {/* Subscription Plans */}
          <div className="space-y-5">
            {availablePlans.map((plan) => {
              const isCurrent = currentPlan === plan.id;
              const isSelected = selectedPlan === plan.id;
              const savings = calculateSavings(plan);
              const price = billingPeriod === 'yearly' ? plan.pricing.yearly : plan.pricing.monthly;
              
              return (
                <Card 
                  key={plan.id}
                  className={cn(
                    "relative overflow-hidden transition-all duration-200 shadow-sm bg-white dark:bg-[#22272E] border",
                    (isSelected || isCurrent) 
                      ? "border-[#9b87f5] dark:border-[#7E69AB] shadow-[0_0_0_1px_rgba(155,135,245,0.2)]" 
                      : "border-border"
                  )}
                >
                  {plan.id === "basic" && (
                    <div className="absolute top-0 right-0 left-0 bg-[#9b87f5] dark:bg-[#7E69AB] text-white text-xs font-medium py-1 text-center">
                      RECOMMENDED
                    </div>
                  )}
                  
                  <CardContent className="p-4 pt-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold">
                          {plan.id === "basic" ? "Pro" : plan.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {plan.description}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-baseline">
                        <span className="text-2xl font-bold">
                          {price === 0 
                            ? "Free" 
                            : `$${price.toFixed(2)}`}
                        </span>
                        {price > 0 && (
                          <span className="text-muted-foreground text-xs ml-1">
                            /{billingPeriod === 'yearly' ? 'year' : 'month'}
                          </span>
                        )}
                      </div>
                      
                      {savings > 0 && (
                        <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                          Save {savings}% with annual billing
                        </div>
                      )}
                    </div>
                    
                    {/* Feature list */}
                    <div className="w-full">
                      <button 
                        onClick={() => toggleFeatures(plan.id)}
                        className="w-full flex items-center justify-between py-2 text-sm font-medium"
                      >
                        Plan Features
                        {expandedFeatures === plan.id ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                      
                      {expandedFeatures === plan.id && (
                        <ul className="space-y-2.5 text-sm py-2 border-t mt-2">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-start gap-2 py-1">
                              {feature.included ? (
                                <Check className="h-4 w-4 text-green-500 dark:text-green-400 shrink-0 mt-0.5" />
                              ) : (
                                <X className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
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
                      )}
                    </div>
                    
                    {/* Subscription Actions */}
                    {isSelected && plan.id !== "free" ? (
                      <div className="mt-1">
                        <div className="flex items-center mb-3">
                          <Switch
                            checked={autoRenew}
                            onCheckedChange={setAutoRenew}
                            id={`auto-renew-${plan.id}`}
                            className="data-[state=checked]:bg-[#9b87f5]"
                          />
                          <label 
                            htmlFor={`auto-renew-${plan.id}`}
                            className="ml-2 text-sm cursor-pointer"
                          >
                            Auto-renew subscription
                          </label>
                        </div>
                        
                        {isProcessing ? (
                          <div className="bg-muted/30 rounded-lg p-4 flex items-center justify-center">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#9b87f5] border-t-transparent mr-2" />
                            <span className="text-sm">Processing payment...</span>
                          </div>
                        ) : (clientId && paypalConfigured) ? (
                          <div>
                            <PayPalScriptProvider options={{ 
                              clientId: clientId || "",
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
                                onCancel={() => {
                                  toast.info("Payment cancelled");
                                  setSelectedPlan(null);
                                }}
                              />
                            </PayPalScriptProvider>
                            
                            <div className="mt-3 flex justify-end">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedPlan(null)}
                                className="text-xs"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-center text-sm text-amber-800 dark:text-amber-400">
                            <p>PayPal is not configured. Please configure PayPal first.</p>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="mt-2 border-amber-300 dark:border-amber-800"
                              onClick={goToPayPalConfig}
                            >
                              <Settings className="h-3.5 w-3.5 mr-1.5" />
                              Configure PayPal
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Button
                        className={cn(
                          "w-full gap-2 justify-center",
                          plan.id === "basic" ? 
                            "bg-[#9b87f5] hover:bg-[#8a70f0] text-white" :
                            "bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white dark:border-gray-700",
                          (!paypalConfigured && plan.id !== "free") && "opacity-50 pointer-events-none"
                        )}
                        disabled={isLoading || isCurrent}
                        onClick={() => handlePlanSelect(plan.id)}
                      >
                        {isCurrent ? (
                          <span className="flex items-center">
                            <Check className="h-4 w-4 mr-1.5" />
                            Current Plan
                          </span>
                        ) : (
                          <>
                            {plan.id === "free" ? "Downgrade" : "Upgrade"}
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-8 mb-6">
            <Shield className="h-3 w-3" />
            <span>Secure payment processing via PayPal</span>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SubscriptionPage;

