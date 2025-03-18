
import { useSubscription } from "@/hooks/use-subscription";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, AlertTriangle, Clock, Calendar, CreditCard } from "lucide-react";

interface SubscriptionStatusProps {
  showUpgradeButton?: boolean;
  showDetails?: boolean;
  compact?: boolean;
}

export function SubscriptionStatus({ 
  showUpgradeButton = true, 
  showDetails = true,
  compact = false
}: SubscriptionStatusProps) {
  const { 
    subscription, 
    isSubscriptionActive,
    isInGracePeriod,
    isProPlan,
    daysUntilExpiration
  } = useSubscription();
  const navigate = useNavigate();

  if (!subscription) {
    return null;
  }
  
  // If compact mode, show a minimal version
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {isProPlan() ? (
          <Badge variant="outline" className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white">
            Pro
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
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-medium text-lg flex items-center gap-2">
            Subscription Status
            {isProPlan() ? (
              <Badge variant="outline" className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white">
                Pro Plan
              </Badge>
            ) : (
              <Badge variant="outline">Free Plan</Badge>
            )}
          </h3>
          
          <div className="flex items-center mt-1 text-sm text-gray-500">
            {isInGracePeriod() ? (
              <div className="flex items-center text-amber-600">
                <AlertTriangle className="h-4 w-4 mr-1" />
                <span>Payment Required</span>
              </div>
            ) : isSubscriptionActive() ? (
              <div className="flex items-center text-green-600">
                <ShieldCheck className="h-4 w-4 mr-1" />
                <span>Active</span>
              </div>
            ) : subscription.status === 'canceled' ? (
              <div className="flex items-center text-gray-600">
                <Clock className="h-4 w-4 mr-1" />
                <span>Canceled</span>
              </div>
            ) : (
              <div className="flex items-center text-red-600">
                <AlertTriangle className="h-4 w-4 mr-1" />
                <span>Expired</span>
              </div>
            )}
          </div>
        </div>
        
        {showUpgradeButton && !isProPlan() && (
          <Button 
            onClick={() => navigate('/plans')}
            size="sm"
            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
          >
            Upgrade to Pro
          </Button>
        )}
      </div>
      
      {showDetails && (
        <div className="space-y-3 text-sm">
          {isProPlan() && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Billing Cycle:</span>
                </div>
                <span className="font-medium capitalize">{subscription.billingCycle}</span>
              </div>
            
              <div className="flex items-center justify-between">
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
                  {daysUntilExpiration() === 0
                    ? "Today"
                    : daysUntilExpiration() === 1
                    ? "1 day"
                    : `${daysUntilExpiration()} days`}
                </span>
              </div>
            
              {subscription.paymentMethod && (
                <div className="flex items-center justify-between">
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
            
              {isInGracePeriod() && (
                <div className="mt-2 p-2 bg-amber-50 text-amber-800 rounded flex items-start gap-2">
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
                <div className="mt-2 p-2 bg-gray-50 text-gray-700 rounded flex items-start gap-2">
                  <Clock className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Subscription ending</p>
                    <p className="text-xs mt-1">
                      Your subscription is set to cancel at the end of the current
                      billing period.
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-2"
                      onClick={() => navigate('/subscription')}
                    >
                      Manage Subscription
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
          
          {!isProPlan() && (
            <div className="mt-2 p-2 bg-gray-50 text-gray-700 rounded flex items-start gap-2">
              <ShieldCheck className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Free Plan</p>
                <p className="text-xs mt-1">
                  You're currently on the Free plan with limited features and usage.
                  Upgrade to Pro for unlimited access to all features.
                </p>
                {showUpgradeButton && (
                  <Button
                    size="sm"
                    className="mt-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                    onClick={() => navigate('/plans')}
                  >
                    Upgrade to Pro
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SubscriptionStatus;
