
import { SubscriptionPlan } from "@/types/payment";
import { Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { subscriptionPlans } from "@/config/subscriptionPlans";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface PlanComparisonProps {
  onSelectPlan?: (planId: string) => void;
  showButtons?: boolean;
}

export default function PlanComparison({ onSelectPlan, showButtons = true }: PlanComparisonProps) {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  
  // Get the Free and Pro plans
  const freePlan = subscriptionPlans.find(p => p.id === 'free');
  const proPlan = subscriptionPlans.find(p => p.id === 'pro');
  
  if (!freePlan || !proPlan) {
    return null;
  }
  
  // Prepare comparison categories
  const categories = [
    {
      name: "Bookmark Management",
      features: [
        { name: "Basic bookmark organization", freePlan: true, proPlan: true },
        { name: "Duplicate detection", freePlan: true, proPlan: true },
        { name: "Full-text search", freePlan: true, proPlan: true },
        { name: "Limited bookmarks", freePlan: freePlan.limits.bookmarks, proPlan: "Unlimited" },
        { name: "Import bookmarks", freePlan: `${freePlan.limits.bookmarkImports} at once`, proPlan: "Unlimited" },
        { name: "AI categorization", freePlan: `${freePlan.limits.bookmarkCategorization}/month`, proPlan: "Unlimited" },
        { name: "Generate summaries", freePlan: `${freePlan.limits.bookmarkSummaries}/month`, proPlan: "Unlimited" },
        { name: "Extract keywords", freePlan: `${freePlan.limits.keywordExtraction}/month`, proPlan: "Unlimited" },
        { name: "Advanced bookmark cleanup", freePlan: false, proPlan: true },
      ]
    },
    {
      name: "Productivity Tools",
      features: [
        { name: "Basic task management", freePlan: true, proPlan: true },
        { name: "Limited tasks", freePlan: freePlan.limits.tasks, proPlan: "Unlimited" },
        { name: "AI task duration estimation", freePlan: `${freePlan.limits.taskEstimation}/month`, proPlan: "Unlimited" },
        { name: "Basic Pomodoro timer", freePlan: true, proPlan: true },
        { name: "Custom Pomodoro timer", freePlan: false, proPlan: true },
        { name: "Time tracking for tasks", freePlan: false, proPlan: true },
        { name: "Advanced task management", freePlan: false, proPlan: true },
      ]
    },
    {
      name: "Notes & AI",
      features: [
        { name: "Basic note taking", freePlan: true, proPlan: true },
        { name: "Limited notes", freePlan: freePlan.limits.notes, proPlan: "Unlimited" },
        { name: "Sentiment analysis", freePlan: `${freePlan.limits.noteSentimentAnalysis}/month`, proPlan: "Unlimited" },
        { name: "AI chat queries", freePlan: `${freePlan.limits.aiRequests}/month`, proPlan: "Unlimited" },
      ]
    },
    {
      name: "Analytics",
      features: [
        { name: "Basic productivity metrics", freePlan: true, proPlan: true },
        { name: "Advanced analytics", freePlan: false, proPlan: true },
        { name: "Domain-based insights", freePlan: false, proPlan: true },
        { name: "Time distribution charts", freePlan: false, proPlan: true },
        { name: "AI-generated productivity tips", freePlan: false, proPlan: true },
      ]
    }
  ];
  
  const handleSelectPlan = (planId: string) => {
    if (onSelectPlan) {
      onSelectPlan(planId);
    } else {
      navigate(`/plans?plan=${planId}&billing=${billingCycle}`);
    }
  };
  
  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="mb-6 flex justify-center">
        <div className="inline-flex rounded-md shadow-sm">
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
              billingCycle === 'monthly'
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setBillingCycle('monthly')}
          >
            Monthly
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
              billingCycle === 'yearly'
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setBillingCycle('yearly')}
          >
            Yearly
            <span className="ml-1 text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
              Save 17%
            </span>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1"></div>
        <div className="col-span-1 text-center">
          <h3 className="text-lg font-medium mb-1">Free</h3>
          <p className="text-2xl font-bold">$0</p>
          <p className="text-sm text-gray-500">Forever</p>
          {showButtons && (
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={() => handleSelectPlan('free')}
            >
              Get Started
            </Button>
          )}
        </div>
        <div className="col-span-1 text-center">
          <h3 className="text-lg font-medium mb-1">Pro</h3>
          <p className="text-2xl font-bold">
            ${billingCycle === 'monthly' ? proPlan.pricing.monthly : (proPlan.pricing.yearly / 12).toFixed(2)}
            <span className="text-sm font-normal">/mo</span>
          </p>
          <p className="text-sm text-gray-500">
            {billingCycle === 'monthly' ? 'Billed monthly' : `$${proPlan.pricing.yearly} billed yearly`}
          </p>
          {showButtons && (
            <Button
              className="mt-4 w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
              onClick={() => handleSelectPlan('pro')}
            >
              Upgrade to Pro
            </Button>
          )}
        </div>
      </div>
      
      <div className="mt-8 space-y-8">
        {categories.map((category) => (
          <Card key={category.name} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-gray-50 p-4 border-b">
                <h3 className="font-medium text-lg">{category.name}</h3>
              </div>
              
              <div className="divide-y">
                {category.features.map((feature) => (
                  <div key={feature.name} className="grid grid-cols-3 p-4">
                    <div className="col-span-1 flex items-center">
                      <span className="text-sm">{feature.name}</span>
                    </div>
                    <div className="col-span-1 flex justify-center items-center">
                      {/* Free Plan */}
                      {typeof feature.freePlan === 'boolean' ? (
                        feature.freePlan ? (
                          <Check className="h-5 w-5 text-green-500" />
                        ) : (
                          <X className="h-5 w-5 text-gray-300" />
                        )
                      ) : (
                        <span className="text-sm">{feature.freePlan}</span>
                      )}
                    </div>
                    <div className="col-span-1 flex justify-center items-center">
                      {/* Pro Plan */}
                      {typeof feature.proPlan === 'boolean' ? (
                        feature.proPlan ? (
                          <Check className="h-5 w-5 text-green-500" />
                        ) : (
                          <X className="h-5 w-5 text-gray-300" />
                        )
                      ) : (
                        <span className="text-sm font-medium">{feature.proPlan}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="mt-8 text-center">
        {showButtons && (
          <Button
            size="lg"
            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
            onClick={() => handleSelectPlan('pro')}
          >
            Upgrade to Pro
          </Button>
        )}
        <p className="mt-4 text-sm text-gray-500">
          All plans include a 7-day grace period if payment issues occur.
          <br />
          Pro plans can be canceled anytime. Your subscription will remain active until the end of your billing period.
        </p>
      </div>
    </div>
  );
}
