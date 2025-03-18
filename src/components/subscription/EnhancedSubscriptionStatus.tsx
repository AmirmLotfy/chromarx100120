
import { useEffect, useState } from "react";
import { useSubscription } from "@/hooks/use-subscription";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle, Clock, CreditCard, Calendar, ShieldCheck, Zap, Award, TrendingUp } from "lucide-react";
import { trackSubscriptionEvent, predictChurnRisk, getChurnReductionRecommendations } from "@/utils/subscriptionAnalytics";
import { toast } from "sonner";

interface EnhancedSubscriptionStatusProps {
  showUpgradeButton?: boolean;
  showDetails?: boolean;
  showAnalytics?: boolean;
  compact?: boolean;
}

export function EnhancedSubscriptionStatus({
  showUpgradeButton = true,
  showDetails = true,
  showAnalytics = false,
  compact = false
}: EnhancedSubscriptionStatusProps) {
  const {
    subscription,
    isSubscriptionActive,
    isInGracePeriod,
    isProPlan,
    daysUntilExpiration,
    loading,
    setAutoRenew
  } = useSubscription();
  
  const [churnRisk, setChurnRisk] = useState<number | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const navigate = useNavigate();

  // Track view of subscription status
  useEffect(() => {
    if (subscription && !loading) {
      // Track this view as an event
      trackSubscriptionEvent('viewed_pricing_page', {
        currentPlan: subscription.planId,
        status: subscription.status
      });
      
      // Get churn risk if showing analytics
      if (showAnalytics) {
        const getChurnData = async () => {
          const risk = await predictChurnRisk();
          setChurnRisk(risk);
          
          if (risk > 0.3) {
            const recs = await getChurnReductionRecommendations();
            setRecommendations(recs);
          }
        };
        
        getChurnData();
      }
    }
  }, [subscription, loading, showAnalytics]);

  if (loading) {
    return (
      <div className="rounded-lg border p-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  if (!subscription) {
    return null;
  }
  
  // If compact mode, show a minimal version
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {isProPlan() ? (
          <Badge variant="outline" className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white">
            <Award className="h-3 w-3 mr-1" /> Pro
          </Badge>
        ) : (
          <Badge variant="outline">Free</Badge>
        )}
        
        {isInGracePeriod() && (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Action Needed
          </Badge>
        )}
        
        {subscription.cancelAtPeriodEnd && (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
            <Clock className="h-3 w-3 mr-1" />
            Ending Soon
          </Badge>
        )}
      </div>
    );
  }

  // Calculate time remaining percentage for visualization
  const daysRemaining = daysUntilExpiration();
  const timeProgress = Math.max(0, Math.min(100, (30 - daysRemaining) / 30 * 100));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-semibold">
            Subscription Status
          </CardTitle>
          {isProPlan() ? (
            <Badge className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white">
              <Award className="h-3.5 w-3.5 mr-1" /> Pro Plan
            </Badge>
          ) : (
            <Badge variant="outline">Free Plan</Badge>
          )}
        </div>
        
        <CardDescription>
          {isInGracePeriod() ? (
            <div className="flex items-center text-amber-600 font-medium">
              <AlertTriangle className="h-4 w-4 mr-1" />
              <span>Grace Period - Action Required</span>
            </div>
          ) : isSubscriptionActive() ? (
            <div className="flex items-center text-green-600 font-medium">
              <CheckCircle className="h-4 w-4 mr-1" />
              <span>Active</span>
            </div>
          ) : subscription.status === 'canceled' ? (
            <div className="flex items-center text-gray-600 font-medium">
              <Clock className="h-4 w-4 mr-1" />
              <span>Canceled</span>
            </div>
          ) : (
            <div className="flex items-center text-red-600 font-medium">
              <AlertTriangle className="h-4 w-4 mr-1" />
              <span>Expired</span>
            </div>
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {showDetails && (
          <>
            {isProPlan() && (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Billing Cycle:</span>
                  </div>
                  <span className="font-medium capitalize">{subscription.billingCycle}</span>
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>
                        {subscription.cancelAtPeriodEnd
                          ? "Cancels in:"
                          : isInGracePeriod()
                          ? "Grace period ends in:"
                          : "Renews in:"}
                      </span>
                    </div>
                    <span className="font-medium">
                      {daysRemaining === 0
                        ? "Today"
                        : daysRemaining === 1
                        ? "1 day"
                        : `${daysRemaining} days`}
                    </span>
                  </div>
                  
                  <Progress value={timeProgress} className={
                    daysRemaining < 3 
                      ? "h-2 bg-gray-100 text-red-500" 
                      : daysRemaining < 7 
                        ? "h-2 bg-gray-100 text-amber-500"
                        : "h-2 bg-gray-100 text-green-500"
                  } />
                  
                  {daysRemaining < 3 && !subscription.cancelAtPeriodEnd && (
                    <p className="text-xs text-red-600">
                      Your subscription will renew soon.
                    </p>
                  )}
                  
                  {daysRemaining < 3 && subscription.cancelAtPeriodEnd && (
                    <p className="text-xs text-red-600">
                      Your subscription is ending soon. Reactivate to keep Pro benefits.
                    </p>
                  )}
                </div>
                
                {subscription.paymentMethod && (
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <CreditCard className="h-4 w-4" />
                      <span>Payment Method:</span>
                    </div>
                    <span className="font-medium capitalize">
                      {subscription.paymentMethod.type === "card" && subscription.paymentMethod.brand && subscription.paymentMethod.lastFour
                        ? `${subscription.paymentMethod.brand} ****${subscription.paymentMethod.lastFour}`
                        : subscription.paymentMethod.type}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Zap className="h-4 w-4" />
                    <span>Auto-Renewal:</span>
                  </div>
                  <div className="flex items-center">
                    <Button 
                      variant={subscription.autoRenew ? "default" : "outline"} 
                      size="sm"
                      className={subscription.autoRenew ? "bg-green-600 hover:bg-green-700" : "text-gray-600"}
                      onClick={() => {
                        setAutoRenew(true).then(() => {
                          toast.success("Auto-renewal turned on");
                          trackSubscriptionEvent('change_auto_renew', {
                            autoRenew: true
                          });
                        });
                      }}
                    >
                      On
                    </Button>
                    <Button 
                      variant={!subscription.autoRenew ? "default" : "outline"} 
                      size="sm"
                      className={!subscription.autoRenew ? "bg-red-600 hover:bg-red-700" : "text-gray-600"}
                      onClick={() => {
                        setAutoRenew(false).then(() => {
                          toast.success("Auto-renewal turned off");
                          trackSubscriptionEvent('change_auto_renew', {
                            autoRenew: false
                          });
                        });
                      }}
                    >
                      Off
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        
        {isInGracePeriod() && (
          <div className="p-3 bg-amber-50 text-amber-800 rounded-md flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Payment failed</p>
              <p className="text-xs mt-1">
                We couldn't process your last payment. Please update your
                payment method to keep your Pro benefits.
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-2 bg-amber-200 hover:bg-amber-300 text-amber-900"
                onClick={() => navigate('/subscription')}
              >
                Update Payment
              </Button>
            </div>
          </div>
        )}
        
        {subscription.cancelAtPeriodEnd && !isInGracePeriod() && (
          <div className="p-3 bg-gray-50 text-gray-700 rounded-md flex items-start gap-2">
            <Clock className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Subscription ending</p>
              <p className="text-xs mt-1">
                Your subscription will end on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}. 
                Reactivate to keep all your Pro features.
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-2"
                onClick={() => {
                  setAutoRenew(true).then(() => {
                    toast.success("Subscription reactivated successfully");
                    trackSubscriptionEvent('subscription_renewed', {
                      planId: subscription.planId
                    });
                  });
                }}
              >
                Reactivate Subscription
              </Button>
            </div>
          </div>
        )}
        
        {!isProPlan() && (
          <div className="p-3 bg-gray-50 text-gray-700 rounded-md flex items-start gap-2">
            <ShieldCheck className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Free Plan</p>
              <p className="text-xs mt-1">
                You're currently on the Free plan with limited features.
                Upgrade to Pro for unlimited access and premium features.
              </p>
              {showUpgradeButton && (
                <Button
                  size="sm"
                  className="mt-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                  onClick={() => {
                    navigate('/plans');
                    trackSubscriptionEvent('viewed_pricing_page', {
                      source: 'subscription_status'
                    });
                  }}
                >
                  <Zap className="h-3.5 w-3.5 mr-1.5" />
                  Upgrade to Pro
                </Button>
              )}
            </div>
          </div>
        )}
        
        {showAnalytics && churnRisk !== null && churnRisk > 0.3 && recommendations.length > 0 && (
          <div className="p-3 bg-blue-50 text-blue-800 rounded-md flex items-start gap-2 mt-4">
            <TrendingUp className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Personalized Recommendations</p>
              <ul className="text-xs mt-1 list-disc pl-4 space-y-1">
                {recommendations.slice(0, 2).map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
              {recommendations.length > 2 && (
                <Button
                  variant="link"
                  size="sm"
                  className="mt-1 h-auto p-0 text-blue-600"
                  onClick={() => {
                    navigate('/subscription');
                    trackSubscriptionEvent('subscription_viewed', {
                      count: recommendations.length
                    });
                  }}
                >
                  See more recommendations
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-2">
        {isProPlan() ? (
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate('/subscription')}
          >
            Manage Subscription
          </Button>
        ) : (
          showUpgradeButton && (
            <Button 
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
              onClick={() => navigate('/plans')}
            >
              <Zap className="h-4 w-4 mr-2" />
              Upgrade to Pro
            </Button>
          )
        )}
      </CardFooter>
    </Card>
  );
}

export default EnhancedSubscriptionStatus;
