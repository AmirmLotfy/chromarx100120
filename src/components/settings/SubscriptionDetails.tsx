import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useFirebase } from "@/contexts/FirebaseContext";
import { chromeDb } from "@/lib/chrome-storage";
import { getPlanById, subscriptionPlans } from "@/config/subscriptionPlans";
import { ArrowUpCircle, Calendar, CreditCard } from "lucide-react";
import { toast } from "sonner";

interface SubscriptionData {
  status: string;
  planId: string;
  createdAt: string;
  endDate: string;
  usage: {
    bookmarks: number;
    tasks: number;
    notes: number;
  };
}

const SubscriptionDetails = () => {
  const { user } = useFirebase();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      if (!user) return;

      try {
        const subscriptionDoc = await chromeDb.get<SubscriptionData>('subscriptions');
        
        if (subscriptionDoc) {
          setSubscriptionData(subscriptionDoc);
        }
      } catch (error) {
        console.error('Error fetching subscription data:', error);
        toast.error('Failed to load subscription details');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionData();
  }, [user]);

  const currentPlan = subscriptionData ? getPlanById(subscriptionData.planId) : null;

  const handleUpgrade = () => {
    window.location.href = '/plans';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Details</CardTitle>
          <CardDescription>Loading your subscription information...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Details</CardTitle>
        <CardDescription>
          Manage your subscription and monitor usage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {subscriptionData && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Current Plan</div>
                <div className="font-medium">{currentPlan?.name || 'Free'}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Status</div>
                <div className="font-medium capitalize">{subscriptionData.status}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Renewal Date</div>
                <div className="font-medium">{new Date(subscriptionData.endDate).toLocaleDateString()}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-sm font-medium">Usage Overview</div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Bookmarks</span>
                  <span>{subscriptionData.usage.bookmarks} / {currentPlan?.limits?.bookmarks || 'Unlimited'}</span>
                </div>
                <Progress value={
                  currentPlan?.limits?.bookmarks 
                    ? (subscriptionData.usage.bookmarks / currentPlan.limits.bookmarks) * 100 
                    : 0
                } />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Tasks</span>
                  <span>{subscriptionData.usage.tasks} / {currentPlan?.limits?.tasks || 'Unlimited'}</span>
                </div>
                <Progress value={
                  currentPlan?.limits?.tasks 
                    ? (subscriptionData.usage.tasks / currentPlan.limits.tasks) * 100 
                    : 0
                } />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Notes</span>
                  <span>{subscriptionData.usage.notes} / {currentPlan?.limits?.notes || 'Unlimited'}</span>
                </div>
                <Progress value={
                  currentPlan?.limits?.notes 
                    ? (subscriptionData.usage.notes / currentPlan.limits.notes) * 100 
                    : 0
                } />
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={handleUpgrade}
              >
                <ArrowUpCircle className="h-4 w-4" />
                Upgrade Plan
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => window.location.href = '/settings'}
              >
                <CreditCard className="h-4 w-4" />
                Manage Payment
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => window.location.href = '/subscription'}
              >
                <Calendar className="h-4 w-4" />
                View Billing History
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionDetails;