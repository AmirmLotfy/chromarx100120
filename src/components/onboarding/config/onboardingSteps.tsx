import { BookMarked, Bookmark, Settings, Zap, CreditCard, LogIn } from "lucide-react";
import { OnboardingStepConfig } from "../types/onboarding";
import PlanCard from "../../subscription/PlanCard";
import { subscriptionPlans } from "@/config/subscriptionPlans";
import { useState } from "react";

const createOnboardingSteps = (
  setCurrentStep: (step: number) => void,
  handleImportBookmarks: () => Promise<void>,
  handleComplete: () => void,
  handleSignIn: () => void,
  handleSubscribe: (planId: string) => Promise<void>
): OnboardingStepConfig[] => {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  return [
    {
      title: "Welcome to ChroMarx",
      description: "Your Gemini-Powered Bookmark Manager – Organize, Optimize, Excel!",
      icon: "/lovable-uploads/cab9ee44-1599-487e-86b9-4c7b064cf78e.png",
      primaryAction: {
        label: "Get Started",
        onClick: () => setCurrentStep(2),
      },
    },
    {
      title: "Sign in with ChroMarx",
      description: "Access your bookmarks across devices and unlock personalized features",
      icon: LogIn,
      primaryAction: {
        label: "Sign in",
        onClick: () => {
          chrome.tabs.create({
            url: "https://chromarx.it.com/login"
          });
        },
      },
    },
    {
      title: "Import Your Bookmarks",
      description: "Bring your existing bookmarks into ChroMarx for better organization",
      icon: BookMarked,
      primaryAction: {
        label: "Import Bookmarks",
        onClick: handleImportBookmarks,
      },
    },
    {
      title: "Explore Key Features",
      description: "Discover what makes ChroMarx special",
      icon: Zap,
      content: (
        <div className="space-y-6 my-4">
          <div className="flex items-start space-x-4">
            <Bookmark className="w-6 h-6 text-primary mt-1" />
            <div>
              <h3 className="font-medium text-lg">Smart Bookmarking</h3>
              <p className="text-muted-foreground">Organize bookmarks with AI-powered categorization</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <Settings className="w-6 h-6 text-primary mt-1" />
            <div>
              <h3 className="font-medium text-lg">Customizable Workspace</h3>
              <p className="text-muted-foreground">Personalize your experience with themes and layouts</p>
            </div>
          </div>
        </div>
      ),
      primaryAction: {
        label: "Next",
        onClick: () => setCurrentStep(5),
      },
    },
    {
      title: "Choose Your Plan",
      description: "Select a plan that fits your needs",
      icon: CreditCard,
      content: (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {subscriptionPlans.map((plan) => (
            <PlanCard 
              key={plan.id}
              {...plan}
              isSelected={selectedPlanId === plan.id}
              onSelect={setSelectedPlanId}
              onSubscribe={async (planId) => {
                await handleSubscribe(planId);
                handleComplete();
              }}
            />
          ))}
        </div>
      ),
      primaryAction: selectedPlanId === 'free' ? {
        label: "Complete Setup",
        onClick: async () => {
          await handleSubscribe('free');
          handleComplete();
        },
      } : undefined
    }
  ];
};

export default createOnboardingSteps;
