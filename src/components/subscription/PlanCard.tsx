import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useEffect } from "react";
import { getPayPalClientId } from "@/utils/firebaseUtils";
import type { Plan } from "@/config/subscriptionPlans";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface PlanCardProps extends Plan {
  onSubscribe?: (planId: string) => void;
}

const PlanCard = ({ 
  id, 
  name, 
  pricing, 
  description, 
  features, 
  isPopular,
  onSubscribe 
}: PlanCardProps) => {
  const [paypalClientId, setPaypalClientId] = useState<string>("");
  const [isYearly, setIsYearly] = useState(false);
  
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

  const currentPrice = isYearly ? pricing.yearly : pricing.monthly;
  const priceLabel = isYearly ? "/year" : "/month";
  const savings = isYearly ? Math.round((pricing.monthly * 12 - pricing.yearly) / (pricing.monthly * 12) * 100) : 0;

  return (
    <Card className={`relative ${isPopular ? 'border-primary shadow-lg' : ''}`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-primary-foreground text-sm px-3 py-1 rounded-full">
            Most Popular
          </span>
        </div>
      )}
      
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="mb-6">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Label htmlFor={`${id}-billing-toggle`}>Monthly</Label>
            <Switch
              id={`${id}-billing-toggle`}
              checked={isYearly}
              onCheckedChange={setIsYearly}
            />
            <Label htmlFor={`${id}-billing-toggle`}>Yearly</Label>
          </div>
          
          <div className="text-center">
            <span className="text-3xl font-bold">${currentPrice.toFixed(2)}</span>
            <span className="text-muted-foreground">{priceLabel}</span>
            {isYearly && savings > 0 && (
              <p className="text-sm text-green-600 mt-1">Save {savings}%</p>
            )}
          </div>
        </div>

        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li
              key={index}
              className="flex items-center text-sm text-muted-foreground"
            >
              {feature.included ? (
                <Check className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
              ) : (
                <X className="h-4 w-4 text-muted-foreground mr-2 flex-shrink-0" />
              )}
              <span>{feature.name}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        {pricing.monthly === 0 ? (
          <Button 
            className="w-full" 
            variant="outline"
            onClick={() => onSubscribe?.(id)}
          >
            Get Started
          </Button>
        ) : (
          paypalClientId && (
            <PayPalScriptProvider options={{ 
              clientId: paypalClientId,
              currency: "USD",
              intent: "capture"
            }}>
              <PayPalButtons
                style={{ 
                  layout: "horizontal",
                  shape: "rect",
                  label: "subscribe"
                }}
                createOrder={(data, actions) => {
                  return actions.order.create({
                    purchase_units: [{
                      amount: {
                        value: currentPrice.toString(),
                        currency_code: "USD"
                      },
                      description: `${name} Subscription - ${isYearly ? 'Yearly' : 'Monthly'}`
                    }]
                  });
                }}
                onApprove={async (data, actions) => {
                  if (!actions.order) return;
                  
                  try {
                    const order = await actions.order.capture();
                    onSubscribe?.(id);
                    toast.success(`Successfully subscribed to ${name}`);
                  } catch (error) {
                    console.error('Payment processing error:', error);
                    toast.error("Failed to process payment");
                  }
                }}
                onError={() => {
                  toast.error("Payment failed");
                }}
              />
            </PayPalScriptProvider>
          )
        )}
      </CardFooter>
    </Card>
  );
};

export default PlanCard;