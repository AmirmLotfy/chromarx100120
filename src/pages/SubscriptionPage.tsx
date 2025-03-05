import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { storage } from "@/services/storageService";
import { toast } from "sonner";
import { 
  Card, CardContent, CardDescription, 
  CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Book, ListChecks, Sparkles, FileText 
} from "lucide-react";
import { useNavigate } from 'react-router-dom';

// Define interfaces for the usage data
interface UsageMetric {
  used: number;
  limit: number;
  percentage: number;
}

interface UsageData {
  [key: string]: UsageMetric;
}

const SubscriptionPage = () => {
  const [subscription, setSubscription] = useState<{ planId: string; status: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const navigate = useNavigate();
  
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    const loadSubscription = async () => {
      try {
        const sub = await storage.get<{ planId: string; status: string }>('user_subscription');
        setSubscription(sub);
      } catch (error) {
        console.error("Failed to load subscription:", error);
        toast.error("Failed to load subscription");
      }
    };

    const loadUsage = async () => {
      try {
        const usage = await storage.get('usage');
        setUsageData(usage);
      } catch (error) {
        console.error("Failed to load usage:", error);
        toast.error("Failed to load usage data");
      }
    };

    loadSubscription();
    loadUsage();
  }, []);

  const handleSubscribe = async (planId: string) => {
    setLoading(true);
    try {
      // Simulate subscription process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update subscription status in storage
      await storage.set('user_subscription', {
        planId: planId,
        status: 'active'
      });

      setSubscription({ planId: planId, status: 'active' });
      toast.success(`Subscribed to ${planId} plan!`);
      navigate('/subscription/history');
    } catch (error) {
      console.error("Failed to subscribe:", error);
      toast.error("Failed to subscribe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fix the button variant type
  return (
    <Layout>
      <div className="container max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-3">
            Subscription
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Manage your subscription plan and track your usage
          </p>
        </div>
        
        <div className="space-y-6 mb-8">
          <h2 className="text-2xl font-medium">Choose Your Plan</h2>
          
          <Card>
            <CardHeader>
              <CardTitle>Free</CardTitle>
              <CardDescription>
                Ideal for getting started. Limited features.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2">
                <li>5 Bookmarks</li>
                <li>2 Notes</li>
                <li>10 AI Requests</li>
                <li>Basic Support</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Pro</CardTitle>
              <CardDescription>
                For professional users. Enhanced features and higher limits.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2">
                <li>Unlimited Bookmarks</li>
                <li>Unlimited Notes</li>
                <li>500 AI Requests</li>
                <li>Priority Support</li>
              </ul>
            </CardContent>
            <Button 
              variant={subscription?.planId === 'basic' ? 'outline' : 'secondary'}
              className="w-full mb-4"
              onClick={() => handleSubscribe('basic')}
              disabled={loading || subscription?.planId === 'basic'}
            >
              {loading 
                ? 'Subscribing...' 
                : subscription?.planId === 'basic' 
                  ? 'Current Plan' 
                  : 'Subscribe to Pro'}
            </Button>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Premium</CardTitle>
              <CardDescription>
                For power users. Full access to all features and unlimited usage.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2">
                <li>Unlimited Bookmarks</li>
                <li>Unlimited Notes</li>
                <li>Unlimited AI Requests</li>
                <li>24/7 Premium Support</li>
              </ul>
            </CardContent>
            <Button 
              variant={subscription?.planId === 'premium' ? 'outline' : 'secondary'}
              className="w-full"
              onClick={() => handleSubscribe('premium')}
              disabled={loading || subscription?.planId === 'premium'}
            >
              {loading 
                ? 'Subscribing...' 
                : subscription?.planId === 'premium' 
                  ? 'Current Plan' 
                  : 'Subscribe to Premium'}
            </Button>
          </Card>
        </div>
              
        {/* Fix the usage metrics type casting */}
        <div className="space-y-6 mb-8">
          <h3 className="text-lg font-medium">Your Usage</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Bookmarks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{usageData?.bookmarks?.used} / {usageData?.bookmarks?.limit}</span>
                    <span>{usageData?.bookmarks?.percentage}%</span>
                  </div>
                  <Progress 
                    value={usageData?.bookmarks?.percentage} 
                    className="h-2" 
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{usageData?.notes?.used} / {usageData?.notes?.limit}</span>
                    <span>{usageData?.notes?.percentage}%</span>
                  </div>
                  <Progress 
                    value={usageData?.notes?.percentage} 
                    className="h-2" 
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">AI Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{usageData?.aiRequests?.used} / {usageData?.aiRequests?.limit}</span>
                    <span>{usageData?.aiRequests?.percentage}%</span>
                  </div>
                  <Progress 
                    value={usageData?.aiRequests?.percentage} 
                    className="h-2" 
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{usageData?.tasks?.used} / {usageData?.tasks?.limit}</span>
                    <span>{usageData?.tasks?.percentage}%</span>
                  </div>
                  <Progress 
                    value={usageData?.tasks?.percentage} 
                    className="h-2" 
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="mt-8 bg-muted/40 rounded-lg p-6">
          <h3 className="font-medium mb-2">Subscription Benefits</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Unlock additional features and higher usage limits by upgrading your subscription plan.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Book className="h-5 w-5 text-blue-500" />
              <div>
                <h4 className="font-medium">Unlimited Bookmarks</h4>
                <p className="text-sm text-muted-foreground">Save all your favorite resources.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-green-500" />
              <div>
                <h4 className="font-medium">Unlimited Notes</h4>
                <p className="text-sm text-muted-foreground">Keep track of your thoughts and ideas.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-orange-500" />
              <div>
                <h4 className="font-medium">Enhanced AI Features</h4>
                <p className="text-sm text-muted-foreground">Get more from AI with higher request limits.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <ListChecks className="h-5 w-5 text-purple-500" />
              <div>
                <h4 className="font-medium">Priority Support</h4>
                <p className="text-sm text-muted-foreground">Get faster assistance when you need it.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SubscriptionPage;
