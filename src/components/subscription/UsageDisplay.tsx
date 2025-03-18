
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useSubscription } from "@/hooks/use-subscription";
import { usageTracker } from "@/utils/usageTracker";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PlanLimits, subscriptionPlans } from "@/config/subscriptionPlans";
import { Button } from "@/components/ui/button";
import { AlertCircle, Infinity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";

interface UsageMetric {
  used: number;
  limit: number;
  percentage: number;
}

interface UsageDisplayProps {
  showUpgradeButton?: boolean;
}

export function UsageDisplay({ showUpgradeButton = true }: UsageDisplayProps) {
  const { subscription, isProPlan } = useSubscription();
  const [usageMetrics, setUsageMetrics] = useState<Record<keyof PlanLimits, UsageMetric> | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>("overview");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsageMetrics = async () => {
      try {
        setLoading(true);
        const metrics = await usageTracker.getAllUsageMetrics();
        setUsageMetrics(metrics);
      } catch (error) {
        console.error("Error fetching usage metrics:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsageMetrics();
  }, [subscription]);
  
  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 75) return "bg-amber-500";
    return "bg-green-500";
  };
  
  const formatLimit = (limit: number) => {
    return limit === -1 ? "∞" : limit.toString();
  };
  
  const isNearLimit = (percentage: number) => {
    return percentage >= 80;
  };

  const groupedMetrics = usageMetrics ? {
    bookmarks: {
      title: "Bookmarks",
      metrics: [
        { name: "Storage", key: "bookmarks" as keyof PlanLimits },
        { name: "Imports", key: "bookmarkImports" as keyof PlanLimits },
        { name: "Categorization", key: "bookmarkCategorization" as keyof PlanLimits },
        { name: "Summaries", key: "bookmarkSummaries" as keyof PlanLimits },
        { name: "Keyword Extraction", key: "keywordExtraction" as keyof PlanLimits }
      ]
    },
    tasks: {
      title: "Tasks",
      metrics: [
        { name: "Storage", key: "tasks" as keyof PlanLimits },
        { name: "Duration Estimates", key: "taskEstimation" as keyof PlanLimits }
      ]
    },
    notes: {
      title: "Notes",
      metrics: [
        { name: "Storage", key: "notes" as keyof PlanLimits },
        { name: "Sentiment Analysis", key: "noteSentimentAnalysis" as keyof PlanLimits }
      ]
    },
    ai: {
      title: "AI Features",
      metrics: [
        { name: "AI Requests", key: "aiRequests" as keyof PlanLimits }
      ]
    }
  } : null;
  
  // Get a list of resources that are near their limit
  const nearLimitResources = usageMetrics ? 
    Object.entries(usageMetrics)
      .filter(([_, metric]) => metric.limit > 0 && metric.percentage >= 80)
      .map(([key]) => key) : 
    [];
  
  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Resource Usage</CardTitle>
          <CardDescription>Loading your current resource usage...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={0} className="animate-pulse" />
            <Progress value={0} className="animate-pulse" />
            <Progress value={0} className="animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Resource Usage</CardTitle>
            <CardDescription>
              Your monthly resource usage and limits
            </CardDescription>
          </div>
          
          {isProPlan() ? (
            <Badge variant="outline" className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white">
              Pro Plan
            </Badge>
          ) : (
            showUpgradeButton && (
              <Button
                onClick={() => navigate('/plans')}
                size="sm"
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
              >
                Upgrade to Pro
              </Button>
            )
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!isProPlan() && nearLimitResources.length > 0 && (
          <Alert variant="warning" className="mb-4 bg-amber-50 border-amber-200 text-amber-800">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>You're approaching your usage limits</AlertTitle>
            <AlertDescription>
              You're nearing the limit on {nearLimitResources.length === 1 ? 'a resource' : 'several resources'}.
              Consider upgrading to Pro for unlimited usage.
            </AlertDescription>
          </Alert>
        )}
        
        <Tabs defaultValue="overview" value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="ai">AI</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            {usageMetrics && Object.entries(usageMetrics)
              .filter(([_, metric]) => metric.limit !== -1) // Only show limited resources in overview
              .sort((a, b) => b[1].percentage - a[1].percentage) // Sort by percentage used, highest first
              .slice(0, 5) // Show top 5
              .map(([key, metric]) => (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{formatLimitName(key as keyof PlanLimits)}</span>
                    <span className={isNearLimit(metric.percentage) ? "text-red-500 font-medium" : ""}>
                      {metric.used} / {formatLimit(metric.limit)}
                    </span>
                  </div>
                  <Progress 
                    value={metric.percentage} 
                    className={`h-2 ${isNearLimit(metric.percentage) ? getUsageColor(metric.percentage) : ""}`} 
                  />
                </div>
              ))
            }
            
            {isProPlan() && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
                <div className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400">
                  <Infinity className="h-5 w-5" />
                  <span className="font-medium">Unlimited resources with Pro plan</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  You have unlimited access to all features with your Pro subscription.
                </p>
              </div>
            )}
          </TabsContent>
          
          {groupedMetrics && Object.entries(groupedMetrics).map(([group, { title, metrics }]) => (
            <TabsContent key={group} value={group} className="space-y-4">
              <h3 className="text-lg font-medium mb-2">{title} Usage</h3>
              
              {metrics.map(({ name, key }) => {
                const metric = usageMetrics?.[key];
                if (!metric) return null;
                
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{name}</span>
                      <span className={isNearLimit(metric.percentage) ? "text-red-500 font-medium" : ""}>
                        {metric.used} / {metric.limit === -1 ? (
                          <span className="flex items-center">
                            <Infinity className="h-4 w-4 inline mr-1" />
                            <span>Unlimited</span>
                          </span>
                        ) : metric.limit}
                      </span>
                    </div>
                    
                    {metric.limit === -1 ? (
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                        <div className="h-full w-full bg-gradient-to-r from-indigo-400 to-purple-400"></div>
                      </div>
                    ) : (
                      <Progress 
                        value={metric.percentage} 
                        className={`h-2 ${isNearLimit(metric.percentage) ? getUsageColor(metric.percentage) : ""}`} 
                      />
                    )}
                  </div>
                );
              })}
              
              {isProPlan() && (
                <p className="text-sm text-gray-500 italic mt-4">
                  You have unlimited access to all {title.toLowerCase()} features with your Pro subscription.
                </p>
              )}
            </TabsContent>
          ))}
        </Tabs>
        
        <div className="mt-6 text-xs text-gray-500 dark:text-gray-400">
          <p>Monthly limits reset at the beginning of each calendar month.</p>
          {!isProPlan() && (
            <p className="mt-1">
              Upgrade to Pro for unlimited usage of all features.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to format limit names for display
function formatLimitName(key: keyof PlanLimits): string {
  const nameMap: Record<string, string> = {
    bookmarks: 'Bookmarks',
    bookmarkImports: 'Bookmark Imports',
    bookmarkCategorization: 'AI Categorization',
    bookmarkSummaries: 'Page Summaries',
    keywordExtraction: 'Keyword Extraction',
    tasks: 'Tasks',
    taskEstimation: 'Task Estimates',
    notes: 'Notes',
    noteSentimentAnalysis: 'Sentiment Analysis',
    aiRequests: 'AI Requests'
  };
  
  return nameMap[key] || key;
}

export default UsageDisplay;
