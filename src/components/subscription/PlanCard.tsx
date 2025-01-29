import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check } from "lucide-react";
import { useFirebase } from "@/contexts/FirebaseContext";
import { toast } from "sonner";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useEffect, useState } from "react";
import { getPayPalClientId } from "@/utils/firebaseUtils";

interface PlanFeature {
  name: string;
  included: boolean;
}

interface PlanProps {
  id: string;
  name: string;
  price: number;
  description: string;
  features: PlanFeature[];
  isPopular?: boolean;
}

const PlanCard = ({ id, name, price, description, features, isPopular }: PlanProps) => {
  const { user } = useFirebase();
  const [paypalClientId, setPaypalClientId] = useState<string>("");

  useEffect(() => {
    const fetchPayPalClientId = async () => {
      const clientId = await getPayPalClientId();
      if (clientId) {
        setPaypalClientId(clientId);
      } else {
        toast.error("PayPal configuration not found");
      }
    };

    fetchPayPalClientId();
  }, []);

  const handlePayPalApprove = async (data: any, actions: any) => {
    try {
      const order = await actions.order.capture();
      
      const response = await fetch('https://us-central1-chromarx-215c8.cloudfunctions.net/handleSubscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user?.getIdToken()}`,
        },
        body: JSON.stringify({
          orderId: order.id,
          planId: id,
          paymentDetails: order,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process subscription');
      }

      toast.success("Successfully subscribed to " + name);
    } catch (error) {
      console.error('Payment processing error:', error);
      toast.error("Failed to process payment");
    }
  };

  return (
    <Card className={`relative ${isPopular ? 'border-primary' : ''}`}>
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
        <div className="mb-4">
          <span className="text-3xl font-bold">${price.toFixed(2)}</span>
          <span className="text-muted-foreground">/month</span>
        </div>
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li
              key={index}
              className="flex items-center text-sm text-muted-foreground"
            >
              {feature.included ? (
                <Check className="h-4 w-4 text-primary mr-2" />
              ) : (
                <span className="h-4 w-4 mr-2" />
              )}
              {feature.name}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        {price === 0 ? (
          <Button className="w-full" variant="outline">
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
                style={{ layout: "horizontal" }}
                createOrder={(data, actions) => {
                  return actions.order.create({
                    intent: "CAPTURE",
                    purchase_units: [{
                      amount: {
                        value: price.toString(),
                        currency_code: "USD"
                      },
                      description: `${name} Subscription`
                    }]
                  });
                }}
                onApprove={handlePayPalApprove}
                onError={() => {
                  toast.error("PayPal payment failed");
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