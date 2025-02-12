
import Layout from "@/components/Layout";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/stores/settingsStore";
import { subscriptionPlans } from "@/config/subscriptionPlans";
import { UserCircle, CreditCard, Settings, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { chromeDb } from "@/lib/chrome-storage";
import { toast } from "sonner";

const UserPage = () => {
  const navigate = useNavigate();
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('Guest User');

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await chromeDb.get('user');
        if (userData) {
          setUserName(userData.displayName || 'Guest User');
          if (userData.subscription) {
            setCurrentPlan(userData.subscription.planId);
            setSubscriptionEnd(userData.subscription.endDate);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        toast.error('Failed to load user data');
      }
    };

    loadUserData();
  }, []);

  const plan = subscriptionPlans.find(p => p.id === currentPlan);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Profile Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="h-6 w-6" />
                Profile Overview
              </CardTitle>
              <CardDescription>
                Manage your account settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{userName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {plan?.name || 'Free'} Plan
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/settings')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-6 w-6" />
                Subscription Details
              </CardTitle>
              <CardDescription>
                View and manage your subscription
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{plan?.name || 'Free'} Plan</h3>
                    <p className="text-sm text-muted-foreground">
                      {subscriptionEnd 
                        ? `Expires: ${new Date(subscriptionEnd).toLocaleDateString()}`
                        : 'No active subscription'}
                    </p>
                  </div>
                  <Button 
                    onClick={() => navigate('/subscription')}
                    variant="default"
                  >
                    {currentPlan === 'free' ? 'Upgrade Plan' : 'Manage Plan'}
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </div>

                {plan && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Plan Features:</h4>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li 
                          key={index}
                          className="text-sm flex items-center gap-2"
                        >
                          {feature.included ? (
                            <span className="text-green-500">✓</span>
                          ) : (
                            <span className="text-red-500">✗</span>
                          )}
                          {feature.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/settings')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  App Settings
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/subscription')}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Subscription Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default UserPage;
