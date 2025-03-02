import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { getPayPalClientId } from "@/utils/chromeUtils";
import { useEffect } from "react";

interface PlanFeature {
  name: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: PlanFeature[];
  cta: string;
  variant: "default" | "outline";
  popular?: boolean;
}

interface SubscriptionPlanCardProps {
  plan: Plan;
  isSelected: boolean;
  onSelect: (planId: string) => void;
  onSubscribe: (details: any) => Promise<void>;
  isProcessing: boolean;
}

const SubscriptionPlanCard = ({
  plan,
  isSelected,
  onSelect,
  onSubscribe,
  isProcessing
}: SubscriptionPlanCardProps) => {
  const [paypalClientId, setPaypalClientId] = useState<string>("");

  useEffect(() => {
    const fetchPayPalClientId = async () => {
      const clientId = await getPayPalClientId();
      if (clientId) {
        setPaypalClientId(clientId);
      } else {
        toast.error("Payment configuration not found");
      }
    };

    fetchPayPalClientId();
  }, []);

  const handlePlanSelect = () => {
    onSelect(plan.id);
  };

  return (
    <Card 
      className={`relative overflow-hidden transition-all duration-300 h-full ${
        plan.popular ? 'shadow-lg' : ''
      } ${isSelected ? 'ring-2 ring-primary scale-105' : 'hover:scale-[1.02]'}`}
      onClick={handlePlanSelect}
    >
      {/* Popular badge */}
      {plan.popular && (
        <div className="absolute right-0 top-0">
          <div className="bg-primary text-primary-foreground text-xs font-medium px-4 py-1 transform rotate-45 translate-x-[30%] translate-y-[30%] shadow-sm">
            Popular
          </div>
        </div>
      )}
      
      <CardHeader className="space-y-1 pb-4">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-bold">{plan.name}</h3>
        </div>
        <p className="text-muted-foreground text-sm">{plan.description}</p>
      </CardHeader>
      
      <CardContent className="pb-6">
        <div className="mb-6">
          {plan.price > 0 ? (
            <div className="flex items-baseline">
              <span className="text-4xl font-bold">${plan.price}</span>
              <span className="text-muted-foreground ml-1">/month</span>
            </div>
          ) : (
            <div className="flex items-baseline">
              <span className="text-4xl font-bold">Free</span>
              <span className="text-muted-foreground ml-1">forever</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {plan.features.map((feature, index) => (
            <div key={index} className="flex items-start">
              {feature.included ? (
                <Check className="h-5 w-5 text-primary shrink-0 mr-3 mt-0.5" />
              ) : (
                <X className="h-5 w-5 text-muted-foreground shrink-0 mr-3 mt-0.5" />
              )}
              <span className={feature.included ? "" : "text-muted-foreground"}>
                {feature.name}
              </span>
            </div>
          ))}
        </div>
      </CardContent>

      <CardFooter>
        {isSelected && plan.price > 0 && paypalClientId ? (
          <div className="w-full" onClick={(e) => e.stopPropagation()}>
            <PayPalScriptProvider 
              options={{ 
                clientId: paypalClientId,
                currency: "USD",
                intent: "capture",
                components: "buttons",
                disableFunding: "paypal" // Force card-only payment
              }}
            >
              <PayPalButtons
                style={{ 
                  layout: "vertical",
                  shape: "rect",
                  label: "pay",
                  height: 40,
                  color: "blue"
                }}
                fundingSource="card"
                createOrder={(_data, actions) => {
                  return actions.order.create({
                    intent: "CAPTURE",
                    purchase_units: [{
                      amount: {
                        value: plan.price.toString(),
                        currency_code: "USD"
                      },
                      description: `ChroMarx ${plan.name} Subscription`
                    }],
                    application_context: {
                      shipping_preference: "NO_SHIPPING",
                      user_action: "PAY_NOW",
                      brand_name: "ChroMarx",
                      landing_page: "BILLING",
                      payment_method: {
                        payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED"
                      },
                      return_url: chrome.runtime.getURL("index.html#/subscription/success")
                    }
                  });
                }}
                onApprove={async (data, actions) => {
                  if (!actions.order) return;
                  
                  try {
                    const details = await actions.order.capture();
                    await onSubscribe(details);
                  } catch (error) {
                    console.error('Payment capture error:', error);
                    toast.error("Failed to process payment");
                  }
                }}
                onError={() => {
                  toast.error("Payment processing failed");
                }}
                disabled={isProcessing}
              />
            </PayPalScriptProvider>
          </div>
        ) : (
          <Button 
            className="w-full" 
            variant={plan.variant}
            size="lg"
            disabled={isProcessing}
          >
            {plan.cta}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default SubscriptionPlanCard;
