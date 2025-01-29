import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PlanCard from "@/components/subscription/PlanCard";
import { plans } from "@/config/plans";

const SubscriptionSettings = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription</CardTitle>
        <CardDescription>
          Manage your subscription plan and billing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <PlanCard key={plan.id} {...plan} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionSettings;