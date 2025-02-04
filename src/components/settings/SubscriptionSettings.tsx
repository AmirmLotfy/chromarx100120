import Layout from "@/components/Layout";
import PlanCard from "@/components/subscription/PlanCard";
import { subscriptionPlans } from "@/config/subscriptionPlans";
import { chromeDb } from "@/lib/chrome-storage";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const SubscriptionSettings = () => {
  const { user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const subscriptionData = await chromeDb.get<any>('subscriptions');
        if (subscriptionData && subscriptionData[user.id]) {
          setCurrentPlan(subscriptionData[user.id].planId || 'basic');
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

  if (isLoading) {
    return (
      <Layout>
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-72 mx-auto mt-2" />
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-96 w-full" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight mb-4">
            Choose Your Plan
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Select the plan that best fits your needs. All plans include our core
            features with additional capabilities as you upgrade.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {subscriptionPlans.map((plan) => (
            <PlanCard 
              key={plan.id} 
              {...plan} 
              isSelected={currentPlan === plan.id}
            />
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default SubscriptionSettings;