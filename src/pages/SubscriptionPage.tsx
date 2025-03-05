
import { 
  Check, 
  X, 
  Shield, 
  Zap, 
  Star, 
  Calendar, 
  CreditCard, 
  FileClock, 
  FileText, 
  Receipt, 
  ArrowRight 
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { verifyPayPalPayment, checkSubscriptionStatus, checkAndShowUpgradeNotification, getPayPalClientId, getPayPalMode } from "@/utils/chromeUtils";
import { createPayPalOrder, capturePayPalOrder } from "@/utils/chromeUtils";
import { PayPalButtons } from "@paypal/react-paypal-js";

// Define the structure for subscription plans
const subscriptionPlans = [
  {
    id: "free",
    name: "Free",
    description: "Basic access to core features",
    price: 0,
    features: [
      "Limited bookmarks",
      "Standard analytics",
      "Community support",
    ],
    limits: {
      aiRequests: 10,
      bookmarks: 50,
      tasks: 20,
      notes: 30,
    },
  },
  {
    id: "basic",
    name: "Pro",
    description: "Enhanced features for serious users",
    price: 10,
    features: [
      "Unlimited bookmarks",
      "Advanced analytics",
      "Priority support",
      "AI-powered suggestions",
    ],
    limits: {
      aiRequests: 100,
      bookmarks: 500,
      tasks: 200,
      notes: 300,
    },
  },
  {
    id: "premium",
    name: "Premium",
    description: "Full access to all features and benefits",
    price: 20,
    features: [
      "Everything in Pro",
      "Exclusive content",
      "Personalized support",
      "Early access to new features",
    ],
    limits: {
      aiRequests: 1000,
      bookmarks: 5000,
      tasks: 2000,
      notes: 3000,
    },
  },
];

const SubscriptionPage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRenewing, setIsRenewing] = useState(false);
  const [autoRenew, setAutoRenew] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState("free");
  const [paypalClientId, setPaypalClientId] = useState("");
  const [paypalMode, setPaypalMode] = useState<"sandbox" | "live">("sandbox");
  const [isPayPalLoading, setIsPayPalLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    const loadSubscriptionData = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      try {
        const status = await checkSubscriptionStatus(user.id);
        setSubscriptionStatus(status);
        setAutoRenew(status?.subscription.cancel_at_period_end === false);
      } catch (error) {
        console.error("Failed to load subscription status:", error);
        toast({
          variant: "destructive",
          title: "Failed to load subscription status.",
          description: "Please try again later.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    const loadPayPalConfig = async () => {
      setIsPayPalLoading(true);
      try {
        const clientId = await getPayPalClientId();
        const mode = await getPayPalMode();
        setPaypalClientId(clientId);
        setPaypalMode(mode);
      } catch (error) {
        console.error("Failed to load PayPal configuration:", error);
        toast({
          variant: "destructive",
          title: "Failed to load PayPal configuration.",
          description: "Please check your PayPal settings.",
        });
      } finally {
        setIsPayPalLoading(false);
      }
    };

    if (user?.id) {
      loadSubscriptionData();
      loadPayPalConfig();
    }
  }, [user?.id, toast]);

  useEffect(() => {
    if (user?.id) {
      checkAndShowUpgradeNotification(user.id);
    }
  }, [user?.id]);

  const handleAutoRenewChange = async (newAutoRenew: boolean) => {
    setAutoRenew(newAutoRenew);
    setIsRenewing(true);

    try {
      // Simulate updating the subscription status
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSubscriptionStatus((prevStatus) => ({
        ...prevStatus,
        subscription: {
          ...prevStatus.subscription,
          cancel_at_period_end: !newAutoRenew,
        },
      }));

      toast({
        title: "Auto-renewal settings updated.",
        description: `Auto-renewal is now ${newAutoRenew ? "enabled" : "disabled"}.`,
      });
    } catch (error) {
      console.error("Failed to update auto-renewal settings:", error);
      toast({
        variant: "destructive",
        title: "Failed to update auto-renewal settings.",
        description: "Please try again later.",
      });
      setAutoRenew(!newAutoRenew);
    } finally {
      setIsRenewing(false);
    }
  };

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handlePaymentSuccess = async (orderId: string) => {
    setIsRenewing(true);
    try {
      const success = await verifyPayPalPayment(orderId, selectedPlan, autoRenew);
      if (success) {
        toast({
          title: "Payment successful!",
          description: "Your subscription has been successfully processed.",
        });
        // Reload subscription status
        if (user?.id) {
          const status = await checkSubscriptionStatus(user.id);
          setSubscriptionStatus(status);
        }
      } else {
        toast({
          variant: "destructive",
          title: "Payment verification failed.",
          description: "Please contact support.",
        });
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      toast({
        variant: "destructive",
        title: "Payment verification error.",
        description: "Please try again or contact support.",
      });
    } finally {
      setIsRenewing(false);
    }
  };

  const handleCreateOrder = async (data: any, actions: any) => {
    try {
      const order = await createPayPalOrder(
        selectedPlan,
        subscriptionPlans.find((plan) => plan.id === selectedPlan)?.price || 0
      );
      return order.id;
    } catch (error) {
      console.error("Failed to create order:", error);
      toast({
        variant: "destructive",
        title: "Failed to create order.",
        description: "Please try again later.",
      });
      return actions.reject();
    }
  };

  const handleApproveOrder = async (data: any, actions: any) => {
    try {
      const details = await capturePayPalOrder(data.orderID);
      if (details.status === "COMPLETED") {
        handlePaymentSuccess(details.id);
      } else {
        toast({
          variant: "destructive",
          title: "Payment not completed.",
          description: "Please try again.",
        });
      }
    } catch (error) {
      console.error("Failed to capture order:", error);
      toast({
        variant: "destructive",
        title: "Failed to capture order.",
        description: "Please try again later.",
      });
    }
  };

  const getPlanLimits = (planId: string) => {
    const plan = subscriptionPlans.find((p) => p.id === planId);
    return plan ? plan.limits : subscriptionPlans[0].limits;
  };

  const getUsagePercentage = (used: number, limit: number) => {
    return limit === 0 ? 0 : Math.min(100, Math.round((used / limit) * 100));
  };

  if (authLoading || isPayPalLoading) {
    return (
      <Layout>
        <div className="container max-w-4xl mx-auto px-4 py-12">
          <p>Loading subscription information...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-3">
                Subscription
              </h1>
              <p className="text-muted-foreground max-w-2xl">
                Manage your subscription plan and payment settings
              </p>
            </div>

            <Button asChild variant="outline">
              <Link
                to="/subscription/history"
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Payment History
              </Link>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <p>Loading subscription information...</p>
        ) : (
          <>
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Current Plan
                </CardTitle>
                <CardDescription>
                  {subscriptionStatus?.subscription
                    ? subscriptionPlans.find(
                        (plan) => plan.id === subscriptionStatus.subscription.plan_id
                      )?.name
                    : "Free"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {subscriptionStatus?.subscription ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">
                          Status
                        </div>
                        <div className="text-lg font-semibold">
                          {subscriptionStatus.subscription.status}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">
                          Next Billing Date
                        </div>
                        <div className="text-lg font-semibold">
                          {new Date(
                            subscriptionStatus.subscription.current_period_end
                          ).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Separator className="my-4" />
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium">Auto-Renewal</h4>
                        <p className="text-sm text-muted-foreground">
                          Automatically renew your subscription at the end of the
                          current period.
                        </p>
                      </div>
                      <Switch
                        checked={autoRenew}
                        onCheckedChange={handleAutoRenewChange}
                        disabled={isRenewing}
                      />
                    </div>
                  </>
                ) : (
                  <p>You are currently on the free plan.</p>
                )}
              </CardContent>
            </Card>

            <h2 className="text-2xl font-bold tracking-tight mb-4">
              Choose a Plan
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {subscriptionPlans.map((plan) => (
                <Card
                  key={plan.id}
                  className={cn(
                    "shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out",
                    selectedPlan === plan.id && "border-2 border-primary"
                  )}
                >
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold">
                      {plan.name}
                    </CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-2xl font-bold">
                      ${plan.price}
                      <span className="text-sm text-muted-foreground">/mo</span>
                    </div>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {plan.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                    <Button
                      className="w-full"
                      onClick={() => handlePlanSelect(plan.id)}
                      variant={selectedPlan === plan.id ? "primary" : "outline"}
                    >
                      {selectedPlan === plan.id ? "Selected" : "Choose Plan"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-8">
              <h2 className="text-2xl font-bold tracking-tight mb-4">
                Payment
              </h2>
              {selectedPlan !== "free" ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Selected Plan: {
                        subscriptionPlans.find((plan) => plan.id === selectedPlan)?.name
                      }</CardTitle>
                    <CardDescription>
                      Complete your purchase using PayPal
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {paypalClientId ? (
                      <PayPalButtons
                        createOrder={(data, actions) => handleCreateOrder(data, actions)}
                        onApprove={(data, actions) => handleApproveOrder(data, actions)}
                        disabled={isRenewing}
                      />
                    ) : (
                      <p>Loading PayPal...</p>
                    )}
                    {isRenewing && <p>Processing your payment...</p>}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="text-center">
                    <p>You are currently on the free plan.</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {subscriptionStatus && (
              <div className="mt-8">
                <h2 className="text-2xl font-bold tracking-tight mb-4">
                  Usage
                </h2>
                <Card>
                  <CardHeader>
                    <CardTitle>Plan Limits</CardTitle>
                    <CardDescription>
                      View your current usage and limits
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {Object.entries(
                      subscriptionStatus.usageLimits
                    ).map(([key, usage]) => (
                      <div key={key} className="mb-4">
                        <div className="flex justify-between items-center">
                          <div className="font-medium capitalize">{key}</div>
                          <div className="text-muted-foreground">
                            {usage.used} / {usage.limit}
                          </div>
                        </div>
                        <progress
                          className="w-full h-2 rounded-full"
                          value={usage.percentage}
                          max="100"
                        />
                        <div className="text-right text-muted-foreground text-sm">
                          {usage.percentage}%
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="mt-8 bg-muted/40 rounded-lg p-6">
              <h3 className="font-medium mb-2">Need Help?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                If you have any questions about your subscription or payments,
                please contact our support team at support@chromarx.it.com.
              </p>
              <div className="flex gap-3">
                <Button asChild variant="outline" size="sm">
                  <Link to="/subscription/terms">View Terms</Link>
                </Button>
                <Button size="sm" variant="secondary" asChild>
                  <a href="mailto:support@chromarx.it.com">
                    Contact Support
                  </a>
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default SubscriptionPage;
