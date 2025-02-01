import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PlanCard from "@/components/subscription/PlanCard";
import { subscriptionPlans } from "@/config/subscriptionPlans";
import { useFirebase } from "@/contexts/FirebaseContext";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";

const SubscriptionSettings = () => {
  const { user } = useFirebase();
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setCurrentPlan(userDoc.data()?.currentPlan || 'basic');
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
        toast.error('Failed to load subscription details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscription();
  }, [user]);

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      toast.error("Please sign in to subscribe");
      return;
    }
    
    console.log("Processing subscription for plan:", planId);
    // The actual subscription processing is handled by PlanCard component
    // through PayPal integration
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-96 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

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
              isSelected={currentPlan === plan.id}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionSettings;