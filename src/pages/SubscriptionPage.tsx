
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import PageTitle from "@/components/PageTitle";
import { useSubscription } from "@/hooks/use-subscription";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Clock, CreditCard, HelpCircle, Shield, Star, Zap } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PayPalConfigForm from "@/components/settings/PayPalConfigForm";
import { useAuth } from "@/hooks/useAuth";
import PaymentHistory from "@/components/subscription/PaymentHistory";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { format, formatDistanceToNow } from "date-fns";
import { subscriptionPlans } from "@/config/subscriptionPlans";
import { Link } from "react-router-dom";

export default function SubscriptionPage() {
  const { 
    subscription, 
    currentPlan, 
    loading, 
    error, 
    cancelSubscription, 
    updatePaymentMethod, 
    setAutoRenew,
    changeBillingCycle,
    getRemainingUsage
  } = useSubscription();
  
  const [paymentMethod, setPaymentMethod] = useState<"card" | "paypal">("card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVC, setCardCVC] = useState("");
  const [cardName, setCardName] = useState("");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    subscription?.billingCycle || "monthly"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPayPalConfig, setShowPayPalConfig] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelType, setCancelType] = useState<"immediate" | "end_of_period">("end_of_period");
  const [usageStats, setUsageStats] = useState<any>(null);
  const { user } = useAuth();
  
  // For admin users only
  const isAdmin = user?.email === "admin@example.com";
  
  useEffect(() => {
    if (subscription) {
      setBillingCycle(subscription.billingCycle || "monthly");
      
      // Fetch usage stats
      const fetchUsage = async () => {
        const usage = await getRemainingUsage();
        setUsageStats(usage);
      };
      
      fetchUsage();
    }
  }, [subscription, getRemainingUsage]);
  
  const formatCardNumber = (value: string) => {
    const val = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = val.match(/\d{4,16}/g);
    const match = matches && matches[0] || "";
    const parts = [];
    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(" ");
    } else {
      return value;
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (paymentMethod === "card") {
        if (!cardNumber || !cardExpiry || !cardCVC || !cardName) {
          toast.error("Please fill all card details");
          return;
        }
        
        // Extract expiry month and year
        const [expiryMonth, expiryYear] = cardExpiry.split('/').map(part => parseInt(part.trim(), 10));
        
        if (isNaN(expiryMonth) || isNaN(expiryYear)) {
          toast.error("Invalid expiry date format");
          return;
        }
        
        // Get card brand based on first digits
        let brand = "unknown";
        if (cardNumber.startsWith('4')) {
          brand = 'visa';
        } else if (/^5[1-5]/.test(cardNumber)) {
          brand = 'mastercard';
        } else if (/^3[47]/.test(cardNumber)) {
          brand = 'amex';
        } else if (/^6(?:011|5)/.test(cardNumber)) {
          brand = 'discover';
        }
        
        await updatePaymentMethod({
          type: "card",
          lastFour: cardNumber.slice(-4),
          expiryMonth,
          expiryYear,
          brand
        });
        
        // Update billing cycle if changed
        if (subscription && subscription.billingCycle !== billingCycle) {
          await changeBillingCycle(billingCycle);
        }
        
        toast.success("Payment method updated successfully!");
        setShowPayPalConfig(false);
      } else {
        // PayPal flow would be handled by PayPal SDK in a real implementation
        toast.success("PayPal account connected successfully!");
        setShowPayPalConfig(false);
        
        // Update billing cycle if changed
        if (subscription && subscription.billingCycle !== billingCycle) {
          await changeBillingCycle(billingCycle);
        }
      }
    } catch (error) {
      console.error("Payment update error:", error);
      toast.error("Failed to update payment method");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setIsSubmitting(true);
      const result = await cancelSubscription(cancelType === "immediate");
      
      if (result.success) {
        setShowCancelDialog(false);
        toast.success(
          cancelType === "immediate"
            ? "Your subscription has been canceled immediately."
            : "Your subscription will be canceled at the end of your billing period."
        );
      } else {
        toast.error("Failed to cancel subscription");
      }
    } catch (error) {
      console.error("Cancel subscription error:", error);
      toast.error("Failed to cancel subscription");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleToggleAutoRenew = async () => {
    if (!subscription) return;
    
    try {
      const newAutoRenewValue = !subscription.autoRenew;
      const result = await setAutoRenew(newAutoRenewValue);
      
      if (result.success) {
        toast.success(
          newAutoRenewValue
            ? "Auto-renewal has been enabled"
            : "Auto-renewal has been disabled"
        );
      } else {
        toast.error("Failed to update auto-renewal settings");
      }
    } catch (error) {
      console.error("Auto-renew toggle error:", error);
      toast.error("Failed to update auto-renewal settings");
    }
  };
  
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown';
    return format(new Date(dateString), 'PPP');
  };
  
  const getTimeRemaining = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'Unknown';
    }
  };
  
  const getPlanName = (planId: string) => {
    const plan = subscriptionPlans.find(p => p.id === planId);
    return plan?.name || planId;
  };
  
  const getStatusBadge = (status: string | undefined) => {
    if (!status) return null;
    
    switch (status.toLowerCase()) {
      case 'active':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200">
            Active
          </Badge>
        );
      case 'canceled':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50 border-red-200">
            Canceled
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 hover:bg-gray-50 border-gray-200">
            Expired
          </Badge>
        );
      case 'grace_period':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-50 border-yellow-200">
            Grace Period
          </Badge>
        );
      case 'past_due':
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 hover:bg-orange-50 border-orange-200">
            Past Due
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">{status}</Badge>
        );
    }
  };

  return (
    <div className="container max-w-5xl py-6 space-y-6">
      <PageTitle title="Subscription" description="Manage your subscription and payment details" />
      
      {/* Admin Controls (only shown for admin users) */}
      {isAdmin && (
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="mr-2 h-5 w-5 text-blue-500" />
              Admin Controls
            </CardTitle>
            <CardDescription>
              Configure payment provider settings (admin only)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="paypal" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="paypal">PayPal</TabsTrigger>
                <TabsTrigger value="stripe" disabled>Stripe</TabsTrigger>
              </TabsList>
              
              <TabsContent value="paypal" className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">PayPal Integration</h3>
                    <p className="text-sm text-muted-foreground">Configure your PayPal API credentials</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select defaultValue="sandbox">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select environment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                        <SelectItem value="live">Live (Production)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm">
                      Test Connection
                    </Button>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <PayPalConfigForm />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
      
      {/* Loading state */}
      {loading && (
        <Card>
          <CardContent className="py-10">
            <div className="flex flex-col items-center justify-center">
              <p className="text-center mb-4">Loading subscription details...</p>
              <Progress value={undefined} className="w-full max-w-xs" />
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Error state */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Subscription</AlertTitle>
          <AlertDescription>
            {error.message || "An unexpected error occurred"}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Subscription Status */}
      {!loading && !error && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Subscription Status</CardTitle>
              <CardDescription>
                Your current plan and billing details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subscription ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium flex items-center">
                        {subscription.planId === 'pro' ? (
                          <Star className="mr-2 h-5 w-5 text-yellow-500" />
                        ) : (
                          <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />
                        )}
                        {getPlanName(subscription.planId)} Plan
                      </h3>
                      {subscription.status === 'active' && (
                        <p className="text-sm text-muted-foreground">
                          Renews {formatDate(subscription.currentPeriodEnd)} ({getTimeRemaining(subscription.currentPeriodEnd)})
                        </p>
                      )}
                      {subscription.status === 'grace_period' && (
                        <p className="text-sm text-red-500">
                          Grace period ends {formatDate(subscription.gracePeriodEndDate)} ({getTimeRemaining(subscription.gracePeriodEndDate)})
                        </p>
                      )}
                    </div>
                    {getStatusBadge(subscription.status)}
                  </div>
                  
                  {/* Warning message for grace period */}
                  {subscription.status === 'grace_period' && (
                    <Alert variant="warning" className="bg-yellow-50 text-yellow-800 border-yellow-300">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Payment Required</AlertTitle>
                      <AlertDescription>
                        We were unable to process your subscription renewal. Please update your payment method to avoid losing access to Pro features.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Billing Cycle</h4>
                      <p className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        {subscription.billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-1">
                        {subscription.status === 'active' ? 'Next Payment' : 'Last Payment'}
                      </h4>
                      <p>
                        {subscription.planId === 'pro' ? (
                          <>
                            ${subscription.billingCycle === 'yearly' ? '49.99' : '4.99'} on {formatDate(subscription.currentPeriodEnd)}
                          </>
                        ) : (
                          <>Free</>
                        )}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-1">Auto-Renewal</h4>
                      <div className="flex items-center">
                        {subscription.autoRenew ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Enabled
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            Disabled
                          </Badge>
                        )}
                        <Button variant="ghost" size="sm" onClick={handleToggleAutoRenew} className="ml-2">
                          {subscription.autoRenew ? 'Disable' : 'Enable'}
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {subscription.paymentMethod && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-medium mb-2">Payment Method</h4>
                        <div className="flex items-center">
                          <CreditCard className="mr-2 h-4 w-4 text-muted-foreground" />
                          {subscription.paymentMethod.type === 'card' 
                            ? (
                              <span>
                                {subscription.paymentMethod.brand?.charAt(0).toUpperCase() + subscription.paymentMethod.brand?.slice(1)} •••• {subscription.paymentMethod.lastFour} 
                                {subscription.paymentMethod.expiryMonth && subscription.paymentMethod.expiryYear && (
                                  <span className="text-muted-foreground ml-2">
                                    exp. {subscription.paymentMethod.expiryMonth}/{subscription.paymentMethod.expiryYear}
                                  </span>
                                )}
                              </span>
                            ) 
                            : 'PayPal'}
                        </div>
                      </div>
                    </>
                  )}
                  
                  {/* Usage limits for Free plan */}
                  {subscription.planId === 'free' && usageStats && (
                    <>
                      <Separator />
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium">Usage Limits</h4>
                          {usageStats.bookmarks !== -1 && usageStats.bookmarks <= 10 && (
                            <Button variant="outline" size="sm" asChild>
                              <Link to="/plans">Upgrade to Pro</Link>
                            </Button>
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          {[
                            { name: 'Bookmarks', key: 'bookmarks', limit: 50 },
                            { name: 'AI Requests', key: 'aiRequests', limit: 10 },
                            { name: 'Tasks', key: 'tasks', limit: 30 },
                            { name: 'Notes', key: 'notes', limit: 30 }
                          ].map((item) => {
                            const used = subscription.usage?.[item.key as keyof typeof subscription.usage] || 0;
                            const remaining = usageStats[item.key];
                            const percentage = Math.min(100, Math.max(0, (used / item.limit) * 100));
                            
                            return (
                              <div key={item.key} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span>{item.name}</span>
                                  <span>
                                    {used} / {item.limit}
                                  </span>
                                </div>
                                <Progress value={percentage} />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                  
                  {/* Pro Features */}
                  {subscription.planId === 'pro' && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-medium mb-2">Pro Features</h4>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {subscriptionPlans.find(p => p.id === 'pro')?.features
                            .filter(f => f.included)
                            .map((feature, index) => (
                              <li key={index} className="flex items-center">
                                <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                                <span>{feature.name}</span>
                                {feature.description && (
                                  <HelpCircle 
                                    className="ml-1 h-3 w-3 text-muted-foreground cursor-help" 
                                    title={feature.description}
                                  />
                                )}
                              </li>
                            ))}
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="py-4 text-center space-y-4">
                  <p>You are currently on the free plan.</p>
                  <Button asChild>
                    <Link to="/plans">Upgrade to Pro</Link>
                  </Button>
                </div>
              )}
            </CardContent>
            {subscription && subscription.planId !== 'free' && (
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setShowPayPalConfig(!showPayPalConfig)}>
                  Update Payment Method
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => setShowCancelDialog(true)}
                  disabled={subscription.status === 'canceled' || subscription.status === 'expired'}
                >
                  Cancel Subscription
                </Button>
              </CardFooter>
            )}
          </Card>
          
          {/* Cancellation Dialog */}
          <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cancel Subscription</DialogTitle>
                <DialogDescription>
                  Are you sure you want to cancel your Pro subscription?
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                <RadioGroup
                  value={cancelType}
                  onValueChange={(value) => setCancelType(value as "immediate" | "end_of_period")}
                  className="space-y-4"
                >
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="end_of_period" id="end_of_period" />
                    <div className="grid gap-1.5">
                      <Label htmlFor="end_of_period" className="font-medium">
                        Cancel at end of billing period
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        You'll have access to Pro features until {formatDate(subscription?.currentPeriodEnd)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="immediate" id="immediate" />
                    <div className="grid gap-1.5">
                      <Label htmlFor="immediate" className="font-medium">
                        Cancel immediately
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        You'll lose access to Pro features right away. No refund will be issued.
                      </p>
                    </div>
                  </div>
                </RadioGroup>
                
                <Alert className="mt-4 bg-amber-50 text-amber-800 border-amber-200">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>You'll lose access to Pro features</AlertTitle>
                  <AlertDescription>
                    Unlimited bookmarks, AI operations, and other Pro-only features will no longer be available once your subscription ends.
                  </AlertDescription>
                </Alert>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                  Keep Subscription
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleCancelSubscription}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Processing..." : "Confirm Cancellation"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Payment History */}
          {subscription && (
            <PaymentHistory />
          )}
          
          {/* Payment Update Form */}
          {showPayPalConfig && (
            <Card>
              <CardHeader>
                <CardTitle>Update Payment Method</CardTitle>
                <CardDescription>
                  Choose your preferred payment method
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmitPayment}>
                <CardContent className="space-y-6">
                  <RadioGroup 
                    value={paymentMethod} 
                    onValueChange={(value) => setPaymentMethod(value as "card" | "paypal")} 
                    className="flex flex-col space-y-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="card" id="card" />
                      <Label htmlFor="card" className="flex items-center">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Credit / Debit Card
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="paypal" id="paypal" />
                      <Label htmlFor="paypal">
                        <svg className="h-5 w-5 mr-2 inline" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M19.5904 6.59039C19.5904 4.42135 17.7523 2.84039 15.5251 2.84039H8.97191C7.50477 2.84039 6.22965 3.92568 6.00379 5.37044L4.01562 16.0998C3.85574 17.1623 4.68516 18.1139 5.76367 18.1139H8.82124L9.96121 10.7139C10.0513 10.1592 10.5327 9.76038 11.0983 9.76038H13.1393C16.7381 9.76038 19.5904 7.60987 19.5904 3.84039V6.59039Z" fill="#002C8A"/>
                          <path d="M21.9844 5.36962L20.0061 16.0998C19.8462 17.1623 19.0168 18.1139 17.9383 18.1139H14.8787L16.0188 10.7139C16.1088 10.1592 16.5902 9.76038 17.1558 9.76038H19.1968C19.6354 9.76038 19.9968 9.39896 19.9968 8.96039C19.9968 8.52182 19.6354 8.16039 19.1968 8.16039H17.1558C15.6878 8.16039 14.4219 9.24229 14.196 10.6846L13.0559 18.0846C12.9659 18.6393 13.2673 19.16 13.8105 19.16H17.9383C19.4055 19.16 20.6691 18.0747 20.895 16.6324L22.8732 5.90217C23.0332 4.83971 22.2037 3.88809 21.1253 3.88809H18.0656C17.627 3.88809 17.2656 4.24952 17.2656 4.68809C17.2656 5.12666 17.627 5.48809 18.0656 5.48809H20.2421C20.8312 5.48809 21.2637 5.88496 21.9844 5.36962Z" fill="#009BE1"/>
                          <path d="M5.76367 18.1139H3.83246C2.75395 18.1139 1.92453 17.1623 2.08441 16.0998L4.07258 5.37044C4.29844 3.92568 5.57356 2.84039 7.0407 2.84039H13.5938C14.0325 2.84039 14.3938 3.20182 14.3938 3.64039C14.3938 4.07896 14.0325 4.44039 13.5938 4.44039H7.0407C6.47512 4.44039 5.99371 4.83921 5.90359 5.39396L3.91543 16.1233C3.85041 16.5115 4.16184 16.5139 4.20383 16.5139H5.76367C6.20225 16.5139 6.56367 16.8753 6.56367 17.3139C6.56367 17.7525 6.20225 18.1139 5.76367 18.1139Z" fill="#001F6B"/>
                        </svg>
                        PayPal
                      </Label>
                    </div>
                  </RadioGroup>
                  
                  {paymentMethod === "card" ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name on Card</Label>
                        <Input
                          id="name"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          placeholder="John Smith"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input
                          id="cardNumber"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                          placeholder="1234 5678 9012 3456"
                          required
                          maxLength={19}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="expiry">Expiry Date</Label>
                          <Input
                            id="expiry"
                            value={cardExpiry}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^\d/]/g, '');
                              if (val.length === 2 && !val.includes('/') && cardExpiry.length === 1) {
                                setCardExpiry(`${val}/`);
                              } else {
                                setCardExpiry(val);
                              }
                            }}
                            placeholder="MM/YY"
                            required
                            maxLength={5}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="cvc">CVC</Label>
                          <Input
                            id="cvc"
                            value={cardCVC}
                            onChange={(e) => setCardCVC(e.target.value.replace(/[^\d]/g, ''))}
                            placeholder="123"
                            required
                            maxLength={3}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Billing Cycle</Label>
                        <RadioGroup 
                          value={billingCycle} 
                          onValueChange={(value) => setBillingCycle(value as "monthly" | "yearly")} 
                          className="flex flex-col space-y-3"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="monthly" id="monthly" />
                            <Label htmlFor="monthly" className="flex items-center">
                              <Clock className="mr-2 h-4 w-4" />
                              Monthly ($4.99/month)
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yearly" id="yearly" />
                            <Label htmlFor="yearly" className="flex items-center">
                              <Zap className="mr-2 h-4 w-4" />
                              Yearly ($49.99/year - 2 months free!)
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="mb-4">You'll be redirected to PayPal to complete the setup.</p>
                      <Button type="button" className="bg-[#0070ba] hover:bg-[#005ea6]">
                        <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M19.5904 6.59039C19.5904 4.42135 17.7523 2.84039 15.5251 2.84039H8.97191C7.50477 2.84039 6.22965 3.92568 6.00379 5.37044L4.01562 16.0998C3.85574 17.1623 4.68516 18.1139 5.76367 18.1139H8.82124L9.96121 10.7139C10.0513 10.1592 10.5327 9.76038 11.0983 9.76038H13.1393C16.7381 9.76038 19.5904 7.60987 19.5904 3.84039V6.59039Z" fill="white"/>
                          <path d="M21.9844 5.36962L20.0061 16.0998C19.8462 17.1623 19.0168 18.1139 17.9383 18.1139H14.8787L16.0188 10.7139C16.1088 10.1592 16.5902 9.76038 17.1558 9.76038H19.1968C19.6354 9.76038 19.9968 9.39896 19.9968 8.96039C19.9968 8.52182 19.6354 8.16039 19.1968 8.16039H17.1558C15.6878 8.16039 14.4219 9.24229 14.196 10.6846L13.0559 18.0846C12.9659 18.6393 13.2673 19.16 13.8105 19.16H17.9383C19.4055 19.16 20.6691 18.0747 20.895 16.6324L22.8732 5.90217C23.0332 4.83971 22.2037 3.88809 21.1253 3.88809H18.0656C17.627 3.88809 17.2656 4.24952 17.2656 4.68809C17.2656 5.12666 17.627 5.48809 18.0656 5.48809H20.2421C20.8312 5.48809 21.2637 5.88496 21.9844 5.36962Z" fill="white"/>
                          <path d="M5.76367 18.1139H3.83246C2.75395 18.1139 1.92453 17.1623 2.08441 16.0998L4.07258 5.37044C4.29844 3.92568 5.57356 2.84039 7.0407 2.84039H13.5938C14.0325 2.84039 14.3938 3.20182 14.3938 3.64039C14.3938 4.07896 14.0325 4.44039 13.5938 4.44039H7.0407C6.47512 4.44039 5.99371 4.83921 5.90359 5.39396L3.91543 16.1233C3.85041 16.5115 4.16184 16.5139 4.20383 16.5139H5.76367C6.20225 16.5139 6.56367 16.8753 6.56367 17.3139C6.56367 17.7525 6.20225 18.1139 5.76367 18.1139Z" fill="white"/>
                        </svg>
                        Continue with PayPal
                      </Button>
                      
                      <div className="space-y-3 mt-4">
                        <Label>Billing Cycle</Label>
                        <RadioGroup 
                          value={billingCycle} 
                          onValueChange={(value) => setBillingCycle(value as "monthly" | "yearly")} 
                          className="flex flex-col space-y-3"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="monthly" id="monthly_paypal" />
                            <Label htmlFor="monthly_paypal" className="flex items-center">
                              <Clock className="mr-2 h-4 w-4" />
                              Monthly ($4.99/month)
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yearly" id="yearly_paypal" />
                            <Label htmlFor="yearly_paypal" className="flex items-center">
                              <Zap className="mr-2 h-4 w-4" />
                              Yearly ($49.99/year - save $9.89!)
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="justify-between">
                  <Button variant="ghost" type="button" onClick={() => setShowPayPalConfig(false)}>
                    Cancel
                  </Button>
                  {paymentMethod === "card" && (
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Processing..." : "Update Payment Method"}
                    </Button>
                  )}
                </CardFooter>
              </form>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
