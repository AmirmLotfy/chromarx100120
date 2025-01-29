import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PlanCard from "@/components/subscription/PlanCard";
import { subscriptionPlans } from "@/config/subscriptionPlans";
import { useFirebase } from "@/contexts/FirebaseContext";
import { toast } from "sonner";

const SubscriptionSettings = () => {
  const { user } = useFirebase();

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      toast.error("Please sign in to subscribe");
      return;
    }
    
    console.log("Subscribing to plan:", planId);
    // Additional subscription logic will be handled by PlanCard component
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Subscription</CardTitle>
        <CardDescription>
          Choose the plan that best fits your needs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-6">
          {subscriptionPlans.map((plan) => (
            <PlanCard 
              key={plan.id} 
              {...plan} 
              onSubscribe={handleSubscribe}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionSettings;